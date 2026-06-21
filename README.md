# Digiturno — Sistema de Turnos Multi-Consultorio

Sistema de gestión de turnos para IPS con múltiples consultorios y exámenes médicos.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | PHP 8.4 + Laravel 11 |
| Base de datos | PostgreSQL |
| Frontend | React 19 + Vite + TypeScript 6 |
| CSS | Tailwind CSS v4 + shadcn/ui |
| Tiempo real | Laravel Reverb WebSocket + Pusher.js |
| TTS | spd-say (Linux) / Web Speech API (Windows) |
| Íconos | @hugeicons/react |

## Arquitectura

```
digiturno/
├── backend/               # API Laravel
│   ├── app/
│   │   ├── Enums/          # EstadoTurno, EstadoExamenPaciente, OrigenTurno
│   │   ├── Events/         # TurnoCreado, TurnoLlamado, TurnoCompletado, etc.
│   │   ├── Models/         # Area, Paciente, Turno, TipoExamen, ExamenPaciente
│   │   ├── Modules/        # Feature-based modules
│   │   │   ├── Areas/
│   │   │   ├── Patients/   # API de pacientes
│   │   │   ├── Turns/      # API de turnos
│   │   │   ├── TiposExamenes/
│   │   │   ├── ExamenesPacientes/
│   │   │   ├── Consultorios/
│   │   │   ├── Display/
│   │   │   ├── Dashboard/
│   │   │   └── Admin/      # Videos
│   │   └── Services/       # MaquinaEstadosTurnos, ServicioExamenesPacientes
│   ├── database/migrations/
│   └── routes/api.php
│
├── frontend/               # SPA React + TypeScript
│   ├── src/
│   │   ├── components/     # UI components (shadcn/ui)
│   │   ├── features/       # Feature pages
│   │   ├── hooks/          # Custom hooks (useTurnos, useConsultorio, etc.)
│   │   └── lib/            # api-client, echo, speech, types
│   └── vite.config.ts
│
└── start-dev.sh            # Script para iniciar todos los servicios
```

## Requisitos

- PHP 8.4+
- PostgreSQL 15+
- Node.js 22+
- Composer
- speech-dispatcher + espeak-ng (TTS en Linux)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/dev-pulso/digiturno.git
cd digiturno

# Backend
cd backend
cp .env.example .env   # Configurar DB, Reverb
composer install
php artisan migrate:fresh --seed
php artisan storage:link

# Frontend
cd ../frontend
cp .env.example .env   # Configurar VITE_REVERB_*
npm install
```

## Desarrollo

```bash
# Iniciar todos los servicios
./start-dev.sh
```

Esto levanta:
- **API** en `http://localhost:8000`
- **WebSocket** en `ws://localhost:8081`
- **Frontend** en `http://localhost:5173`

Las variables de entorno de Reverb deben coincidir entre `backend/.env` y `frontend/.env`.

## Lógica de Negocio

### Flujo del paciente

1. **Recepción**: busca paciente por cédula, asigna exámenes
2. **Auto-encolamiento**: el sistema crea un turno en el consultorio con menos cola
3. **Atención**: el médico llama al paciente, completa el examen
4. **Avance automático**: al completar, el sistema pasa al siguiente consultorio pendiente
5. **Ausente**: si no llega tras 3 llamados, va al final de la cola

### Estados de Turno

```
en_espera → llamando → completado
                  ↘ ausente (va al final de cola)
                  ↘ cancelado
```

### Áreas predeterminadas

| Código | Nombre | Exámenes |
|--------|--------|----------|
| C1 | Consultorio 1 | Espirometría, Toma de Presión |
| C2 | Consultorio 2 | Oftalmología, Optometría |
| C3 | Consultorio 3 | Audiometría |
| C4 | Consultorio 4 | Electrocardiograma |
| TM | Toma de Muestras | Examen de Sangre |

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/areas` | Listar áreas/consultorios |
| POST | `/api/v1/areas` | Crear área |
| GET | `/api/v1/pacientes/buscar-por-documento` | Buscar paciente |
| POST | `/api/v1/pacientes/{id}/examenes` | Asignar exámenes + auto-encolar |
| GET | `/api/v1/consultorios/{id}/cola` | Cola del consultorio |
| POST | `/api/v1/consultorios/{id}/llamar-siguiente` | Llamar siguiente |
| POST | `/api/v1/turnos/{id}/completar` | Completar + avanzar |
| POST | `/api/v1/turnos/{id}/ausente` | Ausente → final de cola |
| GET | `/api/v1/display/todas` | Estado de todas las áreas (Display) |
| GET | `/api/v1/tipos-examenes` | Listar tipos de examen |
