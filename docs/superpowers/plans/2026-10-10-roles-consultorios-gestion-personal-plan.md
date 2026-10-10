# Plan de Implementación: Control de Acceso por Roles, Asignación de Consultorios y Gestión de Personal

**Basado en:** `docs/superpowers/specs/2026-10-10-roles-consultorios-gestion-personal-design.md`  
**Fecha:** 2026-10-10  
**Objetivo:** Implementar la tabla de personal y roles en Digiturno, sembrar administradores iniciales, enriquecer el login con redirección automática del médico a su consultorio y crear la interfaz administrativa de gestión de usuarios con protección de rutas.

---

## Tareas

### Fase 1: Backend (Laravel 11)

- [ ] **Tarea 1.1: Migración y Modelo `PersonalDigiturno`**
  - Crear migración `backend/database/migrations/2026_10_10_000001_create_personal_digiturno_table.php`:
    - Columnas: `numero_documento` (string 30, unique, index), `nombre` (string 255, nullable), `rol` (enum: `admin`, `recepcion`, `medico`), `area_id_predeterminada` (fk nullable -> `areas.id`), `puede_rotar` (boolean, default true), `activo` (boolean, default true).
  - Crear modelo `backend/app/Models/PersonalDigiturno.php` con relación `belongsTo(Area::class, 'area_id_predeterminada')`.
  - Ejecutar `php artisan migrate`.
  - *Criterio de éxito:* Tabla creada en base de datos y modelo funcional.

- [ ] **Tarea 1.2: Seeder Inicial de Administradores**
  - Crear `backend/database/seeders/PersonalInicialSeeder.php` sembrando:
    - Cédula `1065584737` &rarr; Rol: `admin`, Activo: `true`.
    - Cédula `1065562800` &rarr; Rol: `admin`, Activo: `true`.
  - Registrar en `DatabaseSeeder.php` y ejecutar `php artisan db:seed --class=PersonalInicialSeeder`.
  - *Criterio de éxito:* Registros sembrados en la tabla `personal_digiturno`.

- [ ] **Tarea 1.3: Enriquecimiento del Login con Rol y Consultorio**
  - Ubicación: `backend/app/Modules/Auth/Controllers/ControladorAuth.php`
  - Tras validar credenciales en Consalud, buscar la cédula en `PersonalDigiturno::with('areaPredeterminada')`.
  - Adjuntar a la respuesta JSON:
    - `rol`: `admin` | `recepcion` | `medico`.
    - `area_predeterminada`: `{ id, codigo, nombre, prefijo }` (si aplica).
    - `puede_rotar`: boolean.
  - *Criterio de éxito:* `POST /api/v1/auth/login` devuelve el rol local y consultorio asignado.

- [ ] **Tarea 1.4: API de Gestión de Personal (Admin)**
  - Crear `backend/app/Modules/Admin/Controllers/ControladorPersonal.php`:
    - `index`: Lista colaboradores con relación de área.
    - `store`: Registrar colaborador (valida cédula única, rol, y área si es médico).
    - `update`: Editar rol, consultorio predeterminado o rotación.
    - `toggleActivo`: Alternar estado activo / inactivo.
  - Registrar rutas en `backend/app/Modules/Admin/routes.php`.
  - *Criterio de éxito:* Endpoints CRUD funcionales bajo `/api/v1/admin/personal`.

---

### Fase 2: Frontend (React 19 + TypeScript)

- [ ] **Tarea 2.1: Actualizar tipos y estado en `useAuth.ts`**
  - Ubicación: `frontend/src/features/auth/hooks/useAuth.ts`
  - Expandir interfaz `ConsaludUser` con `rol`, `area_predeterminada` y `puede_rotar`.
  - *Criterio de éxito:* TypeScript reconoce las propiedades de rol y consultorio.

- [ ] **Tarea 2.2: Redirección Inteligente tras Login en `LoginPage.tsx`**
  - Ubicación: `frontend/src/features/auth/pages/LoginPage.tsx`
  - Al completar login:
    - Si `user.rol === 'medico'` &rarr; redirigir directamente a `/consultorio/:codigo`.
    - De lo contrario &rarr; redirigir a `/recepcion`.
  - Si ya tiene sesión activa previa y abre `/login` &rarr; aplicar la misma lógica de redirección.
  - *Criterio de éxito:* El médico entra directamente a su consultorio asignado.

- [ ] **Tarea 2.3: Blindaje de la Sección "Acciones" en `ReceptionPage.tsx`**
  - Ubicación: `frontend/src/features/reception/pages/ReceptionPage.tsx`
  - En la barra lateral izquierda:
    - Mostrar botones *Dashboard*, *Admin Áreas*, *Admin Videos* y el nuevo *Gestión de Personal* únicamente si `user?.rol === 'admin'`.
    - Si es recepcionista normal, ocultar completamente el bloque administrativo.
  - *Criterio de éxito:* Los recepcionistas no ven accesos a configuración ni métricas.

- [ ] **Tarea 2.4: Guardián de Rutas Administrativas (`RequireAdmin.tsx`)**
  - Crear `frontend/src/components/layout/RequireAdmin.tsx`:
    - Valida que `user?.rol === 'admin'`.
    - Si no es admin, redirige a `/recepcion` (o `/consultorio/...`) con alerta de permiso denegado.
  - Proteger `/dashboard`, `/admin/areas`, `/admin/videos` y `/admin/personal` en `frontend/src/routes/index.tsx`.
  - *Criterio de éxito:* Rutas administrativas inaccesibles escribiendo la URL manualmente si no es admin.

- [ ] **Tarea 2.5: Pantalla de Gestión de Personal (`AdminPersonalPage.tsx`)**
  - Crear `frontend/src/features/admin/pages/AdminPersonalPage.tsx`:
    - Tabla con buscador, filtros y badges por rol.
    - Modal *"Registrar Colaborador"* con selector de rol y consultorio predeterminado.
    - Botón para activar/desactivar acceso del colaborador.
  - Registrar ruta en `frontend/src/routes/index.tsx`.
  - *Criterio de éxito:* El administrador puede registrar y modificar personal visualmente.

---

### Fase 3: Pruebas y Verificación

- [ ] **Tarea 3.1: Prueba de Login Administrador**
  - Iniciar sesión con cédula `1065584737` o `1065562800`.
  - Validar acceso completo a Recepción, Dashboard y Gestión de Personal.

- [ ] **Tarea 3.2: Prueba de Creación y Login de Médico**
  - Desde `/admin/personal`, registrar un médico vinculado al Consultorio 1 (`c1`).
  - Iniciar sesión con ese médico y verificar redirección automática a `/consultorio/c1`.

- [ ] **Tarea 3.3: Prueba de Restricción para Recepcionista**
  - Iniciar sesión con recepcionista.
  - Comprobar que no ve botones administrativos y que el acceso directo por URL a `/admin/personal` es bloqueado.
