<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeguridadRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_rutas_privadas_requieren_token(): void
    {
        $response = $this->getJson('/api/v1/turnos');
        $response->assertStatus(401);

        $responseAdmin = $this->getJson('/api/v1/admin/personal');
        $responseAdmin->assertStatus(401);
    }

    public function test_rutas_publicas_no_requieren_token(): void
    {
        $responseDisplay = $this->getJson('/api/v1/display/todas');
        $responseDisplay->assertStatus(200);

        $responsePlaylist = $this->getJson('/api/v1/videos/playlist');
        $responsePlaylist->assertStatus(200);
    }
}
