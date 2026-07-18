# Manual de usuario — Digiturno Consalud

## 1. Propósito

Digiturno organiza la atención de pacientes mediante turnos por área. La aplicación se abre dentro de Consalud y utiliza la sesión que ya inició allí; por ese motivo **no existe una pantalla propia de inicio de sesión**.

Cada usuario solo verá las opciones y áreas que Consalud le haya autorizado.

## 2. Ingreso a la aplicación

1. Inicie sesión normalmente en Consalud.
2. Abra el módulo **Digiturno** desde el menú de Consalud.
3. Espere unos segundos mientras se conecta la sesión.
4. Si aparece “Acceso no disponible”, vuelva a abrir Digiturno desde Consalud. Si persiste, solicite al administrador la asignación de permisos y áreas.

No cierre sesión dentro del iframe ni comparta el enlace directo de Digiturno: debe accederse desde Consalud.

## 3. Perfiles y permisos

| Perfil | Permiso requerido | Acciones habituales |
| --- | --- | --- |
| Recepción | `digiturno.recepcion` | Buscar paciente en Consalud, registrar exámenes y crear turnos. |
| Consultorio | `digiturno.consultorio` | Ver la cola de sus áreas, llamar, rellamar, completar, marcar ausente o cancelar turnos. |
| Administración | `digiturno.admin` | Gestionar áreas, tipos de examen y videos de pantalla. |
| Supervisión | `digiturno.dashboard` | Consultar indicadores y la pantalla de visualización. |

Además de los permisos, Consalud asigna las áreas autorizadas. Por ejemplo, un usuario autorizado solo para `LAB` no puede consultar ni operar turnos de `RX`.

## 4. Recepción: crear un turno

1. Abra **Recepción**.
2. Seleccione el área de destino.
3. Busque al paciente por documento o por los criterios disponibles.
4. Verifique que los datos mostrados corresponden al paciente. La fuente oficial es Consalud.
5. Registre o seleccione el examen solicitado, cuando aplique.
6. Confirme la creación del turno.

El sistema asigna automáticamente un número con prefijo de área, por ejemplo `LAB-001`. La numeración se reinicia cada día y es independiente por área.

Antes de crear el turno, confirme el destino: la recepción no debe crear turnos para áreas que el paciente no necesita visitar.

## 5. Consultorio: atender la cola

1. Abra **Consultorio**.
2. Seleccione una de las áreas habilitadas para su usuario.
3. Revise la lista de turnos en espera.
4. Pulse **Llamar** en el siguiente turno.
5. Si el paciente no escucha, pulse **Rellamar**.
6. Al finalizar la atención, pulse **Completar**.
7. Si el paciente no se presenta, utilice **Ausente**.
8. Utilice **Cancelar** solo si el turno fue creado por error o ya no debe atenderse.

Cada acción queda registrada en el historial del turno. No refresque repetidamente la página mientras se ejecuta una acción; espere la confirmación del sistema.

## 6. Administración

### Áreas

En **Administración > Áreas** se crean o actualizan los destinos operativos. Cada área tiene:

- Nombre visible.
- Código: identificador usado para autorizar usuarios desde Consalud.
- Prefijo: texto que aparece en el número de turno.
- Color: referencia visual para la cola y la pantalla.
- Estado activo/inactivo.

No cambie códigos ni prefijos durante una jornada activa sin coordinación: puede confundir la atención y la visualización de turnos.

### Tipos de examen

En **Administración > Tipos de examen** se mantienen los catálogos que recepción utiliza al registrar la atención. Mantenga nombres claros y códigos únicos.

### Videos de pantalla

En **Administración > Videos** se cargan, activan, desactivan y ordenan los videos que se reproducen en la pantalla TV. Verifique el contenido antes de activarlo y use archivos de tamaño razonable para no degradar la reproducción.

## 7. Dashboard y pantalla TV

El **Dashboard** muestra indicadores operativos para supervisión. Úselo para revisar volumen, espera y estado de atención por área.

La **pantalla TV** es pública y está diseñada para un monitor de sala. Muestra número de turno, nombre público del paciente (primer nombre y primer apellido) y área de destino. No debe usarse para consultar información clínica ni datos personales adicionales.

Para operación continua:

1. Abra la pantalla TV en el navegador del monitor autorizado.
2. Compruebe que muestra “EN VIVO”.
3. Mantenga el navegador en pantalla completa.
4. Verifique sonido, red y reproducción de videos al inicio de cada jornada.

## 8. Problemas frecuentes

| Situación | Acción recomendada |
| --- | --- |
| “Conectando con Consalud” permanece visible | Recargue Consalud, vuelva a abrir el módulo y confirme conectividad. |
| “Acceso no disponible” | Ingrese desde Consalud, no mediante URL directa. Si continúa, solicite permisos o áreas al administrador. |
| No veo un área | Confirme que el código del área esté asignado a su usuario en Consalud y que el área esté activa. |
| No puedo operar un turno | Verifique que corresponde a un área autorizada y que su perfil sea de consultorio. |
| La pantalla TV no se actualiza | Confirme conexión de red y actualice una vez. Si continúa, escale a soporte indicando la hora y el área afectada. |
| El número de turno parece repetido | Informe de inmediato a soporte; no cree turnos adicionales para compensarlo. |

## 9. Buenas prácticas

- Valide paciente, área y examen antes de crear un turno.
- Llame los turnos en el orden de la cola, salvo que el protocolo clínico indique otra prioridad.
- No use la pantalla pública para revelar documentos, teléfonos, diagnósticos u otra información sensible.
- No comparta capturas con datos de pacientes fuera de los canales autorizados.
- Reporte permisos incorrectos, eventos duplicados o errores con fecha, hora, número de turno y área.

## 10. Solicitudes a soporte

Para una solicitud de acceso, indique: nombre del usuario, perfil requerido, códigos de área y fecha de inicio. Para incidentes, incluya una captura si está permitida, hora aproximada, área, número de turno y la acción que se intentaba realizar.

El equipo administrador debe gestionar permisos y áreas desde Consalud; Digiturno no crea ni modifica cuentas de usuario.
