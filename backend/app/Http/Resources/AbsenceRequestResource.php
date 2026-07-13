<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AbsenceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => new UserResource($this->whenLoaded('user')),
            'absence_type' => $this->whenLoaded('absenceType', fn() => [
                'id' => $this->absenceType->id,
                'name' => $this->absenceType->name,
                'slug' => $this->absenceType->slug,
                'is_paid' => $this->absenceType->is_paid,
            ]),
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'reason' => $this->reason,
            'attachment' => $this->attachment,
            'status' => $this->status,
            'admin_comment' => $this->admin_comment,
            'approved_by' => $this->whenLoaded('approver', fn() => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ]),
            'approved_at' => $this->approved_at?->format('Y-m-d H:i'),
            'created_at' => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
