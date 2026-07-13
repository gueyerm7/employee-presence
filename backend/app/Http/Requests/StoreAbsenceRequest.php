<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAbsenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'absence_type_id' => 'required|exists:absence_types,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->absence_type_id) return;

            $type = \App\Models\AbsenceType::find($this->absence_type_id);
            if ($type && $type->requires_attachment && !$this->hasFile('attachment')) {
                $validator->errors()->add('attachment', 'Un justificatif est requis pour ce type d\'absence.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'start_date.after_or_equal' => 'La date de début ne peut pas être dans le passé.',
            'end_date.after_or_equal' => 'La date de fin doit être après la date de début.',
        ];
    }
}
