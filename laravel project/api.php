<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\PayrollRecordController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'PRIMEPOWER Laravel API is working!'
    ]);
});

Route::apiResource('employees', EmployeeController::class);

Route::apiResource('payroll-records', PayrollRecordController::class);