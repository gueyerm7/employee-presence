<?php

namespace App\Exports;

use App\Models\Attendance;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Writer;

class AttendanceExportService
{
    public function pdf(string $startDate, string $endDate)
    {
        $rows = $this->buildGroupedRows($startDate, $endDate);
        $summary = $this->getSummary($this->getAttendances($startDate, $endDate));

        $pdf = Pdf::loadView('exports.attendance-pdf', [
            'rows' => $rows,
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'generatedAt' => Carbon::now()->format('d/m/Y H:i'),
        ]);

        $tempPath = tempnam(sys_get_temp_dir(), 'presences_') . '.pdf';
        file_put_contents($tempPath, $pdf->output());

        return response()->download($tempPath, "presences_$startDate-$endDate.pdf", [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    public function xlsx(string $startDate, string $endDate)
    {
        $rows = $this->buildGroupedRows($startDate, $endDate);

        $headerStyle = (new Style())
            ->setFontBold()
            ->setFontColor(Color::WHITE)
            ->setBackgroundColor(Color::rgb(79, 70, 229));

        $tempPath = tempnam(sys_get_temp_dir(), 'presences_') . '.xlsx';

        $writer = new Writer();
        $writer->openToFile($tempPath);

        $writer->addRow(Row::fromValues(
            ['Employé', 'Email', 'Total heures'],
            $headerStyle
        ));

        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues([
                $row['name'],
                $row['email'],
                $row['total'],
            ]));
        }

        $writer->close();

        return response()->download($tempPath, "presences_$startDate-$endDate.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function monthlyPdf(int $year, int $month)
    {
        $rows = $this->buildMonthlyRows($year, $month);

        $pdf = Pdf::loadView('exports.attendance-monthly-pdf', [
            'rows' => $rows,
            'year' => $year,
            'month' => $month,
            'monthName' => Carbon::create($year, $month)->locale('fr')->translatedFormat('F Y'),
            'generatedAt' => Carbon::now()->format('d/m/Y H:i'),
        ]);

        $tempPath = tempnam(sys_get_temp_dir(), 'presences_') . '.pdf';
        file_put_contents($tempPath, $pdf->output());

        return response()->download($tempPath, "presences-$year-$month.pdf", [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    public function monthlyXlsx(int $year, int $month)
    {
        $rows = $this->buildMonthlyRows($year, $month);

        $headerStyle = (new Style())
            ->setFontBold()
            ->setFontColor(Color::WHITE)
            ->setBackgroundColor(Color::rgb(79, 70, 229));

        $tempPath = tempnam(sys_get_temp_dir(), 'presences_') . '.xlsx';

        $writer = new Writer();
        $writer->openToFile($tempPath);

        $headers = ['Développeur'];
        for ($w = 1; $w <= 5; $w++) {
            $headers[] = "Semaine $w";
        }
        $headers[] = 'Total Mensuel';
        $writer->addRow(Row::fromValues($headers, $headerStyle));

        foreach ($rows as $row) {
            $values = [$row['name']];
            for ($w = 1; $w <= 5; $w++) {
                $values[] = $row['weeks'][$w] ?? '--';
            }
            $values[] = $row['total'];
            $writer->addRow(Row::fromValues($values));
        }

        $writer->close();

        return response()->download($tempPath, "presences-$year-$month.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function getAttendances(string $startDate, string $endDate): Collection
    {
        return Attendance::with('user')
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->orderBy('user_id')
            ->get();
    }

    private function getSummary(Collection $attendances): array
    {
        $totalEmployees = User::where('role', 'employee')->count();
        $totalHours = $attendances->sum('total_hours');
        $presentDays = $attendances->whereNotNull('check_in')->count();

        return [
            'total_employees' => $totalEmployees,
            'total_hours' => $totalHours,
            'present_days' => $presentDays,
        ];
    }

    public function buildGroupedRows(string $startDate, string $endDate): array
    {
        $attendances = $this->getAttendances($startDate, $endDate);
        $users = User::where('role', 'employee')->orderBy('name')->get();

        $rows = [];
        foreach ($users as $user) {
            $userAtt = $attendances->where('user_id', $user->id);
            $total = (float) $userAtt->sum('total_hours');
            $rows[] = [
                'name' => $user->name,
                'email' => $user->email,
                'total' => $this->fmtHours($total),
            ];
        }

        return $rows;
    }

    public function buildMonthlyRows(int $year, int $month): array
    {
        $attendances = Attendance::with('user')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('user_id')
            ->orderBy('date')
            ->get();

        $users = User::where('role', 'employee')->orderBy('name')->get();

        $rows = [];
        foreach ($users as $user) {
            $userAtt = $attendances->where('user_id', $user->id);
            $weeks = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
            $total = 0;

            foreach ($userAtt as $a) {
                $week = (int) ceil($a->date->day / 7);
                $hours = (float) ($a->total_hours ?? 0);
                $weeks[$week] += $hours;
                $total += $hours;
            }

            $rows[] = [
                'name' => $user->name,
                'weeks' => [
                    1 => $this->fmtHours($weeks[1]),
                    2 => $this->fmtHours($weeks[2]),
                    3 => $this->fmtHours($weeks[3]),
                    4 => $this->fmtHours($weeks[4]),
                    5 => $this->fmtHours($weeks[5]),
                ],
                'total' => $this->fmtHours($total),
            ];
        }

        return $rows;
    }

    private function fmtHours(?float $decimal): string
    {
        if ($decimal === null || $decimal == 0) return '--';
        $sign = $decimal < 0 ? '-' : '';
        $decimal = abs($decimal);
        $hours = floor($decimal);
        $minutes = round(($decimal - $hours) * 60);
        return $sign . sprintf('%d:%02d', $hours, $minutes);
    }
}
