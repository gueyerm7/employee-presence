<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAbsenceRequest;
use App\Http\Requests\UpdateAbsenceStatusRequest;
use App\Http\Resources\AbsenceRequestResource;
use App\Models\AbsenceRequest;
use App\Models\AbsenceType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AbsenceRequestController extends Controller
{
    // ────────────── Absence Types (publique) ──────────────

    public function types()
    {
        return response()->json(
            AbsenceType::orderBy('name')->get(['id', 'name', 'slug', 'description', 'is_paid', 'requires_attachment'])
        );
    }

    // ────────────── Employee ──────────────

    public function myRequests(Request $request)
    {
        $requests = AbsenceRequest::with(['absenceType', 'approver'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return AbsenceRequestResource::collection($requests);
    }

    public function store(StoreAbsenceRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')
                ->store('absences/attachments', 'public');
        }

        $absenceRequest = AbsenceRequest::create($data);

        return new AbsenceRequestResource(
            $absenceRequest->load(['absenceType', 'approver'])
        );
    }

    public function destroy(Request $request, AbsenceRequest $absenceRequest)
    {
        if ($absenceRequest->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($absenceRequest->status !== 'pending') {
            return response()->json(['message' => 'Seules les demandes en attente peuvent être supprimées.'], 422);
        }

        if ($absenceRequest->attachment) {
            Storage::disk('public')->delete($absenceRequest->attachment);
        }

        $absenceRequest->delete();

        return response()->json(['message' => 'Demande supprimée.']);
    }

    // ────────────── Admin ──────────────

    public function index(Request $request)
    {
        $query = AbsenceRequest::with(['user', 'absenceType', 'approver']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return AbsenceRequestResource::collection($requests);
    }

    public function updateStatus(
        UpdateAbsenceStatusRequest $request,
        AbsenceRequest $absenceRequest
    ) {
        if ($absenceRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Cette demande a déjà été traitée.',
            ], 422);
        }

        $absenceRequest->update([
            'status' => $request->status,
            'admin_comment' => $request->admin_comment,
            'approved_by' => $request->user()->id,
            'approved_at' => Carbon::now(),
        ]);

        return new AbsenceRequestResource(
            $absenceRequest->load(['user', 'absenceType', 'approver'])
        );
    }
}
