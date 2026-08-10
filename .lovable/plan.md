# EES N.º 6 — Plataforma institucional con experiencia de app

Objetivo: mantener el sitio institucional actual (contenido, chatbot, admin, Tu Futuro, Biblioteca) y reorganizarlo como una aplicación con pantallas internas, lista para empaquetar como APK Android. Todo con navegación interna (sin pestañas nuevas ni dominios externos).

## Estado actual (análisis)

- Ya existe navegación interna por rutas: `/` (todo el sitio en una sola página larga), `/admin`, `/tu-futuro/*`, `/biblioteca/*`.
- La Biblioteca ya tiene: sesión de estudiante por nombre, acceso docente por código maestro (verificado en el servidor), materiales, novedades, calendario, favoritos, asistente y panel docente.
- El contenido institucional (historia, noticias, galería, contacto, chatbot) vive en `src/data/school.ts` y es editable desde `/admin`.

Se reutiliza todo eso; no se reescribe nada desde cero.

## Fase 1 — Navegación tipo aplicación

- Nuevo caparazón de app compartido: encabezado institucional con logo + botón "Volver", y en celular una barra inferior fija: Inicio · Biblioteca · Notificaciones · Institución · Más. En escritorio, menú superior.
- La página larga actual se divide en pantallas propias, reutilizando los bloques ya escritos:
  - `/` → menú institucional (hero + tarjetas grandes de acceso a cada sección)
  - `/institucion`, `/historia`, `/centro-estudiantes`, `/proyectos`, `/noticias`, `/contacto`
  - `/biblioteca` y `/tu-futuro` quedan como están, integrados al mismo caparazón
- "Más" agrupa Historia, Centro de Estudiantes, Proyectos, Tu Futuro y Contacto.
- Botones grandes, objetivos táctiles amplios, sin depender de hover.

## Fase 2 — Historia de la Escuela

Pantalla dedicada con línea de tiempo vertical pensada para celular:

- 26/05/2006 — Creada como Secundaria Básica N.º 2
- 01/11/2014 — Pasa a denominarse Escuela de Educación Secundaria N.º 6
- Agosto 2018 — Se establece en San Martín 57, Lobos

Editable desde el panel de administración existente.

## Fase 3 — Biblioteca con cuatro perfiles

Pantalla inicial de la Biblioteca con cuatro accesos: Estudiante, Docente, Preceptor, Directivo. No se muestra contenido hasta elegir perfil.

- Estudiante: se mantiene el ingreso por nombre y se agrega la elección de año (uno solo). Ve materiales y comunicados de su año.
- Docente: acceso con el sistema actual; conserva años y materias que enseña.
- Preceptor y Directivo: acceso por código propio, guardado como secreto del servidor (nunca visible en la interfaz ni en el código del navegador).

La autorización se valida siempre en el servidor en cada operación, no en la interfaz.

## Fase 4 — Comunicados, destinatarios y bandeja de notificaciones

Nuevas tablas en el backend:

- `bib_messages`: remitente, rol del remitente, título, contenido, fecha.
- `bib_message_targets`: uno o varios destinatarios por mensaje (toda la institución / estudiantes / docentes / preceptores / año específico / persona específica).
- `bib_message_reads`: estado de lectura por destinatario.

Reglas:

- Antes de enviar, el remitente elige explícitamente los destinatarios (con casillas por rol y por año, combinables: por ejemplo "5.º año + docentes").
- Nunca se envía a todos por defecto.
- Cada perfil ve solo lo que le corresponde; la selección se resuelve en el servidor.
- Bandeja 🔔 para todos los perfiles: nuevas y leídas, con fecha, hora, remitente, destinatario, título y contenido; marcar como leída y archivar.

Permisos de envío:

- Docente: años/materias que enseña, un estudiante, un preceptor u otro docente.
- Preceptor: estudiantes, docentes, otros preceptores, uno o varios años; además historial de enviados.
- Director: cualquier destinatario o combinación, incluida toda la institución.
- Estudiante: solo recibe.

## Fase 5 — Paneles de Preceptor y Director

- Preceptor: enviar comunicado, bandeja, historial.
- Director: comunicados, notificaciones con selector completo de destinatarios, historial y administración de contenidos institucionales.

## Notas técnicas

- Rutas con TanStack Router (`src/routes/...`), navegación con `<Link>`; ningún `target="_blank"` en secciones internas.
- Componentes reutilizables: `AppShell` institucional, `SectionHeader`, `BackButton`, `BottomNav`, `RecipientPicker`, `NotificationList`.
- Los códigos de preceptor y director se guardan como secretos del backend y se comparan en el servidor con comparación de tiempo constante, igual que el código docente actual.
- Tablas nuevas con RLS: lectura solo mediante funciones del servidor que validan el rol; sin acceso anónimo directo.
- Se verifica el build y el preview después de cada fase.

## Entrega

Se implementa por fases, en este orden, verificando que el sitio siga funcionando después de cada una.
