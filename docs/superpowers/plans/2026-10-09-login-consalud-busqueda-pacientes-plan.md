# Plan de Implementación: Autenticación con Consalud y Búsqueda Segura de Pacientes en Recepción

**Basado en:** `docs/superpowers/specs/2026-10-09-login-consalud-busqueda-pacientes-design.md`  
**Fecha:** 2026-10-09  
**Objetivo:** Implementar el flujo de autenticación contra la API de Consalud con máxima seguridad (BFF, cookies HttpOnly, rate limiting) y la búsqueda de pacientes por cédula en Recepción con el token de sesión activo.

---

## Tareas

### Fase 1: Backend (Laravel)

- [ ] **Tarea 1.1: Adaptar `ConsaludService.php`**
  - Ubicación: `backend/app/Services/ConsaludService.php`
  - Añadir método `public function login(string $usernameOrEmail, string $password): ?array` que llame a `POST /auth/login` con timeout y sin BOM.
  - Modificar `buscarPacientes(string $busqueda, ?string $userToken = null): array` para priorizar `$userToken` sobre el token cacheado de sistema.
  - Modificar `buscarIngresoCompleto(string $documento, ?string $userToken = null): ?array` para recibir y propagar `$userToken`.
  - *Criterio de éxito:* Pruebas de llamada a login retornan token y estructura de usuario; peticiones a ingresos usan el token suministrado.

- [ ] **Tarea 1.2: Crear módulo de autenticación en Laravel (`app/Modules/Auth`)**
  - Crear `backend/app/Modules/Auth/Requests/LoginRequest.php`:
    - Validación: `usernameOrEmail` (string, max:100, requerido), `password` (string, max:100, requerido).
  - Crear `backend/app/Modules/Auth/Controllers/ControladorAuth.php`:
    - `login(LoginRequest $request)`: Llama a `ConsaludService::login`, verifica estado activo (`estado === 1`), emite cookie HTTP `consalud_token` (`HttpOnly=true`, `SameSite=Lax`, `Secure`), responde con datos de usuario (`user`) y tokens normalizados.
    - `logout()`: Elimina la cookie `consalud_token` y responde 200 OK.
    - `me(Request $request)`: Retorna información del usuario si la sesión es válida.
  - *Criterio de éxito:* `POST /api/v1/auth/login` emite cabecera `Set-Cookie` y retorna datos del usuario.

- [ ] **Tarea 1.3: Registrar rutas y rate limiting**
  - Crear `backend/app/Modules/Auth/routes.php`:
    - `Route::post('auth/login', [ControladorAuth::class, 'login'])->middleware('throttle:5,1');`
    - `Route::post('auth/logout', [ControladorAuth::class, 'logout']);`
    - `Route::get('auth/me', [ControladorAuth::class, 'me']);`
  - Registrar en `backend/routes/api.php`:
    - `require base_path('app/Modules/Auth/routes.php');`
  - *Criterio de éxito:* Rutas accesibles bajo `/api/v1/auth/*` y el 6to intento fallido responde HTTP 429.

- [ ] **Tarea 1.4: Actualizar `ControladorPaciente.php`**
  - Ubicación: `backend/app/Modules/Patients/Controllers/ControladorPaciente.php`
  - En `buscarPorDocumento(Request $request)`:
    - Extraer token desde `$request->cookie('consalud_token') ?? $request->bearerToken()`.
    - Pasarlo como segundo argumento a `ConsaludService::buscarIngresoCompleto($documento, $token)`.
  - *Criterio de éxito:* La búsqueda utiliza el token de la sesión activa del recepcionista.

---

### Fase 2: Frontend (React + TypeScript)

- [ ] **Tarea 2.1: Configurar cliente API con soporte de cookies y credenciales**
  - Ubicación: `frontend/src/lib/api-client.ts`
  - Configurar `withCredentials: true` en la instancia de Axios.
  - Configurar interceptor para adjuntar token Bearer si existe en memoria/storage.
  - Interceptor de respuesta: ante error `401 Unauthorized`, limpiar sesión local y redirigir a `/login`.
  - *Criterio de éxito:* Las peticiones viajan con credenciales y un 401 redirige automáticamente.

- [ ] **Tarea 2.2: Crear hook de autenticación y auto-logout por inactividad**
  - Crear `frontend/src/features/auth/hooks/useAuth.ts`:
    - Estado de `user` y `isAuthenticated`.
    - Funciones `login(credentials)` y `logout()`.
    - Listener de eventos (`mousemove`, `keydown`, `touchstart`) con temporizador de 15 minutos para auto-logout.
  - *Criterio de éxito:* Sesión persiste en recargas de página y el usuario puede cerrar sesión manualmente o por inactividad.

- [ ] **Tarea 2.3: Crear vista de Login (`LoginPage.tsx`)**
  - Crear `frontend/src/features/auth/pages/LoginPage.tsx`:
    - Diseño responsive con estética médica corporativa (Digiturno / Consalud).
    - Inputs para usuario/correo y contraseña (con botón de visibilidad de contraseña).
    - Estado de carga en el botón de submit.
    - Manejo de mensajes de error amigables.
    - Redirección automática a `/recepcion` tras login exitoso.
  - *Criterio de éxito:* Interfaz intuitiva, funcional y accesible.

- [ ] **Tarea 2.4: Actualizar guardián de rutas (`RequireStaff.tsx`) y rutas principales**
  - Ubicación: `frontend/src/components/layout/RequireStaff.tsx`
    - Reemplazar stub por validación de sesión de `useAuth`. Redirigir a `/login` si no está autenticado.
  - Ubicación: `frontend/src/routes/index.tsx`
    - Agregar ruta `/login` apuntando a `LoginPage`.
  - *Criterio de éxito:* Intentar entrar a `/recepcion` sin autenticarse redirige a `/login`.

- [ ] **Tarea 2.5: Agregar barra de sesión en Recepción**
  - Ubicación: `frontend/src/features/reception/pages/ReceptionPage.tsx`
  - Mostrar el nombre del usuario autenticado y su rol (ej. *"👤 Ana Martínez | Recepción"*).
  - Botón *"Cerrar sesión"* visible que llama a `logout()`.
  - *Criterio de éxito:* El recepcionista ve claramente quién está conectado y puede desloguearse en 1 clic.

---

### Fase 3: Pruebas Integradas y Verificación

- [ ] **Tarea 3.1: Prueba de Login y Protección de Rutas**
  - Probar login con credenciales válidas e inválidas.
  - Verificar que la cookie `consalud_token` tiene flags `HttpOnly` y `SameSite=Lax`.
  - Comprobar que rutas no autenticadas son bloqueadas.

- [ ] **Tarea 3.2: Prueba de Búsqueda de Pacientes en Consalud**
  - Ingresar una cédula en `/recepcion` y validar que el request hacia Consalud utiliza el token del usuario.
  - Verificar la correcta renderización de datos del paciente y sus exámenes.

- [ ] **Tarea 3.3: Prueba de Seguridad (Rate limit y auto-logout)**
  - Comprobar bloqueo con HTTP 429 tras 5 intentos fallidos consecutivos de login.
  - Validar cierre de sesión por inactividad.
