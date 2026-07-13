<?php

namespace Database\Seeders;

use App\Models\AbsenceType;
use App\Models\Attendance;
use App\Models\MonthlySummary;
use App\Models\User;
use App\Models\WeeklySummary;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        AbsenceType::insert([
            ['name' => 'Congé payé', 'slug' => 'conges-payes', 'description' => 'Congés annuels payés', 'is_paid' => true, 'requires_attachment' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Congé maladie', 'slug' => 'conges-maladie', 'description' => 'Arrêt maladie avec certificat', 'is_paid' => true, 'requires_attachment' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Permission', 'slug' => 'permission', 'description' => 'Permission exceptionnelle (quelques heures)', 'is_paid' => true, 'requires_attachment' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Télétravail', 'slug' => 'teletravail', 'description' => 'Travail à distance', 'is_paid' => true, 'requires_attachment' => false, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Congé sans solde', 'slug' => 'conge-sans-solde', 'description' => 'Congé non rémunéré', 'is_paid' => false, 'requires_attachment' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
        ]);

        User::factory()->create([
            'name' => 'Marie Martin',
            'email' => 'marie@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
        ]);

        User::factory()->create([
            'name' => 'Pierre Durand',
            'email' => 'pierre@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
        ]);

        User::factory()->count(5)->create();

        $employees = User::where('role', 'employee')->get();

        foreach ($employees as $employee) {
            for ($day = 0; $day < 20; $day++) {
                $date = Carbon::today()->subDays($day);

                if ($date->isWeekend()) {
                    continue;
                }

                $checkIn = $date->copy()->setHour(8)->setMinute(rand(0, 30))->setSecond(0);
                $breakStart = $date->copy()->setHour(12)->setMinute(0)->setSecond(0);
                $breakEnd = $date->copy()->setHour(13)->setMinute(0)->setSecond(0);
                $checkOut = $date->copy()->setHour(17)->setMinute(rand(0, 30))->setSecond(0);

                $totalHours = $checkIn->diffInMinutes($checkOut) - $breakStart->diffInMinutes($breakEnd);
                $totalHours = round($totalHours / 60, 2);

                Attendance::create([
                    'user_id' => $employee->id,
                    'date' => $date->toDateString(),
                    'check_in' => $checkIn->format('H:i:s'),
                    'break_start' => $breakStart->format('H:i:s'),
                    'break_end' => $breakEnd->format('H:i:s'),
                    'check_out' => $checkOut->format('H:i:s'),
                    'total_hours' => $totalHours,
                ]);
            }

            $weeklyTotals = Attendance::where('user_id', $employee->id)
                ->selectRaw('YEAR(date) as year, WEEK(date, 1) as week, SUM(total_hours) as total')
                ->groupBy('year', 'week')
                ->get();

            foreach ($weeklyTotals as $wt) {
                WeeklySummary::create([
                    'user_id' => $employee->id,
                    'week_number' => $wt->week,
                    'year' => $wt->year,
                    'total_hours' => $wt->total,
                ]);
            }

            $monthlyTotals = Attendance::where('user_id', $employee->id)
                ->selectRaw('YEAR(date) as year, MONTH(date) as month, SUM(total_hours) as total')
                ->groupBy('year', 'month')
                ->get();

            foreach ($monthlyTotals as $mt) {
                MonthlySummary::create([
                    'user_id' => $employee->id,
                    'month' => $mt->month,
                    'year' => $mt->year,
                    'total_hours' => $mt->total,
                ]);
            }
        }
    }
}
