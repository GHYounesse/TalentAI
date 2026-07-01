<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('dashboard'))->name('dashboard')->middleware('can:dashboard.view');

    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        require __DIR__.'/briefs.php';
        require __DIR__.'/sourcing.php';
        require __DIR__.'/candidates.php';
        require __DIR__.'/interviews.php';
        require __DIR__.'/reports.php';
        require __DIR__.'/integrations.php';
        require __DIR__.'/classement.php';
        require __DIR__.'/CVAnalysis.php';
        require __DIR__.'/roles.php';
        require __DIR__.'/users.php';
        require __DIR__.'/activitylogs.php';
        require __DIR__.'/parameters.php';
        require __DIR__.'/historique.php';
        require __DIR__.'/sourcing_campaigns.php';

    });
});
