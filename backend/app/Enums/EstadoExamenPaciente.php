<?php

namespace App\Enums;

enum EstadoExamenPaciente: string
{
    case Pendiente = 'pendiente';
    case EnCola = 'en_cola';
    case Llamando = 'llamando';
    case Completado = 'completado';
    case Ausente = 'ausente';

    public function etiqueta(): string
    {
        return match ($this) {
            self::Pendiente => 'Pendiente',
            self::EnCola => 'En cola',
            self::Llamando => 'Llamando',
            self::Completado => 'Completado',
            self::Ausente => 'Ausente',
        };
    }
}
