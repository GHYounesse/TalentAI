<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidats', function (Blueprint $table) {
            $table->id();
            $table->string('linkedin_url')->unique()->nullable();
            $table->string('full_name')->nullable();
            $table->string('headline')->nullable();
            $table->string('location')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('summary')->nullable();
            $table->json('skills')->nullable();
            $table->string('current_company')->nullable();
            $table->string('current_title')->nullable();
            $table->float('experience_years')->nullable();
            $table->string('education_level')->nullable();  // normalized key
            $table->string('sector')->nullable();
            $table->boolean('open_to_work')->default(false);
            $table->string('source')->default('apify');
            $table->json('raw_data')->nullable();
            $table->string('source_url')->nullable();
            $table->enum('status', [
                'sourced',
                'contacted',
                'interview',
                'recommended',
                'offer',
                'rejected',
            ])->default('sourced');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidats');
    }
};
