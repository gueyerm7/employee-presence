<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'check_in',
        'break_start',
        'break_end',
        'check_out',
        'total_hours',
        'check_in_edited',
        'break_start_edited',
        'break_end_edited',
        'check_out_edited',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'check_in' => 'datetime:H:i:s',
            'break_start' => 'datetime:H:i:s',
            'break_end' => 'datetime:H:i:s',
            'check_out' => 'datetime:H:i:s',
            'total_hours' => 'decimal:2',
            'check_in_edited' => 'boolean',
            'break_start_edited' => 'boolean',
            'break_end_edited' => 'boolean',
            'check_out_edited' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
