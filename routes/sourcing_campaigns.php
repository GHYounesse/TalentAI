<?php

use App\Http\Controllers\SourcingCampaignController;
use Illuminate\Support\Facades\Route;

Route::get('/sourcing-campaigns', [SourcingCampaignController::class, 'index'])
    ->name('sourcing-campaigns.index')->middleware('can:sourcing-campaigns.view');

Route::get('/sourcing-campaigns/create', [SourcingCampaignController::class, 'create'])
    ->name('sourcing-campaigns.create')->middleware('can:sourcing-campaigns.create');

Route::post('/sourcing-campaigns', [SourcingCampaignController::class, 'store'])
    ->name('sourcing-campaigns.store')->middleware('can:sourcing-campaigns.create');

Route::get('/sourcing-campaigns/stream', [SourcingCampaignController::class, 'stream'])
    ->name('sourcing-campaigns.stream')->middleware('can:sourcing-campaigns.show');

Route::get('/sourcing-campaigns/{sourcingCampaign}', [SourcingCampaignController::class, 'show'])
    ->name('sourcing-campaigns.show')->middleware('can:sourcing-campaigns.show');

Route::post('/sourcing-campaigns/comments/{comment}/add-candidat', [SourcingCampaignController::class, 'addCandidat'])
    ->name('sourcing-campaigns.add-candidat')->middleware('can:sourcing-campaigns.show');

Route::post('/sourcing-campaigns/add-mentioned-candidat', [SourcingCampaignController::class, 'addMentionedCandidat'])
    ->name('sourcing-campaigns.add-mentioned-candidat')->middleware('can:sourcing-campaigns.show');
