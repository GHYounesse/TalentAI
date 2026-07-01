<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('social_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sourcing_campaign_id')->constrained()->cascadeOnDelete();
            $table->string('linkedin_post_id')->index();
            $table->text('linkedin_url')->nullable();
            $table->longText('content')->nullable();
            $table->string('author_name')->nullable();
            $table->string('author_public_identifier')->nullable();
            $table->text('author_linkedin_url')->nullable();
            $table->text('author_info')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();

            $table->unique(['sourcing_campaign_id', 'linkedin_post_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_posts');
    }
};
