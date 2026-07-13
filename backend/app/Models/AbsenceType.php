<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbsenceType extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'is_paid', 'requires_attachment'];

    public function requests()
    {
        return $this->hasMany(AbsenceRequest::class);
    }
}
