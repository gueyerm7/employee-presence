<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        protected AttendanceService $attendanceService
    ) {}

    public function checkIn(Request $request)
    {
        try {
            $attendance = $this->attendanceService->checkIn(
                $request->user(),
                $request->date
            );

            return response()->json([
                'message' => 'Entrée pointée avec succès.',
                'attendance' => new AttendanceResource($attendance),
                'status' => $this->attendanceService->getAttendanceStatus($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function breakStart(Request $request)
    {
        try {
            $attendance = $this->attendanceService->breakStart($request->user());

            return response()->json([
                'message' => 'Pause débutée avec succès.',
                'attendance' => new AttendanceResource($attendance),
                'status' => $this->attendanceService->getAttendanceStatus($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function breakEnd(Request $request)
    {
        try {
            $attendance = $this->attendanceService->breakEnd($request->user());

            return response()->json([
                'message' => 'Pause terminée avec succès.',
                'attendance' => new AttendanceResource($attendance),
                'status' => $this->attendanceService->getAttendanceStatus($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function checkOut(Request $request)
    {
        try {
            $attendance = $this->attendanceService->checkOut($request->user());

            return response()->json([
                'message' => 'Sortie pointée avec succès.',
                'attendance' => new AttendanceResource($attendance),
                'status' => $this->attendanceService->getAttendanceStatus($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function today(Request $request)
    {
        $attendance = $this->attendanceService->getTodayAttendance($request->user());

        return response()->json([
            'attendance' => $attendance ? new AttendanceResource($attendance) : null,
            'status' => $this->attendanceService->getAttendanceStatus($request->user()),
        ]);
    }

    public function history(Request $request)
    {
        $history = $this->attendanceService->getHistory($request->user());

        return response()->json([
            'history' => AttendanceResource::collection($history),
            'meta' => [
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
            ],
        ]);
    }

    public function week(Request $request)
    {
        $weekSummary = $this->attendanceService->getWeekSummary($request->user());

        return response()->json($weekSummary);
    }

    public function weekByOffset(Request $request)
    {
        $offset = (int) $request->get('offset', 0);
        $weekData = $this->attendanceService->getWeekByOffset($request->user(), $offset);

        return response()->json($weekData);
    }

    public function updateField(UpdateAttendanceRequest $request, $id)
    {
        try {
            $attendance = $this->attendanceService->updateAttendanceField(
                $request->user(),
                (int) $id,
                $request->field,
                $request->value
            );

            return response()->json([
                'message' => 'Mise à jour effectuée.',
                'attendance' => new AttendanceResource($attendance),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function month(Request $request)
    {
        $monthSummary = $this->attendanceService->getMonthSummary($request->user());

        return response()->json($monthSummary);
    }
}
