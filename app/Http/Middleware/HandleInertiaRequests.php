<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'id' => fn () => $request->session()->get('id'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => fn () => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ] : null,
                'roles' => fn () => $request->user()?->roleNames() ?? [],
                'permissions' => fn () => $request->user()?->permissionNames() ?? [],
            ],
            'flash' => [
                'success' => fn () => session('success'),
                'error' => fn () => session('error'),
                'analysis_errors' => fn () => session('analysis_errors'),
                'success_count' => fn () => $request->session()->get('success_count'),
                'total' => fn () => session('total'),
                'test_result' => $request->session()->get('test_result'),
                'interview_id' => fn () => $request->session()->get('interview_id'),
            ],
            'locale' => session('locale', config('app.locale')),
            'translations' => fn () => [
                'sidebar' => __('sidebar'),
                'briefs' => __('briefs'),
                'integrations' => __('integrations'),
                'candidats' => __('candidats'),
                'users' => __('users'),
                'roles' => __('roles'),
                'activity_logs' => __('activity_logs'),
                'errors' => __('errors'),
                'interviews' => __('interviews'),
                'parameters' => __('parameters'),
                'historique' => __('historique'),
                'sourcing_campaigns' => __('sourcing_campaigns'),
            ],
        ];
    }
}
