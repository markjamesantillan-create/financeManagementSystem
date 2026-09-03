<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Employee;

class PayrollRecord extends Model
{
    protected $fillable = [
        'employee_id',
        'period',
        'basic_salary',
        'overtime',
        'allowances',
        'deductions',
        'gross_pay',
        'net_pay',
        'status',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'overtime' => 'decimal:2',
        'allowances' => 'decimal:2',
        'deductions' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'net_pay' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
