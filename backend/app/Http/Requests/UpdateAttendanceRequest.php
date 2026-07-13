<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'field' => 'required|string|in:check_in,break_start,break_end,check_out',
            'value' => 'required|string|date_format:H:i',
        ];
    }

    public function messages(): array
    {
        return [
            'field.in' => 'Le champ à modifier est invalide.',
            'value.date_format' => 'Le format de l\'heure doit être H:i (ex: 08:30).',
        ];
    }
}
