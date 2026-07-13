<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('week_number');
            $table->unsignedSmallInteger('year');
            $table->decimal('total_hours', 6, 2)->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'week_number', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_summaries');
    }
};
