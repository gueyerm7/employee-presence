<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbsenceRequest extends Model
{
    protected $fillable = [
        'user_id', 'absence_type_id', 'start_date', 'end_date',
        'reason', 'attachment', 'status', 'admin_comment', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'approved_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function absenceType()
    {
        return $this->belongsTo(AbsenceType::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
