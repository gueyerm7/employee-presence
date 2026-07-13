<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $path = public_path('spa.html');
    if (!file_exists($path)) {
        return response('SPA not found at: ' . $path, 500);
    }
    return response(file_get_contents($path), 200, ['Content-Type' => 'text/html']);
});

Route::get('/{any?}', function ($any = null) {
    $path = public_path('spa.html');
    if (!file_exists($path)) {
        return response('SPA not found at: ' . $path, 500);
    }
    return response(file_get_contents($path), 200, ['Content-Type' => 'text/html']);
})->where('any', '^(?!api|sanctum).*$');
