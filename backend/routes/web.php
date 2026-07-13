<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $path = public_path('spa.html');
    return response(file_get_contents($path), 200, ['Content-Type' => 'text/html']);
});

Route::get('/{any?}', function ($any = null) {
    $path = public_path('spa.html');
    return response(file_get_contents($path), 200, ['Content-Type' => 'text/html']);
})->where('any', '^(?!api|sanctum).*$');
