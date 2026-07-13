<?php

use App\Http\Controllers\Api\AbsenceRequestController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BiometricController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'php' => phpversion(),
        'app_key' => env('APP_KEY') ? 'set' : 'missing',
        'app_debug' => config('app.debug'),
        'session_driver' => config('session.driver'),
        'storage_path' => storage_path(),
        'sessions_writable' => is_writable(storage_path('framework/sessions')),
        'db_url' => env('DB_URL') ? 'set' : 'missing',
    ]);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::post('/biometric/login-begin', [BiometricController::class, 'loginBegin']);
Route::post('/biometric/login-complete', [BiometricController::class, 'loginComplete']);

Route::get('/absence-types', [AbsenceRequestController::class, 'types']);
Route::get('/export/pdf', [AdminController::class, 'exportPdfPublic']);
Route::get('/export/excel', [AdminController::class, 'exportExcelPublic']);
Route::get('/export/monthly-pdf', [AdminController::class, 'exportMonthlyPdfPublic']);
Route::get('/export/monthly-excel', [AdminController::class, 'exportMonthlyExcelPublic']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:employee')->prefix('attendance')->group(function () {
        Route::post('/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('/break-start', [AttendanceController::class, 'breakStart']);
        Route::post('/break-end', [AttendanceController::class, 'breakEnd']);
        Route::post('/check-out', [AttendanceController::class, 'checkOut']);
        Route::get('/today', [AttendanceController::class, 'today']);
        Route::get('/history', [AttendanceController::class, 'history']);
        Route::get('/week', [AttendanceController::class, 'week']);
        Route::get('/week-by-offset', [AttendanceController::class, 'weekByOffset']);
        Route::put('/{id}', [AttendanceController::class, 'updateField']);
        Route::get('/month', [AttendanceController::class, 'month']);
    });

    Route::middleware('role:employee')->prefix('biometric')->group(function () {
        Route::post('/register-begin', [BiometricController::class, 'registerBegin']);
        Route::post('/register-complete', [BiometricController::class, 'registerComplete']);
        Route::post('/authenticate-begin', [BiometricController::class, 'authenticateBegin']);
        Route::post('/authenticate-complete', [BiometricController::class, 'authenticateComplete']);
        Route::get('/credentials', [BiometricController::class, 'credentials']);
        Route::delete('/credentials/{id}', [BiometricController::class, 'destroy']);
    });

    Route::prefix('absences')->middleware('role:employee')->group(function () {
        Route::get('/my', [AbsenceRequestController::class, 'myRequests']);
        Route::post('/', [AbsenceRequestController::class, 'store']);
        Route::delete('/{absenceRequest}', [AbsenceRequestController::class, 'destroy']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/absences', [AbsenceRequestController::class, 'index']);
        Route::put('/absences/{absenceRequest}/status', [AbsenceRequestController::class, 'updateStatus']);
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/attendances', [AdminController::class, 'attendances']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::get('/reports/daily', [AdminController::class, 'dailyReport']);
        Route::get('/reports/weekly', [AdminController::class, 'weeklyReport']);
        Route::get('/reports/monthly', [AdminController::class, 'monthlyReport']);
        Route::get('/export/pdf', [AdminController::class, 'exportPdf']);
        Route::get('/export/excel', [AdminController::class, 'exportExcel']);
        Route::get('/export/monthly-pdf', [AdminController::class, 'exportMonthlyPdf']);
        Route::get('/export/monthly-excel', [AdminController::class, 'exportMonthlyExcel']);
    });
});
