<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\MonthlySummary;
use App\Models\User;
use App\Models\WeeklySummary;
use Carbon\Carbon;

class AttendanceService
{
    public function checkIn(User $user, ?string $date = null): Attendance
    {
        $today = $date ? Carbon::parse($date) : Carbon::today();

        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $today->toDateString())
            ->first();

        if ($existing) {
            throw new \Exception('Vous avez déjà pointé votre entrée aujourd\'hui.');
        }

        return Attendance::create([
            'user_id' => $user->id,
            'date' => $today->toDateString(),
            'check_in' => Carbon::now()->format('H:i:s'),
        ]);
    }

    public function breakStart(User $user): Attendance
    {
        $attendance = $this->getTodayAttendance($user);

        if (!$attendance || !$attendance->check_in) {
            throw new \Exception('Vous devez d\'abord pointer votre entrée.');
        }

        if ($attendance->break_start) {
            throw new \Exception('Vous avez déjà débuté votre pause.');
        }

        if ($attendance->check_out) {
            throw new \Exception('Vous avez déjà pointé votre sortie.');
        }

        $attendance->update([
            'break_start' => Carbon::now()->format('H:i:s'),
        ]);

        return $attendance->fresh();
    }

    public function breakEnd(User $user): Attendance
    {
        $attendance = $this->getTodayAttendance($user);

        if (!$attendance || !$attendance->check_in) {
            throw new \Exception('Vous devez d\'abord pointer votre entrée.');
        }

        if (!$attendance->break_start) {
            throw new \Exception('Vous devez d\'abord débuter votre pause.');
        }

        if ($attendance->break_end) {
            throw new \Exception('Vous avez déjà terminé votre pause.');
        }

        if ($attendance->check_out) {
            throw new \Exception('Vous avez déjà pointé votre sortie.');
        }

        $breakStart = Carbon::parse($attendance->break_start);
        $breakEnd = Carbon::now();

        if ($breakEnd->lessThanOrEqualTo($breakStart)) {
            throw new \Exception('La fin de pause ne peut pas être avant le début de la pause.');
        }

        $attendance->update([
            'break_end' => $breakEnd->format('H:i:s'),
        ]);

        return $attendance->fresh();
    }

    public function checkOut(User $user): Attendance
    {
        $attendance = $this->getTodayAttendance($user);

        if (!$attendance || !$attendance->check_in) {
            throw new \Exception('Vous devez d\'abord pointer votre entrée.');
        }

        if ($attendance->check_out) {
            throw new \Exception('Vous avez déjà pointé votre sortie.');
        }

        if ($attendance->break_start && !$attendance->break_end) {
            throw new \Exception('Vous devez d\'abord terminer votre pause.');
        }

        $checkIn = Carbon::parse($attendance->check_in);
        $checkOut = Carbon::now();

        if ($checkOut->lessThanOrEqualTo($checkIn)) {
            throw new \Exception('La sortie ne peut pas être avant l\'entrée.');
        }

        $totalMinutes = $checkIn->diffInMinutes($checkOut);

        if ($attendance->break_start && $attendance->break_end) {
            $breakStart = Carbon::parse($attendance->break_start);
            $breakEnd = Carbon::parse($attendance->break_end);
            $breakMinutes = $breakStart->diffInMinutes($breakEnd);
            $totalMinutes -= $breakMinutes;
        }

        $totalHours = round($totalMinutes / 60, 2);

        $attendance->update([
            'check_out' => $checkOut->format('H:i:s'),
            'total_hours' => $totalHours,
        ]);

        $this->updateSummaries($user, $attendance->date, $totalHours);

        return $attendance->fresh();
    }

    public function getTodayAttendance(User $user): ?Attendance
    {
        return Attendance::where('user_id', $user->id)
            ->where('date', Carbon::today()->toDateString())
            ->first();
    }

    public function getAttendanceStatus(User $user): array
    {
        $attendance = $this->getTodayAttendance($user);

        return [
            'can_check_in' => is_null($attendance) || is_null($attendance->check_in),
            'can_break_start' => $attendance && $attendance->check_in && is_null($attendance->break_start) && is_null($attendance->check_out),
            'can_break_end' => $attendance && $attendance->break_start && is_null($attendance->break_end) && is_null($attendance->check_out),
            'can_check_out' => $attendance && $attendance->check_in && is_null($attendance->check_out) && ($attendance->break_start ? $attendance->break_end : true),
        ];
    }

    public function getHistory(User $user, int $perPage = 15)
    {
        return Attendance::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    public function getWeekSummary(User $user): array
    {
        $now = Carbon::now();
        $weekNumber = $now->isoWeek();
        $year = $now->year;

        $summary = WeeklySummary::firstOrCreate(
            [
                'user_id' => $user->id,
                'week_number' => $weekNumber,
                'year' => $year,
            ],
            ['total_hours' => 0]
        );

        $attendances = Attendance::where('user_id', $user->id)
            ->whereBetween('date', [$now->startOfWeek()->toDateString(), $now->copy()->endOfWeek()->toDateString()])
            ->get();

        $totalHours = $attendances->sum('total_hours');

        $summary->update(['total_hours' => $totalHours]);

        return [
            'week_number' => $weekNumber,
            'year' => $year,
            'total_hours' => $totalHours,
            'days' => $attendances,
        ];
    }

    public function getMonthSummary(User $user): array
    {
        $now = Carbon::now();
        $month = $now->month;
        $year = $now->year;

        $summary = MonthlySummary::firstOrCreate(
            [
                'user_id' => $user->id,
                'month' => $month,
                'year' => $year,
            ],
            ['total_hours' => 0]
        );

        $attendances = Attendance::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        $totalHours = $attendances->sum('total_hours');

        $summary->update(['total_hours' => $totalHours]);

        return [
            'month' => $month,
            'year' => $year,
            'total_hours' => $totalHours,
        ];
    }

    public function getWeekByOffset(User $user, int $offset = 0): array
    {
        $now = Carbon::now()->addWeeks($offset);
        $startOfWeek = $now->copy()->startOfWeek();
        $endOfWeek = $now->copy()->endOfWeek();

        $attendances = Attendance::where('user_id', $user->id)
            ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->orderBy('date')
            ->get()
            ->keyBy(fn ($att) => $att->date->format('Y-m-d'));

        $days = [];
        $totalHours = 0;
        $cursor = $startOfWeek->copy();

        while ($cursor->lte($endOfWeek)) {
            $dateStr = $cursor->toDateString();
            $dayData = $attendances->get($dateStr);

            $days[] = [
                'date' => $dateStr,
                'day_name' => $cursor->isoFormat('dddd'),
                'day_short' => $cursor->isoFormat('ddd'),
                'is_today' => $cursor->isToday(),
                'is_weekend' => $cursor->isWeekend(),
                'attendance' => $dayData ? [
                    'id' => $dayData->id,
                    'check_in' => $dayData->check_in ? $dayData->check_in->format('H:i') : null,
                    'break_start' => $dayData->break_start ? $dayData->break_start->format('H:i') : null,
                    'break_end' => $dayData->break_end ? $dayData->break_end->format('H:i') : null,
                    'check_out' => $dayData->check_out ? $dayData->check_out->format('H:i') : null,
                    'total_hours' => $dayData->total_hours,
                    'check_in_edited' => $dayData->check_in_edited,
                    'break_start_edited' => $dayData->break_start_edited,
                    'break_end_edited' => $dayData->break_end_edited,
                    'check_out_edited' => $dayData->check_out_edited,
                ] : null,
            ];

            if ($dayData && $dayData->total_hours) {
                $totalHours += $dayData->total_hours;
            }

            $cursor->addDay();
        }

        return [
            'week_number' => $now->isoWeek(),
            'year' => $now->year,
            'start_date' => $startOfWeek->toDateString(),
            'end_date' => $endOfWeek->toDateString(),
            'total_hours' => round($totalHours, 2),
            'days' => $days,
        ];
    }

    public function updateAttendanceField(User $user, int $id, string $field, string $value): Attendance
    {
        $attendance = Attendance::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        $attendanceDate = Carbon::parse($attendance->date);
        $threeDaysAgo = Carbon::today()->subDays(2);

        if ($attendanceDate->lt($threeDaysAgo)) {
            throw new \Exception('Seuls les 3 derniers jours sont modifiables.');
        }

        $editedField = $field . '_edited';

        if ($attendance->$editedField) {
            throw new \Exception('Ce champ a déjà été modifié une fois.');
        }

        if ($field === 'break_end' && $attendance->break_start) {
            $breakEnd = Carbon::parse($value);
            $breakStart = Carbon::parse($attendance->break_start);
            if ($breakEnd->lessThanOrEqualTo($breakStart)) {
                throw new \Exception('La fin de pause ne peut pas être avant le début.');
            }
        }

        if ($field === 'check_out' && $attendance->check_in) {
            $checkOut = Carbon::parse($value);
            $checkIn = Carbon::parse($attendance->check_in);
            if ($checkOut->lessThanOrEqualTo($checkIn)) {
                throw new \Exception('La sortie ne peut pas être avant l\'entrée.');
            }
        }

        $attendance->update([
            $field => $value,
            $editedField => true,
        ]);

        $freshAttendance = $attendance->fresh();

        if ($freshAttendance->check_in && $freshAttendance->check_out) {
            $checkIn = Carbon::parse($freshAttendance->check_in);
            $checkOut = Carbon::parse($freshAttendance->check_out);
            $totalMinutes = $checkIn->diffInMinutes($checkOut);

            if ($freshAttendance->break_start && $freshAttendance->break_end) {
                $breakStart = Carbon::parse($freshAttendance->break_start);
                $breakEnd = Carbon::parse($freshAttendance->break_end);
                $breakMinutes = $breakStart->diffInMinutes($breakEnd);
                $totalMinutes -= $breakMinutes;
            }

            $totalHours = round($totalMinutes / 60, 2);

            $freshAttendance->update(['total_hours' => $totalHours]);
            $this->updateSummaries($user, $freshAttendance->date, $totalHours);
        }

        return $freshAttendance->fresh();
    }

    private function updateSummaries(User $user, string $date, float $totalHours): void
    {
        $carbonDate = Carbon::parse($date);
        $weekNumber = $carbonDate->isoWeek();
        $year = $carbonDate->year;
        $month = $carbonDate->month;

        $weeklySummary = WeeklySummary::firstOrCreate(
            [
                'user_id' => $user->id,
                'week_number' => $weekNumber,
                'year' => $year,
            ],
            ['total_hours' => 0]
        );

        $weeklyTotal = Attendance::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->whereBetween('date', [$carbonDate->startOfWeek()->toDateString(), $carbonDate->copy()->endOfWeek()->toDateString()])
            ->sum('total_hours');

        $weeklySummary->update(['total_hours' => $weeklyTotal]);

        $monthlySummary = MonthlySummary::firstOrCreate(
            [
                'user_id' => $user->id,
                'month' => $month,
                'year' => $year,
            ],
            ['total_hours' => 0]
        );

        $monthlyTotal = Attendance::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('total_hours');

        $monthlySummary->update(['total_hours' => $monthlyTotal]);
    }
}
