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
        Schema::create('social_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_post_id')->constrained()->cascadeOnDelete();
            $table->string('linkedin_comment_id')->nullable()->index();
            $table->string('commenter_name')->nullable();
            $table->string('commenter_linkedin_url')->nullable()->index();
            $table->text('commenter_position')->nullable();
            $table->longText('commentary')->nullable();
            $table->json('mentions')->nullable();
            $table->timestamp('commented_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_comments');
    }
};
