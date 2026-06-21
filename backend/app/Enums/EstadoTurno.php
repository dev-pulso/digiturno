<?php

namespace App\Enums;

enum EstadoTurno: string
{
    case EnEspera = 'en_espera';
    case Llamando = 'llamando';
    case Completado = 'completado';
    case Ausente = 'ausente';
    case Cancelado = 'cancelado';

    public function etiqueta(): string
    {
        return match ($this) {
            self::EnEspera => 'En espera',
            self::Llamando => 'Llamando',
            self::Completado => 'Atendido',
            self::Ausente => 'Ausente',
            self::Cancelado => 'Cancelado',
        };
    }

    public static function transiciones(): array
    {
        return [
            self::EnEspera->value => [self::Llamando, self::Cancelado],
            self::Llamando->value => [self::Completado, self::Ausente, self::EnEspera, self::Llamando],
            self::Completado->value => [],
            self::Ausente->value => [],
            self::Cancelado->value => [],
        ];
    }
}
