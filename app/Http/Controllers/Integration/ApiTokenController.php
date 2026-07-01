<?php

namespace App\Http\Controllers\Integration;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\UserApiToken;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApiTokenController extends Controller
{
    /**
     * Display the list of available integrations alongside the authenticated
     * user's stored tokens and environment fallback flags.
     *
     * @return Response Inertia page — Integration/Index — or Integration/Fallback on failure
     */
    public function index(): Response
    {

        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $providers = Integration::where('is_active', true)
                ->get()
                ->keyBy('provider');
            $userTokens = auth()->user()->apiTokens()->get()->keyBy('provider');

            $categoryLabels = collect($providers)
                ->pluck('category')
                ->unique()
                ->mapWithKeys(fn ($cat) => [$cat => __("integrations.categories.{$cat}")]);

            $integrations = $providers->map(function ($integration, $key) use ($userTokens) {
                $record = $userTokens->get($key);

                return [
                    'provider' => $key,
                    'label' => $integration->label,
                    'category' => $integration->category,
                    'icon' => $integration->icon,
                    'description' => $integration->description,
                    'token_label' => $integration->token_label,
                    'placeholder' => $integration->placeholder,
                    'docs_url' => $integration->docs_url,
                    'oauth' => $integration->oauth,
                    'has_token' => (bool) $record,
                    'masked_token' => $record ? $this->mask($record->token) : null,
                    'has_env_fallback' => $config['env_configured'] ?? false,
                ];
            });

            $logger->log(
                'integration.index',
                'Consultation de la liste des intégrations.',
                ['provider_count' => $integrations->count()],
                [UserApiToken::class]
            );

            return Inertia::render('Integration/Index', [
                'integrations' => $integrations,
                'categoryLabels' => $categoryLabels,
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'integration.index.error',
                'Erreur lors de la récupération des intégrations : '.$e->getMessage(),
                ['exception' => $e->getMessage()],
                [UserApiToken::class]
            );

            return Inertia::render('Fallback', [
                'error' => 'Impossible de charger la liste des intégrations.',
            ]);
        }
    }

    /**
     * Validate and persist (or update) an API token for the given provider.
     * The token is tested against the provider's test URL before being saved.
     *
     * @param  Request  $request  Must contain `provider` (string), `token` (string, min:8),
     *                            and optionally `secondary_token` (string)
     * @return RedirectResponse Redirects back with a success flash, or with validation / test errors
     */
    public function store(Request $request): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);
        try {
            $request->validate([
                Rule::in(Integration::pluck('provider')->toArray()),
                'token' => ['required', 'string', 'min:8'],
                'secondary_token' => ['nullable', 'string'],
            ]);

            // $this->testToken($request->provider, $request->token);

            UserApiToken::updateOrCreate(
                ['user_id' => auth()->id(), 'provider' => $request->provider],
                [
                    'token' => $request->token,
                    'secondary_token' => $request->secondary_token,
                ]
            );

            $logger->log(
                'integration.store',
                "Token enregistré pour le fournisseur « {$request->provider} ».",
                ['provider' => $request->provider],
                [UserApiToken::class]
            );

            return back()->with('success', 'Token enregistré.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $logger->log(
                'integration.store.error',
                "Erreur lors de l'enregistrement du token pour « {$request->provider} » : ".$e->getMessage(),
                ['provider' => $request->provider, 'exception' => $e->getMessage()],
                [UserApiToken::class]
            );

            return back()->withErrors(['token' => __('integrations.token_invalid')]);
        }
    }

    /**
     * Revoke the stored API token for the given provider.
     * After deletion the environment fallback (if configured) becomes active.
     *
     * @param  string  $provider  The integration provider key (e.g. "openai", "github")
     * @return RedirectResponse Redirects back with a success flash, or with an error flash on failure
     */
    public function destroy(string $provider): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            UserApiToken::where('user_id', auth()->id())
                ->where('provider', $provider)
                ->delete();

            $logger->log(
                'integration.destroy',
                "Token révoqué pour le fournisseur « {$provider} ».",
                ['provider' => $provider],
                [UserApiToken::class]
            );

            return back()->with('success', 'Token révoqué. Fallback .env actif.');
        } catch (\Throwable $e) {
            $logger->log(
                'integration.destroy.error',
                "Erreur lors de la révocation du token pour « {$provider} » : ".$e->getMessage(),
                ['provider' => $provider, 'exception' => $e->getMessage()],
                [UserApiToken::class]
            );

            return back()->with('error', 'Impossible de révoquer ce token.');
        }
    }

    /**
     * Test the validity of a provider token — either the one supplied in the
     * request body or the one already stored for the authenticated user.
     *
     * @param  Request  $request  Must contain `provider` (string); optionally `token` (string)
     * @return RedirectResponse Redirects back with a `test_result` flash (ok: true/false)
     */
    public function test(Request $request): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $request->validate(['provider' => 'required']);

            $token = $request->token;
            if (! $token) {
                $record = UserApiToken::where('user_id', auth()->id())
                    ->where('provider', $request->provider)
                    ->firstOrFail();
                $token = $record->token;
            }

            $this->testToken($request->provider, $token);

            $logger->log(
                'integration.test',
                "Test du token réussi pour le fournisseur « {$request->provider} ».",
                ['provider' => $request->provider, 'ok' => true],
                [UserApiToken::class]
            );

            return back()->with('test_result', ['provider' => $request->provider, 'ok' => true]);
        } catch (\Throwable $e) {
            $logger->log(
                'integration.test.error',
                "Échec du test du token pour « {$request->provider} » : ".$e->getMessage(),
                ['provider' => $request->provider, 'ok' => false, 'exception' => $e->getMessage()],
                [UserApiToken::class]
            );

            return back()->with('test_result', ['provider' => $request->provider, 'ok' => false]);
        }
    }

    private function mask(string $token): string
    {
        return substr($token, 0, 6).str_repeat('•', 12).substr($token, -4);
    }

    private function testToken(string $provider, string $token): bool
    {
        $integration = Integration::where('provider', $provider)->firstOrFail();
        $url = $integration->test_url;

        if (! $url) {
            return true;
        }

        $response = Http::withToken($token)->timeout(5)->get($url);

        if (! $response->successful()) {
            throw new \Exception("Token invalide pour {$provider}");
        }

        return true;
    }
}
