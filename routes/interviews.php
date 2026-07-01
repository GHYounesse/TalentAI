<?php

use App\Http\Controllers\Interview\InterviewController;
use Illuminate\Support\Facades\Route;

Route::get('/interviews', [InterviewController::class, 'index'])->name('interviews.index')->middleware('can:interviews.view');
Route::get('/interviews/create', [InterviewController::class, 'create'])->name('interviews.create')->middleware('can:interviews.create');
Route::post('/interviews/upload', [InterviewController::class, 'upload'])->name('interviews.upload')->middleware('can:interviews.upload');
Route::get('/interviews/{interview}', [InterviewController::class, 'show'])->name('interviews.show')->middleware('can:interviews.view');
Route::get('/interviews/{interview}/status', [InterviewController::class, 'status'])->name('interviews.status')->middleware('can:interviews.view');
Route::get('/interviews/{interview}/audio', [InterviewController::class, 'audio'])->name('interviews.audio')->middleware('can:interviews.view');
Route::get('/interviews/{interview}/transcription/search', [InterviewController::class, 'search'])->name('interviews.transcription.search')->middleware('can:interviews.view');
