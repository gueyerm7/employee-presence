<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'date' => $this->date?->format('Y-m-d'),
            'check_in' => $this->check_in ? $this->check_in->format('H:i') : null,
            'break_start' => $this->break_start ? $this->break_start->format('H:i') : null,
            'break_end' => $this->break_end ? $this->break_end->format('H:i') : null,
            'check_out' => $this->check_out ? $this->check_out->format('H:i') : null,
            'total_hours' => $this->total_hours,
            'check_in_edited' => $this->check_in_edited,
            'break_start_edited' => $this->break_start_edited,
            'break_end_edited' => $this->break_end_edited,
            'check_out_edited' => $this->check_out_edited,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
