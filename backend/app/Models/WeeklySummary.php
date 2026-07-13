<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeeklySummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'week_number',
        'year',
        'total_hours',
    ];

    protected function casts(): array
    {
        return [
            'total_hours' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
