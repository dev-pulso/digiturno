# Integración de Digiturno con Consalud

## Alcance implementado

Esta rama elimina la necesidad de un inicio de sesión propio en Digiturno. La identidad, permisos y áreas autorizadas proceden del JWT ya iniciado en Consalud. Digiturno no persiste el token en `localStorage`, cookies ni base de datos.

Archivos principales afectados: `backend/routes/api.php`, `backend/bootstrap/app.php`, `backend/app/Http/Middleware/AuthenticateConsalud.php`, `backend/app/Http/Middleware/RequireConsaludPermission.php`, `backend/app/Http/Controllers/SessionController.php`, `backend/config/consalud.php`, `backend/config/services.php`, `backend/config/reverb.php`, las rutas y controlador de turnos, `frontend/src/lib/embedded-auth.ts`, `frontend/src/components/auth/*`, `frontend/src/features/dev/pages/ConsaludHostPage.tsx` y `frontend/src/features/display/pages/DisplayPage.tsx`.

También se retiró del control de versiones `backend/.env.reverb`; se entrega `backend/.env.reverb.example` sin secretos.

## Arquitectura y protocolo de autenticación

1. Consalud carga Digiturno en un iframe de origen distinto.
2. Digiturno avisa al padre mediante `postMessage({ type: 'DIGITURNO_READY' })`.
3. El padre responde únicamente al origen configurado con `{ type: 'CONSALUD_AUTH', accessToken }`.
4. Digiturno conserva el token solamente en memoria y lo envía como `Authorization: Bearer <token>`.
5. El middleware `consalud.auth` consulta `GET {CONSALUD_URL}/auth/me`, normaliza la identidad y la guarda hasta 30 segundos en caché por hash del token.
6. Ante expiración o 401, Digiturno borra su memoria y emite `DIGITURNO_AUTH_REQUIRED`; Consalud debe renovar y reenviar el token.

En desarrollo existe `/dev/consalud-host`, disponible solo con Vite en modo desarrollo (o `VITE_ENABLE_DEV_HOST=true`). Simula el padre y usa las identidades definidas en `backend/config/consalud.php` cuando `IDENTITY_PROVIDER=mock`. El proveedor mock está bloqueado fuera de `local` y `testing`.

## Contrato requerido de `/auth/me`

Consalud debe validar el JWT y responder 200 JSON. Se admite el usuario en la raíz o bajo `user`:

```json
{
  "user": { "id": 42, "full_name": "Nombre Usuario" },
  "permissions": ["digiturno.recepcion"],
  "digiturno_area_codes": ["LAB", "RX"]
}
```

`permissions` también puede estar dentro de `user`. Los permisos requeridos son `digiturno.recepcion`, `digiturno.consultorio`, `digiturno.admin` y `digiturno.dashboard`. `digiturno_area_codes` usa códigos de `areas.codigo`; `*` permite todas las áreas. Un fallo, timeout o respuesta no exitosa se rechaza con 401.

## Variables de entorno

Local:

```dotenv
APP_ENV=local
APP_TIMEZONE=America/Bogota
IDENTITY_PROVIDER=mock
VITE_CONSALUD_ORIGIN=http://localhost:5173
```

Producción:

```dotenv
APP_ENV=production
APP_TIMEZONE=America/Bogota
CONSALUD_URL=https://api.consalud.example
IDENTITY_PROVIDER=consalud
CONSALUD_CONNECT_TIMEOUT=3
CONSALUD_TIMEOUT=5
CONSALUD_IDENTITY_CACHE_SECONDS=30
REVERB_ALLOWED_ORIGINS=https://consalud.example,https://digiturno.example
VITE_CONSALUD_ORIGIN=https://consalud.example
VITE_REVERB_APP_KEY=<clave-publica>
VITE_REVERB_HOST=<host-reverb>
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

Configurar `REVERB_APP_ID`, `REVERB_APP_KEY` y `REVERB_APP_SECRET` exclusivamente en el gestor de secretos. Copiar `backend/.env.reverb.example` para una instalación local; nunca restaurar el archivo histórico ni enviar secretos al repositorio.

## Seguridad, iframe y tiempo real

Consalud debe limitar su iframe a `https://digiturno.example`. Digiturno debe emitir `Content-Security-Policy: frame-ancestors https://consalud.example` y no usar `*`; configurar CORS solo para el origen de Consalud y autorizar el encabezado `Authorization`.

Reverb debe aceptar únicamente `REVERB_ALLOWED_ORIGINS`, terminar TLS en 443 y ejecutarse detrás de Redis/colas. La pantalla TV es pública por diseño (`/api/v1/public/display` y `/api/v1/public/videos/playlist`); sus respuestas y eventos solo incluyen turno, nombre público (primer nombre y primer apellido), destino y estado, nunca documento, teléfono ni identificadores internos.

## Migración y concurrencia

La migración `2026_07_18_000018_add_daily_sequence_to_turnos.php` agrega `fecha_turno` y `consecutivo_diario`, un único índice por área/día/consecutivo y un índice de lectura por fecha/área/estado. La creación de turnos ahora abre una transacción, bloquea la última secuencia del área y genera números diarios (`LAB-001`).

Antes de desplegar, revisar los turnos históricos: la nueva migración deja sus campos nuevos como `NULL`, por lo que se recomienda un backfill controlado antes de exigir `NOT NULL` en una migración posterior.

## Despliegue y rollout

1. Crear permisos y códigos de área en Consalud; implementar y probar `/auth/me`.
2. Configurar secretos, CSP/CORS, Redis, workers y Reverb en staging.
3. Ejecutar `php artisan migrate --force`, `php artisan config:cache` y reiniciar workers/Reverb.
4. Desplegar frontend con `VITE_CONSALUD_ORIGIN` y configuración Reverb de producción.
5. Probar iframe, renovación de token, perfiles por área, pantalla TV y creación simultánea de turnos.
6. Activar en producción de forma gradual por área; vigilar errores 401/403, latencia de `/auth/me`, colas y conexiones Reverb.

Rollback: volver al artefacto anterior, detener consumidores incompatibles y conservar las columnas nuevas (no ejecutar rollback destructivo de migraciones con datos). Restaurar desde respaldo si una migración falla.

## Rotación, respaldo y tareas pendientes

- Rotar de inmediato cualquier secreto que hubiera estado en el `.env.reverb` versionado y limpiar su historial según la política corporativa.
- Programar respaldos PostgreSQL y pruebas periódicas de restauración; monitorizar locks, errores de colas y fallos de difusión.
- Configurar alarmas para errores de identidad, 401/403 anómalos, colas detenidas y Reverb sin conexiones.
- Añadir pruebas PHP con PostgreSQL para concurrencia, autorización de recursos y contrato `/auth/me`; el entorno actual no expone PHP/Composer para ejecutarlas.
- Corregir la deuda de lint del frontend antes de la salida: hay errores existentes de tipos `any`, hooks y componentes; el build de producción sí compila.
- Resolver la advertencia de `npm audit` asociada a `form-data` y revisar el conflicto de peer dependency React 19/`react-speech-kit` antes del despliegue.

## Checklist de salida a producción

- [ ] Token validado exclusivamente por Consalud y nunca persistido por Digiturno.
- [ ] Origen de `postMessage`, CSP y CORS restringidos a dominios productivos.
- [ ] Permisos y áreas comprobados con cuentas reales.
- [ ] Secretos rotados y fuera de Git.
- [ ] Migración y backfill validados sobre una copia de producción.
- [ ] Redis, workers, Reverb, TLS y monitoreo funcionando.
- [ ] Pruebas de carga de numeración concurrente y de pantalla TV completadas.
- [ ] Plan de rollback, respaldo y responsables de guardia aprobados.

Las tareas que requieren cambios fuera de este repositorio son la implementación de `/auth/me`, la emisión/renovación segura del JWT por Consalud, permisos y áreas, el contenedor iframe, CSP/CORS de sus dominios, infraestructura Redis/Reverb/workers y la rotación del secreto expuesto históricamente.
