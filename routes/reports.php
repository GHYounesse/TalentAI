<?php

use Inertia\Inertia;

Route::get('/reports', fn () => Inertia::render('ComingSoon', [
    'title' => 'Rapports IA',
    'description' => 'Les rapports IA seront disponibles prochainement.',
]))->name('reports')->middleware('can:reports.view');
