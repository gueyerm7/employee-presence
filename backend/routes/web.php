<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return file_get_contents(public_path('spa.html'));
});

Route::get('/{any?}', function ($any = null) {
    return file_get_contents(public_path('spa.html'));
})->where('any', '^(?!api|sanctum).*$');
