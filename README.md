# GPL — Gestión de proyectos y riesgos

Frontend local para demostrar el trabajo del Project Manager: seguimiento de proyectos, riesgos oficiales, revisión humana de sugerencias y análisis de portafolio. Usa datos ficticios y no incluye backend, OAuth, integraciones ni IA real. El acceso local no protege información privada.

## Stack y requisitos

- React 19.3.0, TypeScript 7.0.2, Vite 8.3.4, Tailwind CSS 4.3.3, Radix Dialog 1.3.1 y Tabs 1.2.1 y Motion 14.2.0.
- Node.js **22.23.4** y pnpm **12.12.1**, fijados en `package.json`; versiones exactas y dependencias resueltas en `pnpm-lock.yaml`.
- Git; para contenedores, Docker con motor Linux y acceso a Docker Hub, GHCR y al registro oficial npm.

Node 22.23.4 incorpora la corrección oficial de seguridad que sustituye la excepción temporal anterior. La imagen sigue siendo una demostración local.

Para desarrollo, instala esa versión de Node desde su distribución oficial y el binario independiente de [pnpm 12.12.1](https://github.com/pnpm/pnpm/releases/tag/v12.12.1) correspondiente a tu sistema. Verifica su procedencia y añade ambos a `PATH`; no ejecutes instaladores remotos sin revisión. La [guía oficial de pnpm](https://pnpm.io/installation) describe las alternativas. Docker no requiere Node/pnpm en el host.

## Instalación y ejecución local

```sh
git clone --branch dev-tvt-foundry https://github.com/LopeviaKoby/cusn-pm-risk-assesment.git
cd cusn-pm-risk-assesment
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run dev
```

La clonación de `dev-tvt-foundry` estará disponible después de que su propietario publique esa rama. Vite sirve en loopback; abre la URL que imprime y detén el proceso con `Ctrl+C` al terminar.

La política de `pnpm-workspace.yaml` conserva registro HTTPS, antigüedad mínima estricta de siete días, comprobación de confianza, engines/peers estrictos y scripts de dependencias sin autorización general. No cambies el lockfile para sortear errores ni uses `pnpm dlx` o generadores sin revisión. No se necesita ningún archivo `.env`.

## Comprobaciones

```sh
pnpm run validate:demo
pnpm run test:demo
pnpm run test:coverage
pnpm run typecheck
pnpm run build
pnpm audit
pnpm audit signatures
pnpm ls --depth Infinity
pnpm run test:e2e
pnpm run check:react
pnpm run check:distribution
pnpm run preview
```

`validate:demo` comprueba los 23 JSON y siete casos de control. Vitest conserva las seis pruebas anteriores de persistencia, relaciones y finanzas y añade límites, navegación, acceso y componentes. La cobertura mide explícitamente records, finance, access, navigation, primitivas, diálogo y carga de rutas; los umbrales por archivo están en `vitest.config.ts`. No mide toda la aplicación. `typecheck` incluye las pruebas. Los tipos Node 24.10.0 se usan únicamente al compilar herramientas; el runtime permanece en Node 22.23.4.

Playwright usa Page Objects y comprueba acceso, historial, pestañas por teclado, formularios y persistencia. Axe aplica reglas WCAG A/AA; las imágenes comparan cuatro pantallas a 1440 y 390 px con la referencia anterior a la migración. No actualices referencias para ocultar diferencias. En Windows puede usarse Edge instalado con `$env:PLAYWRIGHT_CHANNEL='msedge'`; en otros entornos instala el navegador compatible del runner fijado con `pnpm exec playwright install chromium`. El runner cierra sus navegadores y servidor propio. `PLAYWRIGHT_BASE_URL` permite probar un contenedor local ya iniciado, cuyo ciclo de vida controla quien lo ejecuta. `preview` manual se detiene con Ctrl+C.

La referencia previa presenta un fallo de accesibilidad en Finanzas: elementos small fuera de dt/dd en indicator-cards. La prueba permanece activa y falla hasta corregirlo en un cambio de aplicación autorizado. React Doctor 0.9.18 se ejecuta con ESLint 10.12.0, su peer obligatorio, mediante `check:react`: bloquea errores y conserva advertencias. El análisis es completo en local/push y compara cambios con la rama base en pull requests; falta de base Git produce fallo. Se desactivan telemetría/score remoto y consultas a Socket.dev; pnpm mantiene las auditorías y firmas independientes. La CI conserva el fallo de accesibilidad sin omitirlo.

El propietario autorizó el 22 de octubre de 2026 exclusivamente `trustPolicyExclude: ['semver@6.3.1']`, requerido por Babel dentro de React Doctor. Se verificaron SHA-512, firma npm y ausencia de avisos conocidos; esa versión no aporta atestación de procedencia. Se conservan no-downgrade global, antigüedad, peers/engines estrictos y bloqueo de scripts. Al actualizar Doctor, revisar `pnpm why semver`: retirar la excepción cuando deje de requerirse 6.3.1 y reproducir instalación congelada, auditoría y firmas. No se extiende a otras versiones ni paquetes.

`build` genera pantallas con carga diferida y una recuperación visible si falla su descarga; conserva los proveedores de navegación y sesión. Tailwind escanea únicamente src e index.html, para que los archivos de asistencia no afecten al CSS. No modifica el umbral de tamaño de Vite. Las auditorías requieren red. No se ejecutan actualizadores de instrucciones al iniciar una sesión.

## Docker

El Dockerfile multietapa fija versiones y digests de Node, pnpm y NGINX. El build conserva la política pnpm, ejecuta validación, cobertura, tipos y compilación. La etapa final contiene el frontend compilado y sus avisos de licencia; sirve con NGINX 1.30.6 sobre Alpine 3.24, usuario `101:101` y puerto 8080. Las cabeceras CSP, DENY, nosniff y Referrer-Policy también se aplican al fallback SPA; CSP permite estilos inline requeridos por gráficos y progreso. No ejecuta Vite ni contiene Node/pnpm o el código fuente de la aplicación.

```sh
docker build --pull -t gpl-frontend:local .
docker run --rm -d --name gpl-demo --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --cap-drop ALL --security-opt no-new-privileges=true -p 127.0.0.1:8080:8080 gpl-frontend:local
docker inspect --format '{{.State.Health.Status}}' gpl-demo
```

Abre [GPL local](http://127.0.0.1:8080). La comprobación de salud tarda unos segundos en actualizarse. Las rutas SPA admiten acceso directo y recarga; un asset inexistente responde 404. El contenedor necesita únicamente `/tmp` escribible. Para detenerlo y eliminarlo:

```sh
docker stop gpl-demo
docker ps --filter name=gpl-demo
```

Opcionalmente, con Docker Scout disponible y su sesión iniciada, analiza la imagen sin publicarla:

```sh
docker scout cves local://gpl-frontend:local --only-severity critical,high --exit-code
```

No se requiere ningún volumen ni servicio externo para ejecutar la demo. Reiniciar Docker no crea persistencia compartida ni guarda registros en el contenedor.

## Acceso, rutas y persistencia

Cuenta **ficticia y pública, no segura**: `pm@gpl.example.test` / `GPL-local-2026!`. No la reutilices en otro servicio. La comprobación está en el frontend; un indicador no sensible de sesión ocupa `sessionStorage`, sin contraseñas ni tokens persistidos.

| Ruta | Contenido |
|---|---|
| `/workspace` | Por revisar, seguimiento y vista previa contextual. |
| `/proyectos` | Explorador, filtros y alta manual. |
| `/proyectos/:projectId/resumen` | Identidad, avance, seguimiento y síntesis económica. |
| `/proyectos/:projectId/ejecucion` | Curva de avance, hitos e historial. |
| `/proyectos/:projectId/riesgos` | Registro del proyecto, sugerencias separadas y alta manual. |
| `/proyectos/:projectId/riesgos/:riskId` | Detalle del riesgo del proyecto. |
| `/proyectos/:projectId/sugerencias/:suggestionId` | Revisión humana de una propuesta. |
| `/riesgos` y `/riesgos/:riskId` | Registro global y detalle transversal. |
| `/portafolio` | Visión general. |
| `/portafolio?vista=finanzas` | Comparación financiera por moneda y periodo. |

Sin sesión, las rutas llevan a Login; tras entrar se retoma el destino. Light es inicial y Dark se puede seleccionar durante la sesión. La [guía de demostración](GUIA_DEMO.md) propone un recorrido breve.

Los JSON son semilla determinista de solo lectura, con corte `2026-10-20`. Las altas manuales se superponen mediante la clave `localStorage` **`gpl.demo.records.v1`**. Se leen formatos 1 y 2; el próximo guardado válido escribe versión 2 conservando registros anteriores. Datos inválidos o un fallo de almacenamiento producen error, sin borrar silenciosamente el contenido anterior ni simular un guardado.

Los registros locales pertenecen **solo al mismo navegador y origen** (protocolo, host y puerto). `localhost`, `127.0.0.1`, Vite y Docker pueden tener almacenes distintos. No son almacenamiento seguro ni multiusuario. Para restablecer deliberadamente solo la semilla de GPL, ejecuta en la consola de ese origen y recarga:

```js
localStorage.removeItem("gpl.demo.records.v1");
location.reload();
```

Las decisiones de propuestas IA mantienen su alcance de sesión y se reinician al recargar o salir. Las propuestas siguen separadas de los riesgos oficiales hasta una aprobación explícita. No hay gestión completa del ciclo de vida ni edición de avance, compras, horas o finanzas.

## Lectura de los importes

**TCV** es valor comercial total; **ACV**, el plan comercial anual. Son distintos del presupuesto operativo, que permanece sin dato cuando no hay fuente. La facturación conserva tres referencias independientes: Showpricing original, planificado por PM y real registrado. Cada serie se agrupa por su propia fecha; `null` significa ausencia y `0` un importe registrado.

Finanzas filtra una sola moneda y no aplica conversiones. La diferencia comparable suma real menos plan únicamente en pares proyecto/mes con ambos valores. El real no es pronóstico y solo se presenta como factura emitida cuando existe referencia explícita. Los egresos esperados/reales por compras se muestran aparte: no se restan para inventar margen o presupuesto.

## Distribución y licencias

Todo dato de negocio publicado es ficticio. Las carpetas privadas de requisitos y referencias visuales, archivos de entorno, cachés, salidas de pruebas y herramientas locales se excluyen de Git y del contexto Docker; no deben importarse desde el frontend. Revisa también `dist/` antes de distribuir: los fixtures importados son públicos en el navegador.

El material interno de herramientas de asistencia, sus roles y configuración permanecen locales, fuera del índice y del contexto Docker. Las copias locales se comprueban con `pnpm run check:adoption` y se alinean solo a petición mediante `pnpm run sync:adoption`; estos comandos no descargan versiones. La CI pública no depende de esos archivos privados.

Google Sans y Manrope conservan sus licencias SIL OFL 1.1 y avisos de autoría en `src/assets/fonts/`. El build los publica en `/licenses/google-sans.txt` y `/licenses/manrope.txt`, junto con `/licenses/dependencies.txt` para las dependencias empaquetadas. La autoría de las fuentes se comprobó también en sus metadatos internos.

El propietario confirmó el 21 de octubre de 2026 autorización para redistribuir `tivit-logo-no-bg.png` y `tivit-login-banner.jpeg` en este repositorio público y la imagen Docker. Esa autorización no concede una licencia general sobre las marcas. Se conservan las licencias y avisos presentes en las skills incluidas; no se concede aquí una licencia distinta para materiales de terceros.
