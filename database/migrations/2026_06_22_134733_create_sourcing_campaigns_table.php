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
        Schema::create('sourcing_campaigns', function (Blueprint $table) {
            $table->id();
            $table->json('search_queries');
            $table->json('author_urls')->nullable();
            $table->unsignedInteger('max_posts')->default(0);
            $table->string('apify_run_id')->nullable()->index();
            $table->string('apify_dataset_id')->nullable();
            $table->enum('status', ['pending', 'running', 'completed', 'failed'])->default('pending');
            $table->foreignId('brief_id')->nullable()->constrained('briefs')->nullOnDelete();
            $table->date('posted_limit_date')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sourcing_campaigns');
    }
};
