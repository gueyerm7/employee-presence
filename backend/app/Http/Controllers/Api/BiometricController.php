<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WebauthnCredential;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use lbuchs\WebAuthn\Binary\ByteBuffer;
use lbuchs\WebAuthn\WebAuthn;

class BiometricController extends Controller
{
    public function __construct(
        protected AttendanceService $attendanceService
    ) {
        ByteBuffer::$useBase64UrlEncoding = true;
    }

    protected function getRpId(Request $request): string
    {
        return $request->getHost();
    }

    public function registerBegin(Request $request)
    {
        $user = $request->user();

        $webAuthn = new WebAuthn('Employee Presence', $this->getRpId($request), null, true);

        $existing = WebauthnCredential::where('user_id', $user->id)->pluck('credential_id')->toArray();
        $exclude = array_map(function ($id) {
            return ByteBuffer::fromBase64Url($id)->getBinaryString();
        }, $existing);

        $createArgs = $webAuthn->getCreateArgs(
            (string) $user->id,
            $user->name,
            $user->name,
            30,
            true,
            false,
            false,
            $exclude
        );

        Cache::put('webauthn:challenge:' . $user->id, base64_encode($webAuthn->getChallenge()->getBinaryString()), 300);

        return response()->json($createArgs);
    }

    public function registerComplete(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'response.clientDataJSON' => 'required',
            'response.attestationObject' => 'required',
            'device_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        $challengeBinary = base64_decode(Cache::pull('webauthn:challenge:' . $user->id));
        if (!$challengeBinary) {
            return response()->json(['message' => 'Challenge expiré, veuillez réessayer.'], 400);
        }

        $clientDataJSON = ByteBuffer::fromBase64Url($request->input('response.clientDataJSON'))->getBinaryString();
        $attestationObject = ByteBuffer::fromBase64Url($request->input('response.attestationObject'))->getBinaryString();

        $webAuthn = new WebAuthn('Employee Presence', $this->getRpId($request), null, true);

        try {
            $data = $webAuthn->processCreate(
                $clientDataJSON,
                $attestationObject,
                $challengeBinary,
                true
            );

            WebauthnCredential::create([
                'user_id' => $user->id,
                'credential_id' => ($id = $data->credentialId) instanceof \lbuchs\WebAuthn\Binary\ByteBuffer ? $id->jsonSerialize() : rtrim(strtr(base64_encode($id), '+/', '-_'), '='),
                'public_key' => $data->credentialPublicKey,
                'sign_count' => $data->signatureCounter ?? 0,
                'device_name' => $request->input('device_name', 'Appareil inconnu'),
            ]);

            return response()->json(['message' => 'Empreinte enregistrée avec succès.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 400);
        }
    }

    public function authenticateBegin(Request $request)
    {
        $user = $request->user();

        $credentials = WebauthnCredential::where('user_id', $user->id)->get();
        if ($credentials->isEmpty()) {
            return response()->json(['message' => 'Aucune empreinte enregistrée.'], 404);
        }

        $credentialIds = $credentials->map(function ($c) {
            return ByteBuffer::fromBase64Url($c->credential_id)->getBinaryString();
        })->toArray();

        $webAuthn = new WebAuthn('Employee Presence', $this->getRpId($request), null, true);

        $getArgs = $webAuthn->getGetArgs(
            $credentialIds,
            30,
            true, true, true, true, true,
            false
        );

        Cache::put('webauthn:challenge:' . $user->id, base64_encode($webAuthn->getChallenge()->getBinaryString()), 300);

        return response()->json($getArgs);
    }

    public function authenticateComplete(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'response.clientDataJSON' => 'required',
            'response.authenticatorData' => 'required',
            'response.signature' => 'required',
        ]);

        $user = $request->user();

        $challengeBinary = base64_decode(Cache::pull('webauthn:challenge:' . $user->id));
        if (!$challengeBinary) {
            return response()->json(['message' => 'Challenge expiré, veuillez réessayer.'], 400);
        }

        $credentialId = $request->input('id');
        $credential = WebauthnCredential::where('user_id', $user->id)
            ->where('credential_id', $credentialId)
            ->first();

        if (!$credential) {
            return response()->json(['message' => 'Empreinte non reconnue.'], 400);
        }

        $clientDataJSON = ByteBuffer::fromBase64Url($request->input('response.clientDataJSON'))->getBinaryString();
        $authenticatorData = ByteBuffer::fromBase64Url($request->input('response.authenticatorData'))->getBinaryString();
        $signature = ByteBuffer::fromBase64Url($request->input('response.signature'))->getBinaryString();

        $webAuthn = new WebAuthn('Employee Presence', $this->getRpId($request), null, true);

        try {
            $webAuthn->processGet(
                $clientDataJSON,
                $authenticatorData,
                $signature,
                $credential->public_key,
                $challengeBinary,
                $credential->sign_count,
                true
            );

            $newCount = $webAuthn->getSignatureCounter();
            if ($newCount !== null) {
                $credential->update(['sign_count' => $newCount]);
            }

            $action = $request->input('action', 'check-in');
            $date = $request->input('date', now()->toDateString());

            $attendance = match ($action) {
                'check-in' => $this->attendanceService->checkIn($user, $date),
                'check-out' => $this->attendanceService->checkOut($user),
                'break-start' => $this->attendanceService->breakStart($user),
                'break-end' => $this->attendanceService->breakEnd($user),
                default => throw new \InvalidArgumentException('Action invalide.'),
            };

            return response()->json([
                'message' => match ($action) {
                    'check-in' => 'Entrée pointée avec succès.',
                    'check-out' => 'Sortie pointée avec succès.',
                    'break-start' => 'Pause débutée avec succès.',
                    'break-end' => 'Pause terminée avec succès.',
                },
                'attendance' => new \App\Http\Resources\AttendanceResource($attendance),
                'status' => $this->attendanceService->getAttendanceStatus($user),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Vérification échouée: ' . $e->getMessage()], 400);
        }
    }

    public function loginBegin(Request $request)
    {
        $webAuthn = new WebAuthn('Employee Presence', $this->getRpId($request), null, true);

        $getArgs = $webAuthn->getGetArgs(
            [],
            30,
            true, true, true, true, true,
            false
        );

        $sessionId = \Illuminate\Support\Str::uuid()->toString();
        Cache::put('webauthn:login:challenge:' . $sessionId, base64_encode($webAuthn->getChallenge()->getBinaryString()), 300);

        return response()->json([
            'publicKey' => $getArgs->publicKey,
            'session_id' => $sessionId,
        ]);
    }

    public function loginComplete(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'id' => 'required',
            'response.clientDataJSON' => 'required',
            'response.authenticatorData' => 'required',
            'response.signature' => 'required',
        ]);

        $credentialId = $request->input('id');
        $credential = WebauthnCredential::where('credential_id', $credentialId)->first();

        if (!$credential) {
            return response()->json(['message' => 'Empreinte non reconnue.'], 400);
        }

        $challengeBinary = base64_decode(Cache::pull('webauthn:login:challenge:' . $request->session_id));
        if (!$challengeBinary) {
            return response()->json(['message' => 'Challenge expiré, veuillez réessayer.'], 400);
        }

        $user = User::findOrFail($credential->user_id);

        $clientDataJSON = ByteBuffer::fromBase64Url($request->input('response.clientDataJSON'))->getBinaryString();
        $authenticatorData = ByteBuffer::fromBase64Url($request->input('response.authenticatorData'))->getBinaryString();
        $signature = ByteBuffer::fromBase64Url($request->input('response.signature'))->getBinaryString();

        $webAuthn = new WebAuthn('Employee Presence', $this->getRpId($request), null, true);

        try {
            $webAuthn->processGet(
                $clientDataJSON,
                $authenticatorData,
                $signature,
                $credential->public_key,
                $challengeBinary,
                $credential->sign_count,
                true
            );

            $newCount = $webAuthn->getSignatureCounter();
            if ($newCount !== null) {
                $credential->update(['sign_count' => $newCount]);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Connexion réussie.',
                'token' => $token,
                'user' => new \App\Http\Resources\UserResource($user),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Vérification échouée: ' . $e->getMessage()], 400);
        }
    }

    public function credentials(Request $request)
    {
        $credentials = WebauthnCredential::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'device_name', 'created_at']);

        return response()->json($credentials);
    }

    public function destroy(Request $request, $id)
    {
        $credential = WebauthnCredential::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $credential->delete();

        return response()->json(['message' => 'Empreinte supprimée.']);
    }
}
