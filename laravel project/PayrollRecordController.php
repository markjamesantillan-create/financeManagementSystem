<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollRecord;
use Illuminate\Http\Request;

class PayrollRecordController extends Controller
{
    /**
     * Display all payroll records.
     */
    public function index()
    {
        $payrollRecords = PayrollRecord::with('employee')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payrollRecords,
        ]);
    }

    /**
     * Store a new payroll record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period' => 'required|string|max:255',
            'basic_salary' => 'required|numeric|min:0',
            'overtime' => 'nullable|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:50',
        ]);

        $basicSalary = $validated['basic_salary'];
        $overtime = $validated['overtime'] ?? 0;
        $allowances = $validated['allowances'] ?? 0;
        $deductions = $validated['deductions'] ?? 0;

        $grossPay = $basicSalary + $overtime + $allowances;
        $netPay = $grossPay - $deductions;

        $payrollRecord = PayrollRecord::create([
            'employee_id' => $validated['employee_id'],
            'period' => $validated['period'],
            'basic_salary' => $basicSalary,
            'overtime' => $overtime,
            'allowances' => $allowances,
            'deductions' => $deductions,
            'gross_pay' => $grossPay,
            'net_pay' => $netPay,
            'status' => $validated['status'] ?? 'Pending',
        ]);

        $payrollRecord->load('employee');

        return response()->json([
            'success' => true,
            'message' => 'Payroll record created successfully.',
            'data' => $payrollRecord,
        ], 201);
    }

    /**
     * Display one payroll record.
     */
    public function show(PayrollRecord $payrollRecord)
    {
        $payrollRecord->load('employee');

        return response()->json([
            'success' => true,
            'data' => $payrollRecord,
        ]);
    }

    /**
     * Update a payroll record.
     */
    public function update(Request $request, PayrollRecord $payrollRecord)
    {
        $validated = $request->validate([
            'employee_id' => 'sometimes|required|exists:employees,id',
            'period' => 'sometimes|required|string|max:255',
            'basic_salary' => 'sometimes|required|numeric|min:0',
            'overtime' => 'nullable|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:50',
        ]);

        $basicSalary = $validated['basic_salary'] ?? $payrollRecord->basic_salary;
        $overtime = $validated['overtime'] ?? $payrollRecord->overtime;
        $allowances = $validated['allowances'] ?? $payrollRecord->allowances;
        $deductions = $validated['deductions'] ?? $payrollRecord->deductions;

        $grossPay = $basicSalary + $overtime + $allowances;
        $netPay = $grossPay - $deductions;

        $payrollRecord->update([
            ...$validated,
            'basic_salary' => $basicSalary,
            'overtime' => $overtime,
            'allowances' => $allowances,
            'deductions' => $deductions,
            'gross_pay' => $grossPay,
            'net_pay' => $netPay,
        ]);

        $payrollRecord->load('employee');

        return response()->json([
            'success' => true,
            'message' => 'Payroll record updated successfully.',
            'data' => $payrollRecord,
        ]);
    }

    /**
     * Delete a payroll record.
     */
    public function destroy(PayrollRecord $payrollRecord)
    {
        $payrollRecord->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payroll record deleted successfully.',
        ]);
    }
}
