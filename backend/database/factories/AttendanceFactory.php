<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceFactory extends Factory
{
    public function definition(): array
    {
        $checkIn = $this->faker->time('H:i:s', '09:30');
        $breakStart = $this->faker->time('H:i:s', '13:00');
        $breakEnd = $this->faker->time('H:i:s', '14:00');
        $checkOut = $this->faker->time('H:i:s', '18:30');

        return [
            'user_id' => User::factory(),
            'date' => $this->faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'check_in' => $checkIn,
            'break_start' => $breakStart,
            'break_end' => $breakEnd,
            'check_out' => $checkOut,
            'total_hours' => 8.0,
        ];
    }
}
