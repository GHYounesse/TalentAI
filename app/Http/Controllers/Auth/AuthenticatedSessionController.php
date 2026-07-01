<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'session.create',
                'Affichage de la page de connexion.',
            );

            return Inertia::render('auth/login', [
                'canResetPassword' => Route::has('password.request'),
                'status' => $request->session()->get('status'),
            ]);
        } catch (\Throwable $e) {
            $logger->log(
                'session.create.error',
                'Erreur lors de l\'affichage de la page de connexion : '.$e->getMessage(),
                ['exception' => $e->getMessage()]
            );

            throw $e;
        }
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $request->authenticate();
            $request->session()->regenerate();

            $logger->log(
                'session.store',
                'Connexion réussie de l\'utilisateur.',
                ['email' => $request->email]
            );

            return redirect()->intended(route('dashboard', absolute: false));
        } catch (\Throwable $e) {
            $logger->log(
                'session.store.error',
                'Échec de tentative de connexion.',
                []
            );

            throw $e;
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        /** @var ActivityLogger $logger */
        $logger = app(ActivityLogger::class);

        try {
            $logger->log(
                'session.destroy',
                'Déconnexion de l\'utilisateur.',
            );

            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/');
        } catch (\Throwable $e) {
            $logger->log(
                'session.destroy.error',
                'Erreur lors de la déconnexion : '.$e->getMessage(),
                ['exception' => $e->getMessage()]
            );

            throw $e;
        }
    }
}
