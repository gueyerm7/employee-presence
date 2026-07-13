<?php

namespace App\Http\Controllers\Api;

use App\Exports\AttendanceExportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\UserResource;
use App\Models\Attendance;
use App\Models\MonthlySummary;
use App\Models\User;
use App\Models\WeeklySummary;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AdminController extends Controller
{
    public function dashboard()
    {
        $totalEmployees = User::where('role', 'employee')->count();
        $today = Carbon::today()->toDateString();

        $presentToday = Attendance::where('date', $today)
            ->whereNotNull('check_in')
            ->count();

        $totalHoursToday = Attendance::where('date', $today)
            ->sum('total_hours');

        $absentToday = $totalEmployees - $presentToday;

        $weeklyHours = Attendance::whereBetween('date', [
            Carbon::now()->startOfWeek()->toDateString(),
            Carbon::now()->endOfWeek()->toDateString(),
        ])->sum('total_hours');

        $monthlyHours = Attendance::whereYear('date', Carbon::now()->year)
            ->whereMonth('date', Carbon::now()->month)
            ->sum('total_hours');

        $latestAttendances = Attendance::with('user')
            ->where('date', $today)
            ->whereNotNull('check_in')
            ->orderBy('check_in', 'desc')
            ->take(10)
            ->get();

        $hoursByEmployee = User::where('role', 'employee')
            ->withCount(['attendances as total_hours_sum' => function ($query) {
                $query->whereYear('date', Carbon::now()->year)
                    ->whereMonth('date', Carbon::now()->month)
                    ->select(\DB::raw('COALESCE(SUM(total_hours), 0)'));
            }])
            ->get()
            ->map(fn($user) => [
                'name' => $user->name,
                'total_hours' => (float) $user->total_hours_sum,
            ]);

        return response()->json([
            'total_employees' => $totalEmployees,
            'present_today' => $presentToday,
            'absent_today' => $absentToday,
            'total_hours_today' => (float) $totalHoursToday,
            'total_hours_week' => (float) $weeklyHours,
            'total_hours_month' => (float) $monthlyHours,
            'latest_attendances' => AttendanceResource::collection($latestAttendances),
            'hours_by_employee' => $hoursByEmployee,
        ]);
    }

    public function attendances(Request $request)
    {
        $query = Attendance::with('user');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        $sortField = $request->get('sort', 'date');
        $sortDirection = $request->get('direction', 'desc');
        $allowedSorts = ['date', 'check_in', 'check_out', 'total_hours', 'user_id'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        $perPage = $request->get('per_page', 15);
        $attendances = $query->paginate($perPage);

        return response()->json([
            'attendances' => AttendanceResource::collection($attendances),
            'meta' => [
                'current_page' => $attendances->currentPage(),
                'last_page' => $attendances->lastPage(),
                'per_page' => $attendances->perPage(),
                'total' => $attendances->total(),
            ],
        ]);
    }

    public function users()
    {
        $users = User::orderBy('name')->get();
        return response()->json([
            'users' => UserResource::collection($users),
        ]);
    }

    public function storeUser(StoreUserRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès.',
            'user' => new UserResource($user),
        ], 201);
    }

    public function updateUser(UpdateUserRequest $request, $id)
    {
        $user = User::findOrFail($id);

        $data = $request->only(['name', 'email', 'role']);

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès.',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Impossible de supprimer un administrateur.',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'Utilisateur supprimé avec succès.',
        ]);
    }

    public function dailyReport(Request $request)
    {
        $date = $request->get('date', Carbon::today()->toDateString());

        $attendances = Attendance::with('user')
            ->where('date', $date)
            ->orderBy('check_in')
            ->get();

        return response()->json([
            'date' => $date,
            'total_present' => $attendances->whereNotNull('check_in')->count(),
            'attendances' => AttendanceResource::collection($attendances),
        ]);
    }

    public function weeklyReport(Request $request)
    {
        $date = $request->get('date', Carbon::today()->toDateString());
        $carbonDate = Carbon::parse($date);
        $startOfWeek = $carbonDate->startOfWeek()->toDateString();
        $endOfWeek = $carbonDate->copy()->endOfWeek()->toDateString();

        $summaries = WeeklySummary::with('user')
            ->where('week_number', $carbonDate->isoWeek())
            ->where('year', $carbonDate->year)
            ->get();

        $attendances = Attendance::with('user')
            ->whereBetween('date', [$startOfWeek, $endOfWeek])
            ->orderBy('date')
            ->get();

        return response()->json([
            'start_date' => $startOfWeek,
            'end_date' => $endOfWeek,
            'summaries' => $summaries,
            'attendances' => AttendanceResource::collection($attendances),
        ]);
    }

    public function monthlyReport(Request $request, AttendanceExportService $exportService)
    {
        $month = $request->get('month', Carbon::now()->month);
        $year = $request->get('year', Carbon::now()->year);

        $rows = $exportService->buildMonthlyRows((int) $year, (int) $month);

        $summaries = MonthlySummary::with('user')
            ->where('month', $month)
            ->where('year', $year)
            ->get();

        $attendances = Attendance::with('user')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('date')
            ->get();

        return response()->json([
            'month' => $month,
            'year' => $year,
            'rows' => $rows,
            'summaries' => $summaries,
            'attendances' => AttendanceResource::collection($attendances),
        ]);
    }

    public function exportPdf(Request $request, AttendanceExportService $exportService)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->toDateString());

        return $exportService->pdf($startDate, $endDate);
    }

    public function exportExcel(Request $request, AttendanceExportService $exportService)
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->toDateString());

        return $exportService->xlsx($startDate, $endDate);
    }

    public function exportPdfPublic(Request $request, AttendanceExportService $exportService)
    {
        $this->validateExportToken($request);

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->toDateString());

        return $exportService->pdf($startDate, $endDate);
    }

    public function exportExcelPublic(Request $request, AttendanceExportService $exportService)
    {
        $this->validateExportToken($request);

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::now()->toDateString());

        return $exportService->xlsx($startDate, $endDate);
    }

    public function exportMonthlyPdfPublic(Request $request, AttendanceExportService $exportService)
    {
        $this->validateExportToken($request);

        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month', Carbon::now()->month);

        return $exportService->monthlyPdf($year, $month);
    }

    public function exportMonthlyExcelPublic(Request $request, AttendanceExportService $exportService)
    {
        $this->validateExportToken($request);

        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month', Carbon::now()->month);

        return $exportService->monthlyXlsx($year, $month);
    }

    public function exportMonthlyPdf(Request $request, AttendanceExportService $exportService)
    {
        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month', Carbon::now()->month);

        return $exportService->monthlyPdf($year, $month);
    }

    public function exportMonthlyExcel(Request $request, AttendanceExportService $exportService)
    {
        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month', Carbon::now()->month);

        return $exportService->monthlyXlsx($year, $month);
    }

    private function validateExportToken(Request $request): void
    {
        $token = $request->get('token');
        if (!$token) {
            abort(401, 'Token manquant.');
        }

        $accessToken = PersonalAccessToken::findToken($token);
        if (!$accessToken || !$accessToken->tokenable || $accessToken->tokenable->role !== 'admin') {
            abort(403, 'Non autorisé.');
        }
    }
}
