<?php

return [
    // Fixtures are deliberately available only through the local/testing guard
    // in AuthenticateConsalud. They model the production /auth/me contract.
    'mock_identities' => [
        'dev-admin' => [
            'id' => 'dev-admin', 'name' => 'Administradora de desarrollo',
            'permissions' => ['digiturno.recepcion', 'digiturno.consultorio', 'digiturno.dashboard', 'digiturno.admin', 'digiturno.kiosco'],
            'area_codes' => ['*'],
        ],
        'dev-recepcion' => [
            'id' => 'dev-recepcion', 'name' => 'Recepción de desarrollo',
            'permissions' => ['digiturno.recepcion', 'digiturno.dashboard'], 'area_codes' => [],
        ],
        'dev-c1' => [
            'id' => 'dev-c1', 'name' => 'Profesional C1',
            'permissions' => ['digiturno.consultorio'], 'area_codes' => ['c1'],
        ],
    ],
];
