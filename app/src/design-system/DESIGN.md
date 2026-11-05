---
version: alpha
name: PMO TIVIT–Almaviva
description: Guía visual de la plataforma PMO; los valores implementados viven en CSS.
---

# PMO TIVIT — Diseño visual

## Overview

La interfaz es una consola institucional B2B para gestionar portafolio y ciclo de vida de proyectos, con mucha información, lectura cómoda y operaciones eficientes. No es un issue tracker. Linear, Plane y Atlassian inspiran precisión, navegación y claridad, sin copiar sus interfaces. Los rótulos del producto son en español. Esta guía expresa la intención visual; [tokens.css](tokens.css), [fonts.css](fonts.css) y [app.css](app.css) son la fuente implementada y prevalecen si hay divergencia.

El tema inicial es claro; la clase `.dark` ofrece el tema oscuro y `.light` reafirma el claro. El CSS y `app/src/data/access.tsx` determinan el mecanismo vigente, sin presumir persistencia de la preferencia.

## Colors

Rojo TIVIT `#E50022` y azul Almaviva `#044D8C` son anclas de identidad. Las superficies y textos usan roles semánticos por tema; no se sustituye un rol por un ancla similar. Light combina base `#F7F8FA`, superficie `#FFFFFF` y texto `#111827`. Dark distingue base `#141922`, superficie `#1C222D`, elevada `#252E3B` y texto `#F3F5F9`. Éxito, advertencia, peligro e información del sistema son independientes de riesgo, salud y estado del proyecto.

Las cuatro bandas de riesgo, de menor a mayor, son **bajo, medio, alto y crítico**. Sus colores y pares de texto se indican por tema en el bloque inspeccionable; la semántica de bandas de presentación se consulta en `app/src/data/presentation.ts`. El ciclo de vida tiene siete estados distintos: **Requiere P1P2** (`p1p2-required`), **En ejecución** (`in-progress`), **En transición** (`in-handover`), **Detenido** (`on-hold`), **Cancelado** (`cancelled`), **Cerrado exitoso** (`closed-successfully`) y **Cerrado con observaciones** (`closed-with-observations`). Su color no indica por sí solo salud, riesgo ni resultado financiero. En particular, Detenido no equivale a blocked y En ejecución no significa on-track.

Las cinco series de gráficos `chart-1` a `chart-5` tienen valores separados para Light/Dark; las comparaciones de plan/real usan los alias `--chart-planned`/`--chart-real` cuando ese contrato está presente. Etiquetas, leyendas y tablas alternativas conservan significado sin depender solo del color. Los pares de foreground declarados para riesgo son los únicos pares de contraste aquí registrados; ninguna combinación arbitraria de muestras queda certificada por su presencia en YAML. `tokens.css` documenta la comprobación de esos pares: Light bajo 8.59:1, medio 8.26:1, alto 5.57:1, crítico 5.64:1; Dark indica al menos 7.9:1 para los cuatro con `#141922`. Revalidar en el componente y estado real según [WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) y [contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

```yaml
colors:
  brandRed: "#E50022"
  brandBlue: "#044D8C"
  background-light: "#F7F8FA"
  background-dark: "#141922"
  surface-light: "#FFFFFF"
  surface-dark: "#1C222D"
  elevated-light: "#FFFFFF"
  elevated-dark: "#252E3B"
  text-light: "#111827"
  text-dark: "#F3F5F9"
  textSecondary-light: "#667085"
  textSecondary-dark: "#B4C0CF"
  border-light: "#E5E7EB"
  border-dark: "#354153"
  focus-light: "#044D8C"
  focus-dark: "#82C1FF"
  link-light: "#044D8C"
  link-dark: "#82C1FF"
  risk-low-light: "#044D8C"
  risk-low-dark: "#82C1FF"
  risk-medium-light: "#F59E0B"
  risk-medium-dark: "#F1B552"
  risk-high-light: "#D97706"
  risk-high-dark: "#F3A765"
  risk-critical-light: "#C4283E"
  risk-critical-dark: "#FF8C9A"
  risk-low-text-light: "#FFFFFF"
  risk-low-text-dark: "#141922"
  risk-medium-text-light: "#111827"
  risk-medium-text-dark: "#141922"
  risk-high-text-light: "#111827"
  risk-high-text-dark: "#141922"
  risk-critical-text-light: "#FFFFFF"
  risk-critical-text-dark: "#141922"
  status-p1p2-required-light: "#7C3AED"
  status-p1p2-required-dark: "#C4A5FF"
  status-in-progress-light: "#0550AE"
  status-in-progress-dark: "#7FB6F0"
  status-in-handover-light: "#044D8C"
  status-in-handover-dark: "#82C1FF"
  status-on-hold-light: "#9A4B00"
  status-on-hold-dark: "#F3A765"
  status-cancelled-light: "#AE0019"
  status-cancelled-dark: "#FF8C9A"
  status-closed-successfully-light: "#096343"
  status-closed-successfully-dark: "#44C48C"
  status-closed-with-observations-light: "#946000"
  status-closed-with-observations-dark: "#F1B552"
  chart-1-light: "#044D8C"
  chart-1-dark: "#82C1FF"
  chart-2-light: "#E50022"
  chart-2-dark: "#FF7586"
  chart-3-light: "#096343"
  chart-3-dark: "#44C48C"
  chart-4-light: "#F59E0B"
  chart-4-dark: "#F1B552"
  chart-5-light: "#7C3AED"
  chart-5-dark: "#BEA0FF"
```

## Typography

Las 14 funciones siguientes reflejan exactamente tamaño, peso, interlineado y tracking de `fonts.css`. Google Sans sirve a cabeceras, subtítulo y métrica; Manrope a cuerpo y controles. Los archivos variables locales conservan sus licencias OFL; fallback `"Segoe UI", sans-serif`, `font-display: swap` y `font-synthesis: none` en `app.css`. Usar números tabulares para métricas, fechas, porcentajes y columnas alineadas. Texto pequeño y metadatos deben seguir legibles y no reemplazar un arreglo de layout.

```yaml
typography:
  h1:
    fontFamily: "Google Sans"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: "-0.030em"
  h2:
    fontFamily: "Google Sans"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: "-0.020em"
  h3:
    fontFamily: "Google Sans"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: "-0.015em"
  h4:
    fontFamily: "Google Sans"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: "-0.010em"
  subtitle:
    fontFamily: "Google Sans"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 26px
    letterSpacing: "-0.005em"
  body-lg:
    fontFamily: "Manrope"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: "0em"
  body:
    fontFamily: "Manrope"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: "0em"
  body-sm:
    fontFamily: "Manrope"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: "+0.005em"
  caption:
    fontFamily: "Manrope"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: "+0.010em"
  action:
    fontFamily: "Manrope"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: "0em"
  entry:
    fontFamily: "Manrope"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: "0em"
  label:
    fontFamily: "Manrope"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 18px
    letterSpacing: "0em"
  status:
    fontFamily: "Manrope"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: "+0.010em"
  metric:
    fontFamily: "Google Sans"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: "-0.010em"
```

## Layout

Escala espacial de 4/8 px con pasos intermedios definidos en `tokens.css`. Los tokens `--bp-mobile` 640px, `--bp-tablet` 1024px, `--bp-laptop` 1280px, `--bp-desktop` 1440px y `--bp-wide` 1920px son referencias documentales del CSS, no condiciones que `var()` pueda usar dentro de una media query. `app.css` implementa media queries concretas, entre otras a 1500, 1150, 1100, 900, 800, 700, 600 y 500 px. No hay que presentar esos cortes como container queries: `--grid-container-compact` y `--grid-container-medium` son también referencias, no reglas `@container` activas.

La shell, navegación, portfolio, workspace y rejillas de indicadores responden al ancho disponible. Las tablas densas conservan scroll horizontal local cuando hace falta; los números comparables se alinean. Mantener jerarquía, filtros y acciones visibles sin comprimir texto crítico ni convertir la densidad en ruido.

```yaml
spacing:
  zero: 0px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  mdPlus: 20px
  lg: 24px
  xl: 32px
  xlPlus: 40px
  xxl: 48px
  xxxl: 64px
```

## Elevation & Depth

La profundidad nace del contraste entre base, superficie y capa elevada, más bordes y divisores finos. En Light, base `#F7F8FA` y superficie/elevada `#FFFFFF` necesitan bordes `#E5E7EB` para delimitar paneles. En Dark, base `#141922`, superficie `#1C222D` y elevada `#252E3B` separan planos tonalmente. `app.css` reserva `--gpl-shadow-overlay` para el diálogo: `0 8px 24px rgba(0, 12, 23, 0.10)` en Light y `0 8px 24px rgba(0, 12, 23, 0.38)` en Dark. No multiplicar sombras en tablas o tarjetas.

## Shapes

Geometría limpia y constante: radios `--radius-sm/md/lg/xl` de 8/12/16/20 px; el alias `--gpl-radius-full` usa 9999px para píldoras y formas redondas. Bordes de controles, paneles y diálogos siguen sus clases implementadas.

```yaml
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
```

## Components

Describir y reutilizar patrones presentes: `atoms/primitives.tsx` aporta Button, Badge, encabezados y métricas; `molecules/` combina indicadores, series de gráficos y carga de ruta; `organisms/` reúne herramientas de tabla, analítica y diálogo de registro. `components.json` configura estilo `radix-vega` y alias de UI a `atoms`. El diálogo de registro usa Radix Dialog; el proyecto incluye Radix Tabs donde se encuentre en código. Los controles mantienen etiquetas, estados, foco visible, teclado y tema. Formularios usan campos identificables y confirmación de descarte; tablas muestran encabezados, ordenación y acciones con señales adicionales al color; chips y bandas conservan texto legible. La organización y los límites de imports se especifican en [AGENTS.md](../../AGENTS.md). No asumir variantes o componentes no implementados.

```yaml
components:
  primary-button-light:
    backgroundColor: "{colors.brandRed}"
    textColor: "{colors.surface-light}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
  primary-button-dark:
    backgroundColor: "{colors.brandRed}"
    textColor: "{colors.surface-light}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
  risk-high-light:
    backgroundColor: "{colors.risk-high-light}"
    textColor: "{colors.risk-high-text-light}"
    typography: "{typography.status}"
  risk-high-dark:
    backgroundColor: "{colors.risk-high-dark}"
    textColor: "{colors.risk-high-text-dark}"
    typography: "{typography.status}"
```

## Do's and Don'ts

- Usar roles de `tokens.css` antes que literales nuevos; contrastar Light y Dark con el par concreto.
- Mostrar estado del proyecto, salud, riesgo y progreso como dimensiones distintas; escribir la etiqueta junto al color.
- Mantener foco visible, navegación por teclado, responsive, números comparables y una densidad que permita leer.
- Usar bordes y tonos para jerarquía; reservar sombras para capas que realmente se superponen.
- Evitar adornos, sombras y gradientes que compitan con datos, y texto diminuto como solución de espacio.

Formato: [Google Labs DESIGN.md spec](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) y [README](https://github.com/google-labs-code/design.md/blob/main/README.md). El lint de Google verifica estructura, referencias y contraste; no genera ni sustituye los tres CSS locales.
