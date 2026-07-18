<?php

namespace App\Infrastructure\Models\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Models\Role;

class RolePermiso extends Model
{
    use HasFactory;

    protected $table = 'role_permiso';

    protected $fillable = [
        'role_id',
        'permiso_id',
        'estado',
    ];

    protected $casts = [
        'id'         => 'integer',
        'role_id'    => 'integer',
        'permiso_id' => 'integer',
        'estado'     => 'integer',
    ];

    /**
     * Relación con el rol
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Relación con el permiso
     */
    public function permiso(): BelongsTo
    {
        return $this->belongsTo(Permiso::class, 'permiso_id');
    }
}
