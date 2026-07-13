<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->boolean('check_in_edited')->default(false)->after('check_in');
            $table->boolean('break_start_edited')->default(false)->after('break_start');
            $table->boolean('break_end_edited')->default(false)->after('break_end');
            $table->boolean('check_out_edited')->default(false)->after('check_out');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['check_in_edited', 'break_start_edited', 'break_end_edited', 'check_out_edited']);
        });
    }
};
