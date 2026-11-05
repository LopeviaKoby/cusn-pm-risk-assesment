# PMO TIVIT — Instrucciones para agentes de ingeniería

## 1. Propósito del producto

Este repositorio desarrolla una plataforma web corporativa para la Oficina de Gestión de Proyectos (PMO) de TIVIT. Su objetivo es ofrecer una fuente de trabajo y seguimiento del portafolio y del ciclo de vida de los proyectos: registro, planificación, ejecución, seguimiento, riesgos y oportunidades, recursos, horas, costos, presupuestos, facturación, controles de cambio, compras, gobierno, complejidad, entregables, transición y cierre. **No es un sistema de tickets ni un gestor de tareas de propósito general.**

El producto debe facilitar decisiones y operaciones de cuatro perfiles: **ADMIN/Head**, **PM**, **ESPECIALISTA** y **VISUALIZADOR**. Se busca una herramienta confiable, trazable, accesible y eficiente en el trabajo cotidiano, con interfaces densas en información y navegación clara. El desarrollo integra tanto experiencia de usuario como reglas de negocio, persistencia, autorización, pruebas y operación.

El producto se desarrolla por etapas. No asumir que una función del laboratorio está desplegada o habilitada para uso corporativo solo porque existe en el código. Distinguir demo, laboratorio y producción a partir de la configuración y evidencia reales.

## 2. Autoridad, alcance y fuentes de verdad

- El **propietario fullstack del proyecto** define las decisiones de producto, arquitectura, estructura, prioridades y aceptación; contrasta los requisitos de negocio con el cliente. Una instrucción explícita suya autoriza ejecutar el alcance indicado, incluidas reorganizaciones, cambios de dependencias y operaciones Git cuando las solicite. No exigir una segunda aprobación por una preferencia del agente o un flujo de trabajo heredado.
- Ejecutar la tarea solicitada, no sustituirla unilateralmente por un plan, una auditoría o una recomendación. Elaborar un plan breve cuando la complejidad lo justifique, seguido de implementación y comprobación, salvo que se pida expresamente solo planificación.
- Ante contradicciones, priorizar **el mandato actual y las decisiones recientes del propietario**, luego contratos y comportamiento comprobables del repositorio, especificaciones de negocio aplicables y, por último, recomendaciones generales de skills. Respetar siempre las restricciones reales del entorno, la seguridad y los permisos efectivos.
- El código y los esquemas vigentes prueban el comportamiento implementado; las especificaciones aprobadas definen el comportamiento buscado. Identificar discrepancias sin asumir que la implementación antigua es la norma definitiva.
- Consultar documentación **según relevancia**, no obligatoriamente antes de cada cambio: `README.md` para contexto, `specs/` para contratos y migraciones, `DEPLOY.md` para operación y despliegue, `src/design-system/` para tokens vigentes, y `src/design-system/DESIGN.md` para criterios visuales vigentes. Los valores implementados de `tokens.css`, `fonts.css` y `app.css` prevalecen ante cualquier divergencia documental.

## 3. Arquitectura y convenciones

- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4 (CSS-first), componentes existentes y primitivas Radix/shadcn cuando estén presentes. Usar imports y aliases reales, no suponer rutas; preservar contratos públicos, accesibilidad y estilos de ambos temas.
- **Design System:** `src/design-system/tokens.css`, `fonts.css` y `app.css` son la base actual. Google Sans para encabezados; Manrope para cuerpo y controles. Escala de 4/8 px, branding TIVIT `#E50022` y azul Almaviva `#044D8C`; temas `.light`/`.dark`. Mantener tokens semánticos separados de primitivos y de estados de negocio. Usar fuentes locales con sus licencias.
- **Organización UI:** `src/design-system/` contiene CSS, tokens y guía visual; `src/components/atoms/` reúne unidades visuales mínimas reutilizables sin reglas PMO ni API; `molecules/` compone átomos con responsabilidad acotada; `organisms/` reúne secciones visuales complejas sin exigirles conocer la persistencia. `src/layouts/` materializa el nivel conceptual de templates mediante shell y estructura reutilizable: Atomic Design no exige un directorio `templates/`. `src/pages/` coordina vistas del enrutamiento y casos de uso. `src/data/` contiene cliente HTTP, selección de modo y adaptadores de lectura/mutación; `src/assets/` guarda recursos, `src/demo/` datos sintéticos y presentación demo, y `src/stories/` el catálogo visual. Componer y reutilizar respetando las interfaces existentes; evitar ciclos y dependencias ascendentes de capas inferiores hacia `pages` o el router. Los organismos existentes pueden contener lógica de presentación: no deducir que todos son puros.
- **Backend y datos:** el proyecto incluye una API HTTP con Bun y persistencia PostgreSQL; verificar las rutas y versiones efectivas antes de intervenir. El esquema de trabajo PMO es `pmo_cusn`. Mantener migraciones versionadas, transacciones e integridad referencial; no modificar otros esquemas ni datos reales por accidente.
- **Frontera frontend/backend:** en modo `api`, las vistas consumen `src/data/` (`mode.ts`, `client.ts`, `bootstrap.ts`, `edits.ts` y adaptadores pertinentes), que usa `fetch` HTTP con credenciales de mismo origen. `server/src/index.ts` recibe solicitudes, `server/src/session.ts` gestiona la sesión y `server/src/repositories/` accede a PostgreSQL; consultar además `server/src/config.ts`, esquemas y `specs/` para los contratos efectivos de la rama. Las capas nuevas de aplicación, dominio o autorización solo se describen cuando estén publicadas en la rama correspondiente. No copiar aquí un catálogo de endpoints ni inferir permisos por nombre de rol. El modo `demo` se selecciona en `src/data/mode.ts` y usa `src/demo/`; no presupone seguridad ni despliegue corporativo. El navegador no accede a PostgreSQL ni importa migraciones o módulos de `server/`. Átomos y moléculas no ejecutan API ni SQL; organismos y páginas consumen contratos a través de la capa admitida. Las excepciones existentes se evalúan en su contexto, sin imponer refactor fuera del encargo. Autenticación, autorización de acciones y objetos, mínimo privilegio y auditoría corresponden al backend; ocultar controles no concede ni revoca permisos. Preservar privacidad y trazabilidad. Evitar duplicar cálculos de dominio y conservar compatibilidad API salvo autorización expresa.
- Nombrar identificadores técnicos de forma consistente con el código existente; mantener las etiquetas y explicaciones de negocio en español. Evitar renombrados masivos sin necesidad.

## 4. Invariantes del negocio PMO

- El estado del ciclo de vida del proyecto es distinto de su salud, del nivel de riesgo o del resultado financiero. Los siete estados son: **Requiere P1P2** (`p1p2-required`), **En ejecución** (`in-progress`), **En transición** (`in-handover`), **Detenido** (`on-hold`), **Cancelado** (`cancelled`), **Cerrado exitoso** (`closed-successfully`) y **Cerrado con observaciones** (`closed-with-observations`). No traducir `Detenido` a `blocked` ni equiparar `En ejecución` con `on-track`.
- `Requiere P1P2` precede a ejecución. `En transición` implica entrega y revisión/aceptación por parte del cliente antes del cierre. `Detenido` es una suspensión indefinida; `Cancelado` es terminal. Los dos estados de cierre conservan resultados diferentes. No introducir transiciones automáticas basadas solo en semejanzas de nombres.
- Conservar la línea base de término del proyecto y distinguirla de fechas revisadas. El seguimiento contempla avance planificado/real, evidencia e historial. No sustituir una regla de dominio por una simplificación visual.
- No todos los proyectos incluyen operación posterior. Riesgos abiertos, transferidos o mitigados deben tratarse según sus reglas específicas; no deducir cierre exitoso únicamente de una etiqueta.
- Roles **ADMIN, PM, ESPECIALISTA y VISUALIZADOR**: aplicar autenticación, autorización y mínimo privilegio en el backend, no solo ocultamiento de opciones de la interfaz. Mantener auditoría de cambios y responsabilidades.
- Datos demo y muestras deben ser sintéticos. No publicar información corporativa, credenciales, documentos restringidos ni dumps de entornos reales.

## 5. Uso selectivo de skills del repositorio

Codex puede descubrir skills en `.agents/skills/<nombre>/SKILL.md`. **Leer únicamente los que correspondan al trabajo**, sus referencias solo cuando aporten información y verificar que el archivo exista antes de usarlo. No cargar el catálogo completo ni ejecutar scripts de una skill por defecto.

| Trabajo | Skill local a consultar, si existe |
| --- | --- |
| React, hooks, TypeScript y refactor de interfaces | `.agents/skills/react/SKILL.md` |
| Tokens, temas, jerarquía visual y accesibilidad | `.agents/skills/design-system/SKILL.md` |
| Tailwind CSS-first, detección de clases y utilidades | `.agents/skills/tailwind-design-system/SKILL.md` |
| Radix/shadcn, wrappers y configuración de componentes | `.agents/skills/shadcn/SKILL.md` |
| Radix, accesibilidad, foco, Dialog/Tabs/Select | Descubrir una skill local pertinente si existe; contrastar además con documentación oficial Radix |
| Instalación, actualización o auditoría de dependencias pnpm | `.agents/skills/pnpm-supply-chain-security/SKILL.md` |

Para otros dominios (Bun, PostgreSQL, migraciones, pruebas, Storybook, seguridad, Git), descubrir primero las skills realmente disponibles y elegir solo una que aporte al objetivo. **Las skills orientan la ejecución; no son una cadena obligatoria de agentes ni sustituyen las decisiones explícitas del propietario.** Si una instrucción heredada de una skill entra en conflicto con el encargo, identificar el archivo y la regla concreta; resolver conforme al alcance autorizado y las restricciones de seguridad reales, sin bloquear toda la tarea por una recomendación genérica.

No adoptar automáticamente orquestación `orchestrator/design/delivery/control`, perfiles, sellos o procedimientos de Foundry. No leer `.agents/foundry/`, `.agents/roles/` ni `.opencode/` salvo que la tarea trate explícitamente de esos recursos. El objetivo es trabajar de forma directa con Codex y las skills pertinentes.

## 6. Método de ejecución

1. **Inspeccionar lo relevante:** rama, `git status`, rutas afectadas, consumidores, pruebas y dependencias antes de editar. Trabajar sobre los archivos reales, incluso si el árbol está parcialmente migrado.
2. **Implementar el mandato:** aplicar cambios completos, corregir imports, tests, configuraciones y referencias relacionadas cuando sean consecuencia necesaria del alcance. No dejar movimientos a medias por el número de archivos afectados.
3. **Comprobar:** ejecutar las pruebas apropiadas y examinar el resultado compilado o renderizado cuando cambie UI, CSS o fuentes. Investigar fallos nuevos y separarlos de problemas preexistentes.
4. **Entregar evidencia:** resumir archivos modificados, decisiones relevantes, resultados reales de pruebas, limitaciones y estado de Git. No declarar éxito para comandos o comprobaciones no ejecutados.

Para cambios pequeños, mantener el proceso breve. Para refactors extensos, trabajar por grupos verificables. Si aparece un conflicto Git, resolverlo de acuerdo con el destino arquitectónico autorizado y comprobar la integración, en vez de abandonar automáticamente la operación. Preservar cambios ajenos y evitar pérdida de trabajo.

## 7. Dependencias, pruebas y entornos

- Usar **pnpm** y las versiones efectivas declaradas en `package.json` (`engines`, `packageManager`) y lockfile. El entorno reportado requiere Node.js `22.23.4`; verificarlo en el repositorio. Preparar una versión compatible mediante NVM cuando sea parte necesaria de una tarea autorizada, sin eludir controles de motores.
- Antes de **cambiar dependencias o ejecutar generadores de paquetes**, consultar `pnpm-supply-chain-security`; revisar scripts, versiones, procedencia, licencias y cambios en lockfile. Preferir versiones exactas cuando la política del repositorio lo exija. No introducir dependencias innecesarias ni omitir auditorías de seguridad pertinentes.
- Para cambios funcionales frontend, comprobar según la superficie `pnpm run typecheck`, `pnpm run build`, `pnpm run test` y, si aplican, `pnpm run test:demo` y `pnpm run validate:demo`. No ejecutar `pnpm install` ni auditorías completas antes de cada edición que no altere dependencias.
- Para backend y persistencia, verificar scripts existentes como `typecheck:api`, `test:db` o `build:api` cuando correspondan. Probar migraciones y accesos con datos desechables; no ejecutar reseteos o migraciones destructivas sobre bases compartidas sin autorización específica.
- Si cambia la UI: revisar Light/Dark, teclado, foco visible, zoom/reflow, responsive, fuentes y contrastes WCAG con pares reales. Si se modifica Storybook, ejecutar su compilación y comprobaciones cuando esté instalado. Informar claramente qué quedó sin ejecutar.
- Para cambios solo documentales, comprobar enlaces, rutas, estructura, diferencias Git y paridad de versiones; no afirmar render ni accesibilidad si no se ejecutaron. Terminar solo los servidores/procesos iniciados por el agente; registrar sus PID cuando sea necesario y liberar los puertos. No finalizar procesos ajenos.

## 8. Seguridad, Git y publicación

- No exponer secretos ni datos reales en logs, commits, fixtures, capturas o artefactos. Conservar avisos de licencia y trazabilidad. No confundir permisos de lectura de UI con autorización efectiva en la API.
- El repositorio puede contener cambios de trabajo no confirmado. Antes de operaciones Git de alto impacto, inspeccionar el estado; **no borrar ni sobrescribir trabajo ajeno**. No utilizar `reset --hard`, `clean`, force push ni procedimientos equivalentes como solución automática.
- **Commits, cherry-picks, merges y pushes están permitidos cuando la tarea actual los autoriza.** Preparar cambios por rutas o grupos lógicos, revisar el diff staged, resolver conflictos y verificar las referencias remotas. No imponer una prohibición permanente de publicación ni exigir aprobación duplicada.
- Antes de despliegues o escrituras en servicios corporativos, comprobar entorno objetivo, credenciales/roles, efecto operativo y autorización específica. No interpretar una prueba local como autorización de producción.

## 9. Comunicación y cierre

Responder en español, con precisión técnica y sin informes ceremoniales. Priorizar **resultado → evidencia → pendientes concretos**. Explicar únicamente decisiones con consecuencias arquitectónicas, funcionales, de seguridad o de compatibilidad. No inventar comprobaciones ni solicitar confirmaciones que el mandato ya haya resuelto.

Este archivo define reglas duraderas del repositorio, no el plan de una iteración específica. Las tareas puntuales y sus criterios de aceptación se detallan en el encargo correspondiente.
