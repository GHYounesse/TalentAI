<?php

use App\Http\Controllers\Candidat\CandidatController;

Route::resource('candidats', CandidatController::class);
Route::get('/candidats/{candidat}/historique', [CandidatController::class, 'historique'])->name('candidats.historique');
Route::post('/interviews/{interview}/decision', [CandidatController::class, 'decide'])->name('interviews.decide');
Route::post('/candidats/{candidat}/enrich-contact',
    [CandidatController::class, 'enrichContact']
)->name('candidats.enrich-contact');
