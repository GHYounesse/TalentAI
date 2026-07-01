<?php

use App\Http\Controllers\Brief\BriefController;
use App\Http\Controllers\Brief\BriefImportController;
use Illuminate\Support\Facades\Route;

Route::middleware('can:briefs.create')->group(function () {
    Route::get('/briefs/create', [BriefController::class, 'create'])->name('briefs.create');
    Route::post('/briefs', [BriefController::class, 'store'])->name('briefs.store');
});

Route::middleware('can:briefs.view')->group(function () {
    Route::get('/briefs', [BriefController::class, 'index'])->name('briefs.index');
    Route::get('/briefs/{brief}', [BriefController::class, 'show'])->name('briefs.show');
});

Route::middleware('can:briefs.edit')->group(function () {
    Route::get('/briefs/{brief}/edit', [BriefController::class, 'edit'])->name('briefs.edit');
    Route::put('/briefs/{brief}', [BriefController::class, 'update'])->name('briefs.update');
});

Route::delete('/briefs/{brief}', [BriefController::class, 'destroy'])
    ->name('briefs.destroy')
    ->middleware('can:briefs.delete');

Route::post('/briefs/{brief}/activate', [BriefController::class, 'activate'])->name('briefs.activate')->middleware('can:briefs.approve');

Route::post('/briefs/{brief}/status', [BriefController::class, 'updateStatus'])
    ->name('briefs.updateStatus')
    ->middleware('can:briefs.edit');

Route::post('briefs/import', [BriefImportController::class, 'extractFromFile'])
    ->name('briefs.import');
