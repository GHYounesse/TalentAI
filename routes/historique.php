<?php

use App\Http\Controllers\HistoriqueController;
use Illuminate\Support\Facades\Route;

Route::get('/historique', [HistoriqueController::class, 'index'])
    ->name('historique.index');
