# Inventario y trazabilidad de políticas de negocio PMO

> **Alcance:** diagnóstico, no implementación. No modifica código, migraciones, esquemas ni datos.
> **Fecha:** 2026-11-06. Rectificación: 2026-11-06 (encargo de rectificación). **Baseline:** v2.1.0. **Esquema:** `pmo_cusn`.
> **Esquema activo:** únicamente la migración `011_pmo_cusn_v210.sql` está activa (`DEPLOY.md:56`; `manifest.json:47–53`). `001–010` son historia del manifiesto; una restricción presente solo en `007–010` se clasifica como **histórica/no activa**, salvo equivalente demostrable en `011` u otra capa vigente.
> **Precedencia aplicada:** mandato actual del propietario + reglas v2.1.0 aprobadas > comportamiento comprobable en repo > especificación histórica. Métricas SPI/CPI internas no sustituidas por PMI. Complejidad vigente: **Bajo 1.0–2.5; Medio 2.6–3.7; Alto 3.8–4.4; Estratégico 4.5–5.0**, una decimal; PostgreSQL y TypeScript deben coincidir en las 625 combinaciones válidas.
> **Fuentes:** `[E]` `especificacion_logica_y_politicas_negocio_backend_bun.md` · `[F]` `informe_flujos_funcionales_y_operativos_pmo.md` · `[V]` decisiones v2.1.0 (`AGENTS.md`, `DEPLOY.md`, `app/api/migrations/011`, `app/api/src/**`, `specs/openapi-v210.json`, `specs/migracion-apps-script-a-bun.md`). `007–010` se citan solo como `[H]` (histórico).

## 1. Resumen ejecutivo

Se inventariaron **60 reglas** en 10 dominios + auth condicionante (recuento corregido; el resumen anterior decía 57 por error de suma: 7+5+8+6+6+3+5+4+8+8 = 60).

| Estado funcional | N |
|---|---|
| Aprobada | 52 |
| Propuesta (histórica sin ratificación v2.1.0) | 3 |
| Ambigua (requiere decisión explícita del negocio) | 3 |
| Aplazada (módulo fuera de corte) | 2 |

| Implementación (estado global sin ambigüedad; ver criterio en §7) | N |
|---|---|
| Implementada (invariancia vigente en capa autoritativa + prueba) | 18 |
| Parcial (existe en alguna capa vigente, falta wiring/enforcement o contraparte activa) | 28 |
| Divergente (dos capas vigentes o capa vigente vs política aprobada se contradicen) | 5 |
| Ausente (sin implementación en esquema/servicio activo; puede existir solo como `[H]`) | 9 |

Hallazgo central: **el núcleo gobierno/acceso F1–F7 está operativo en HTTP+SQL** (`business-routes.ts`, `authorization.ts`, `application/projects/*`, DDL `011`, suite `v210-suite.ts` T01–T20). **La lógica de dominio económico/operativa existe como funciones puras TypeScript, pero no está integrada en servicios HTTP**: `DEPLOY.md:7` declara explícitamente que riesgos, compras, complejidad, cierre, Drive, horas y repases **no tienen endpoints; rutas no registradas responden 404**. Por tanto `domain/closure`, `domain/complexity`, `domain/performance`, `domain/procurement`, `domain/health` son **puros no operativos**, y `app/src/data/business.ts` duplica parte de esa lógica solo para presentación. Varias protecciones citadas en la versión anterior (`008` baseline/seguimiento/economía CC, `007` SPI/ahorro/hito-CAMBIO/fechas recepción/sellado, `009` aprobación económica, `010` inmutabilidad de evidencia) son **[H] históricas**: no existen en `011` y figuran como **Ausente/Parcial con invariante a recuperar** donde la política sigue aprobada.

Divergencias de mayor impacto: umbrales y redondeo de complejidad (3.7 vs 3.8; `round` SQL vs `floor` TS); semántica SPI con plan 0 (100/0 vs 0 vs `null`); escala de riesgo 1–5 vs 1–4 y severidad máxima 25 inalcanzable en SQL; máquina de compras sin `Pendiente` y con nombres `BORP/SOLICITADA` inconsistentes; cierre con estados `Cerrado` no admitidos en CHECK y documentos obligatorios solo en una de las dos implementaciones; inyección financiera de CC sin servicio que la ejecute.

## 2. Matriz completa

Convenciones: `E§x.y` = sección de `[E]`; `F x.y` = flujo de `[F]`; `V:` = decisión v2.1.0 vigente. `Destino` = capa donde debe vivir la invariancia autoritativa. Duplicaciones frontend marcadas `DUP` a revisar.

### CICLO — ciclo de vida y seguimiento

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-CICLO-001 | 7 estados canónicos; salud/riesgo/finanzas no son estado | V: `AGENTS.md §4`, `011:294–308` | `Requiere P1P2, En ejecución, En transición, Detenido, Cancelado, Cerrado exitoso, Cerrado con observaciones` | Aprobada | Implementada | `migrations/011_pmo_cusn_v210.sql:294–308` `ck_proyecto_estado`; `models.ts:411`; `domain.ts:1` | BD | `schema-invariants` T06–T07 | `[E] §2.1` lista 6 con `En Planificación`; no usar como referencia. Ver D-01 |
| BR-CICLO-002 | Alta crea proyecto + titular + evento en una TX; TVT único global normalizado | V: `application/projects/create.ts:28–34`; `011:282–283` | `tvt_normalizado = upper(regexp_replace(btrim(tvt),'[ ]+',''))` UNIQUE | Aprobada | Implementada | `application/projects/create.ts`; `011:282` | Aplicación + BD | `access-contracts` T05 concurrente 201/409 | Conforme |
| BR-CICLO-003 | Exactamente un PM titular vigente, interno/activo/PM/miembro | V: `011:1043–1127` | `verificar_pm_titular_proyecto()` + `EXCLUDE gist (proyecto_id, tstzrange)` + `uq_pm_titular_proyecto_actual` | Aprobada | Implementada | `011:1043–1127`; `transfer.ts:20–29`; `substitution.ts:10–16` | BD | `schema-invariants` T06–T07, T19 | Conforme; diferida al COMMIT |
| BR-CICLO-004 | Soft delete `activo=false` excluye de grilla/dashboard/reportes; reactivable solo ADMIN | F 1.4; V parcial | `WHERE activo` en lecturas; `PATCH habilitar` solo Head | Aprobada | Parcial | `repositories/projects.ts:12–13`; `business-routes.ts:133–139`; `contracts.ts:11` (`enable`) | Aplicación | `projects-http` parcial; falta test de exclusión dashboards | Sin endpoint dedicado deshabilitar en corte v2.1.0; no inferir borrado físico |
| BR-CICLO-005 | `evento_proyecto` append-only; cambio de estado + evento en misma TX | V: `011:1031–1039` | trigger `impedir_mutacion_evento_proyecto` UPDATE/DELETE → EXCEPTION | Aprobada | Implementada | `011:1031–1039` | BD | `schema-invariants` T18 | Conforme |
| BR-CICLO-006 | `auditoria_seguridad` append-only con actor real y delegación | V: `011:1148–1156` | trigger `impedir_mutacion_auditoria_seguridad` | Aprobada | Implementada | `011:1148–1156`; `authorization.ts:44–48` | BD | T18 | Conforme |
| BR-CICLO-007 | `En transición` exige entrega + revisión/aceptación cliente antes del cierre | V: `AGENTS.md §4` | Condición de proceso, sin CHECK automático | Aprobada | Ausente | — (solo texto AGENTS) | Aplicación | Faltante | Regla de proceso sin validación; no automatizar por nombre. Ver D-02 |

### CRONO — cronograma, línea base y desviaciones

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-CRONO-010 | Baseline inmutable: `fecha_termino_baseline` no cambia si ya tiene valor | E §2.2; AGENTS §4 | `OLD.fecha_termino_baseline IS NOT NULL AND NEW IS DISTINCT FROM OLD → EXCEPTION` | Aprobada | Ausente | `[H]` `008_business_guards.sql:12–28` `proteger_baseline_y_cierre`; **sin equivalente en `011`** (solo `ck_proyecto_fechas`) | BD | Faltante | Histórica/no activa. Invariante a recuperar vía nueva migración. Ver §7 |
| BR-CRONO-011 | `fecha_termino_actual` es la fecha revisada mutable solo vía solicitud aprobada | E §2.3; V: `011:693–736` | `solicitud_cambio_planificacion.estado APROBADO` + `campo FECHA_TERMINO` | Aprobada | Parcial | `011:693–736` (integridad) | Aplicación | Faltante E2E | DDL garantiza integridad; **falta el servicio que aplica `valor_propuesto → proyecto.fecha_termino_actual`** en TX. Ver D-03 |
| BR-CRONO-012 | Solicitud: CC firmado mismo proyecto, una sola APROBADA por CC, una PENDIENTE por proyecto+campo, separación solicitante≠aprobador, resuelta inmutable | V: `011:725–781` | `validar_control_cambio_para_solicitud()` + `uq_solicitud_cc_aprobado/pendiente/campo_pendiente` + `ck_solicitud_*` + `impedir_mutacion_solicitud_resuelta` | Aprobada | Implementada | `011:725–781` | BD | `governance-http` (pendientes) | Conforme en BD; sin ruta HTTP de negocio en corte (solo gobierno F1–F7) |
| BR-CRONO-013 | Desviación = días calendario `actual − baseline` | E implícito; V: `domain/performance` | `calendarDays(baseline, current)` = `(parse(to)−parse(from))/86400000` | Aprobada | Parcial | `domain/performance/index.ts:19`; `domain/shared/civil-date.ts:11–13` | Dominio | `unit/business.test.ts:35` | Puro sin llamadores en `src` (grep). Destino correcto Dominio; falta wiring a consulta |
| BR-CRONO-014 | Coherencia `fecha_termino_baseline ≥ fecha_inicio` | V: `011:309–311` | `ck_proyecto_fechas` | Aprobada | Implementada | `011:309–311` | BD | `schema-invariants` | Conforme |

### SPI — indicadores SPI/CPI y semáforos

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-SPI-020 | SPI histórico: `real/plan×100`; `0/0→100`; otro `plan=0→0`; admite >100%; `NUMERIC(8,2)` | E §7.1 `[Propuesta histórica]` | Ver fórmula | Propuesta | Parcial | `domain/performance/index.ts:4–13` (puro; `0/0→0.0000`, valida `0–100`, 4 decimales + ratio); **sin columna generada en `011`** (`[H]` `007:49–53` no activo) | Dominio (BD solo caché si se recupera) | `unit/business.test.ts:19–24` cubre TS, no SQL | Semántica `plan=0`, rango >100% y decimales pendientes de D-04; no es divergencia activa SQL. Ver §7 |
| BR-SPI-021 | SPI persistido generado `numeric` | `[H]` `007:49–53` | `CASE WHEN avance_planificado>0 THEN round(avance_real/avance_planificado*100,4) ELSE 0 END STORED` | Propuesta | Ausente | `[H]` `007_business_patch.sql:49–53`; **ausente en `011:502–513`** (`seguimiento_proyecto` sin columna `spi`) | BD | Sin cobertura activa | Histórica/no activa. Si se recupera, la invariancia de negocio va en Dominio y BD solo deriva. Ver §7 |
| BR-SPI-022 | SPI puro valida escala y retorna `percent`+`ratio` 4 decimales | V | `spi(planned,actual)` regex `^\d{1,3}(\.\d{1,2})?$` ≤100 | Aprobada | Parcial | `domain/performance/index.ts:4–13` | Dominio | `unit/business.test.ts:19–24` | Puro sin servicio operativo; validación `≤100` impide >100% que E §7.1 permite. Ver D-04 |
| BR-SPI-023 | CPI: `facturado real acumulado / facturado planificado exigible ×100`; sin hitos vencidos→100; por proyecto+moneda | E §7.2 | `MesHito ≤ MesCorte (YYYY-MM)` | Aprobada | Parcial | `domain/performance/index.ts:14–18` `cpi()` | Dominio | `unit/business.test.ts:25–34` | Puro sin llamadores; `percentOf` retorna `null` si denominador 0 (≠100 de E). Ver D-05 |
| BR-SPI-024 | Semáforo cronograma/costo: VERDE ≥90 (o sin vencidos en CPI), AMARILLO 70–90, ROJO <70 | E §7.3 | `performanceLight(percent)` | Aprobada | Parcial | `domain/health/index.ts:2–7` | Dominio | `unit/business.test.ts:37–40` | Puro sin wiring; coincide con E salvo formato (`SIN_DATOS` para null es extensión v2.1.0, aceptable) |
| BR-SPI-025 | Semáforo riesgo: VERDE sin abiertos o solo S<8; AMARILLO ≥3 abiertos o máx 8–14; ROJO ≥1 con S≥15 | E §7.3 | `riskLight(openSeverities)` | Aprobada | Divergente | `domain/health/index.ts:8–14` (puro, sin servicio) | Dominio | `unit/business.test.ts:40–43` (no cubre 3×`null`) | Defecto/pendiente D-06: `length≥3 → AMARILLO` precede a `some(null)→SIN_DATOS`; `[null,null,null]` da AMARILLO. Ver §7 |
| BR-SPI-026 | Semáforo calidad: VERDE sin alertas; AMARILLO ≥3 CC abiertos; ROJO ≥1 riesgo en Contingencia | E §7.3 | `qualityLight(contingencies, openChanges)` | Aprobada | Parcial | `domain/health/index.ts:15–18` | Dominio | `unit/business.test.ts:44` | Puro sin wiring; `contingencies` debe alimentarse de `riesgo_proyecto.estado=Contingencia` — consulta pendiente |
| BR-SPI-027 | DUP presentación semáforos/cierre en frontend | V | `closureIssues()` + `decimalText/savingsText` | Aprobada | Divergente | `app/src/data/business.ts:1–23` vs `domain/closure`, `domain/procurement`, `domain.ts:9` | Presentación (no autoritativa) | `tests/business.test.ts:1–13` | **Incluir por pedido**: duplicación a corregir. `closureIssues` ignora `requiresDocument` igual que dominio pero con mensajes distintos; `savingsText` reimplementa `subtractMoney` con regex propia `^\d{1,16}` sin negativos. Ver D-07 |

### RIESGO — riesgos y oportunidades

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-RIESGO-030 | Severidad `S = P×I`, 1≤S≤25; Crítico 15–25 rojo, Alto/Medio 8–14 amarillo, Bajo 1–7 verde; mitigación/contingencia y escalamiento por nivel | E §4.1 | `S=P×I` | Aprobada | Parcial | `011:622–633` `severidad GENERATED ALWAYS AS (P*I)`; E §4.1 tabla | BD (derivada) + Dominio (clasificación) | `unit/business.test.ts` no cubre rangos | BD deriva S; clasificación color en `riskLight` (parcial). Planes/escalamiento sin validación |
| BR-RIESGO-031 | Escala P/I discreta 1–5 | E §4.1; F 5.1 | `1..5` | Ambigua | Divergente | `011:629–630` `probabilidad/impacto BETWEEN 1 AND 4`; `011:211–214` igual; UI/F/E 1–5; `domain/health` asume hasta ≥15 | BD | Faltante | DDL v2.1.0 impone 1–4 → S máx 16; rango Crítico 15–25 solo {15,16} alcanzables. Requiere D-08. Ver §7 |
| BR-RIESGO-032 | Estados proyecto: `Pendiente/Contingencia/Controlado/Mitigado`; transversal `Pendiente/Contingencia` nunca bloquea cierre individual | E §4.2; F 5.2 | `riesgo_proyecto.estado CHECK`; filtro `proyecto_id = :id` al cerrar | Aprobada | Parcial | `011:612–613` (CHECK activo); `domain/closure/index.ts:4` (filtro vinculado correcto); `[H]` `007:20–25` (`es_transversal`) y `010:5–40` (guard) **no activos en `011`** (`proyecto_id NOT NULL`) | BD + Dominio | `unit/business.test.ts:46–55`; `tests/business.test.ts:5` | Transversal puro `NULL` sin soporte en `011`. Requiere D-09. Ver §7 |
| BR-RIESGO-033 | Estrategias `Mitigar/Aceptar/Transferir/Evitar/Reducir`; `Transferir` decide cierre con observaciones | E §3.4; V | `estrategia CHECK`; `evaluateClosure: linked.some(estrategia=Transferir)` | Aprobada | Parcial | `011:614–615`; `domain/closure/index.ts:10` | BD + Dominio | `unit/business.test.ts:46–55` | Puro sin servicio; estrategia vigente al cierre (E) no versionada — se evalúa la actual. Aceptable si se documenta |
| BR-RIESGO-034 | Evaluaciones `INICIAL/RESIDUAL/REVISION` con P/I, justificación; `Controlado` pendiente de validación negocio | V: `011:623–633` + comentario `011:1165` | `tipo_evaluacion CHECK`; `COMMENT evaluacion_riesgo` | Ambigua | Implementada | `011:623–633,1165` | BD | `schema-invariants` | CHECK vigente; interpretación de `Controlado` pendiente (D-10). Ver §7 |
| BR-RIESGO-035 | Oportunidades como tipo de riesgo | F/UI histórica | Sin columna `tipo` en v2.1.0 | Aplazada | Ausente | — (`riesgo_proyecto.categoria` libre) | Contrato | Faltante | `tests/data.test.tsx:30` usa `tipo: Amenaza` solo en fixture frontend. No implementar sin decisión |

### FIN — facturación, costos e indicadores financieros

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-FIN-040 | Matriz temporal por proyecto×mes: `showprice/planificado/real_reportado`; `periodo` = día 1; `real` es valor informado, no factura contable | F 6.1; V: `011:538–569` | `ck_facturacion_mes: periodo = date_trunc('month',periodo)` | Aprobada | Implementada | `011:552–569,1162` | BD | `projection` | Conforme |
| BR-FIN-041 | TCV `DEFINIDO` exige valor ≥0 + unidad; `ILIMITADO` exige valor NULL | V: `011:539–550` | `ck_condicion_tcv` | Aprobada | Implementada | `011:546–549` | BD | `schema-invariants` | Resuelve bloqueo histórico `Ilimitado→0/null` del plan de migración |
| BR-FIN-042 | 9 unidades; sin EUR ni FX | V: `011:23–34` | `ck_unidad_monetaria_codigo` | Aprobada | Implementada | `011:23–34` | BD | `schema-invariants` | Conforme; `COMMENT unidad_monetaria: EUR no aprobada`. `margen 0–100` es `[H]` `007:27–33` sin columna en `011:552–569` (ver §7) |
| BR-FIN-043 | Hito `MANUAL` sin CC; hito `CAMBIO` exige `control_cambio_id + tipo_impacto BENEFICIO/COSTO_TIVIT` mismo proyecto; un aporte por CC | E §5.2 | `ck_hito_origen_valido` + `fk_hito_cc_mismo_proyecto` + `uq_hito_aporte_control_cambio` | Aprobada | Ausente | `[H]` `007:27–46` + `008:9–10`; **ausentes en `011:552–569`** (`hito_facturacion` sin `control_cambio_id/tipo_impacto_cc/origen CHECK/único`) | BD | Faltante | Histórica/no activa. Invariantes a recuperar vía nueva migración + servicio que crea el hito al aprobar CC (ver BR-CC-063). Ver §7 |
| BR-FIN-044 | Aislamiento por moneda antes de consolidar; sumas exactas `numeric(20,4)` sin float | E §7.2; V: `domain.ts:9–19` | `sumAmounts()` escala 10000n; `cpi()` filtra por `unit` | Aprobada | Parcial | `domain.ts:9–19`; `domain/shared/money.ts:17–25` | Dominio | `unit/business.test.ts` (money) | Puros sin agregación servida; DUP parcial `business.ts:savingsText` con regex distinta. Ver D-07 |
| BR-FIN-045 | Exportaciones Excel/Word y presentación Slides | F 6.2–6.3 | — | Propuesta | Ausente | — | Aplicación | Faltante | Heredado Apps Script/Docs/Slides; fuera de corte v2.1.0. No implementar |

### COMPLEJ — índice de complejidad

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-COMPLEJ-050 | `IC = R×0.35+F×0.20+P×0.15+A×0.30`; factores enteros 1–5; `numeric(2,1)`; `round(...,1)` en V1 | E §8.1; V: `011:826–828` | `ck_complejidad_v1_formula` | Aprobada | Parcial | `011:806–828` + `domain/complexity/index.ts:6` (coinciden; ver §7) | BD + Dominio (una autoritativa) | `unit/business.test.ts:12–18` | Verificación §7: `floor((S+5)/10)` ≡ `round(x,1)` en las 625 combinaciones; 0 divergencias. Falta wiring + validación `tipificacion↔índice`. Ver D-11 |
| BR-COMPLEJ-051 | Categorías vigentes: **Bajo 1.0–2.5; Medio 2.6–3.7; Alto 3.8–4.4; Estratégico ≥4.5** (una decimal) | U (propietario) + E §8.2 + F 2.4 | TS: `≥45 Estratégico; ≥38 Alto; ≥26 Medio; else Bajo` (décimas) | Aprobada | Parcial | `domain/complexity/index.ts:7` (conforme a U); BD solo `CHECK IN` sin validar `tipificación↔índice` | Dominio | `unit/business.test.ts:13` (3.0→Medio, no cubre bordes) | E/F históricos decían `Medio 2.1–3.2`; rige U. Caso 3.75→38→Alto en ambas capas (ver §7). Pendiente técnico: validación persistente + tests de bordes. Ver D-11 |
| BR-COMPLEJ-052 | Override estratégico fuerza `ESTRATEGICO` + justificación obligatoria + permiso `complejidad.override` | E §8.3; V | `ck_complejidad_override`; `override:{reason,permitted}` | Aprobada | Parcial | `011:829–832`; `domain/complexity/index.ts:5` | BD + Aplicación | `unit/business.test.ts:17` | BD y TS coherentes entre sí; **falta verificación de permiso en servicio** (sin endpoint). Destino: Aplicación exige `hasGrant(complejidad.override)` |

### CC — controles de cambio y gobernanza

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-CC-060 | Folio `{TVT}-CC-{SEQ:003}`, `secuencia>0`, único por proyecto | E §5.1 | `uq_cc_proyecto_folio/secuencia` | Aprobada | Parcial | `011:675–676,1391–1401` | Aplicación (generación) + BD (unicidad) | Faltante | BD garantiza unicidad; **generación correlativa sin servicio** (sin endpoint). Formato `{TVT}-CC-003` no validado por CHECK |
| BR-CC-061 | `costo>0 → moneda obligatoria`; responsabilidad CLIENTE/TIVIT/AMBOS exige responsables correspondientes | E §5.1 | `ck_cc_moneda`; `ck_cc_responsables` | Aprobada | Implementada | `011:678,1236–1244` | BD | `schema-invariants` | Conforme (nombres v2.1.0: `impacto_monetario/unidad_codigo`, `responsabilidad`) |
| BR-CC-062 | Solo `ADMIN/APROBADOR` resuelve; `APROBADA` actualiza `fecha_termino_actual` sin tocar baseline, en TX con actor y fecha resolución | E §2.3 | Estados `PENDIENTE/APROBADO/RECHAZADO` + `ck_solicitud_resolucion/separacion` | Aprobada | Parcial | `011:705–722` | Aplicación | Faltante | BD lista; **falta caso de uso Resolver** (autorización `cambios.aprobar` + update). Ver D-03 |
| BR-CC-063 | Inyección financiera: al aprobar CC con `impacto>0` exigir `periodo_facturacion YYYY-MM` explícito; prohibido inferir del mes de firma; crea hito `CAMBIO` + suma TCV proyectado | E §5.2; F 3.4 | `periodo` + `tipo_impacto_cc` | Aprobada | Ausente | Tabla `[H]` `007:27–46`; **sin servicio y sin columnas en `011`** | Aplicación | Faltante | Ausencia crítica: sin `ck_hito_origen_valido` activo ningún servicio puede crear el hito ni actualizar `condicion_comercial`. Prohibición de inferencia sin enforcement. Requiere D-CC + migración. Ver §7/§8 |
| BR-CC-064 | Economía de CC aprobado inmutable; CC consumido no se modifica/elimina; aprobación económica trazable | V: `011:784–803` (+ `[H]` `008:36–49`, `009`) | `proteger_control_cambio_consumido` (011, estricto) | Aprobada | Parcial | `011:784–803` activo para CC consumido por solicitud APROBADA; `[H]` `008` (economía por `estado_aprobacion`) y `009` (`aprobador_economico_id/fecha`, excepción parcial) **sin equivalente en `011`** | BD | `schema-invariants` | Consumo protegido sí activo; economía independiente y trazabilidad económica requieren migración si se aprueban. Ver §7 |

### COMPRA — compras y adquisiciones

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-COMPRA-070 | Estado determinista por hitos: `CONFORMIDAD→OK; OC→OC Emitida; SOLPED→SOLPED; BORP→Solicitada; none→Pendiente` | E §6.1; F 5.3 | Cadena documental | Aprobada | Divergente | `domain/procurement/index.ts:6` `stage()`; `011:591–598` `etapa_compra` | Dominio | `unit/business.test.ts:60` | TS retorna `SOLICITADA/BORP/SOLPED/OC/OK` (5 valores, `BORP`≠`Solicitada`, sin `Pendiente`); E/F exigen `Pendiente` inicial y `Solicitada` tras BORP. **BD no deriva estado** (comentario `011:600`: orden definido, transiciones saltadas sin bloquear). Ver D-12 |
| BR-COMPRA-071 | `Monto = setup + recurrente×meses`; `Ahorro = presupuesto − adjudicado`; adjudicación 0 válida (ahorro=100% presupuesto); NULL si falta importe | E §6.2 | `ahorro GENERATED ALWAYS AS (presupuesto−monto_adjudicado)` | Aprobada | Parcial | `domain/procurement/index.ts:4–5` vigente; `[H]` `007:3–10` (`presupuesto/ahorro` generado) **sin columnas en `011:572–588`** | Dominio (BD derivada si se recupera) | `unit/business.test.ts:57–59`; `tests/business.test.ts:8–12` DUP | Cálculo puro existe; columna generada histórica. DUP `savingsText` solo formato. Ver §7 |
| BR-COMPRA-072 | Importes ≥0; `meses_recurrentes ≥0`; `tipo CAPEX/OPEX`; unidad de 9 | V: `011:572–588` | CHECKs | Aprobada | Implementada | `011:572–588` | BD | `schema-invariants` | Conforme |
| BR-COMPRA-073 | `leadTime = días(recepción_real − esperada)`; fechas recepción esperada/real | Propuesta (no en E) | `leadTime(from,to)` | Propuesta | Parcial | `domain/procurement/index.ts:8` vigente; columnas `[H]` `007:4–5`, **ausentes en `011:572–588`** | Dominio/Consulta | `unit/business.test.ts:61` | Puro sin llamadores ni columnas activas; sin validación `real ≥ esperada`. Ver §7 |

### CIERRE — cierre, checklist y lecciones

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-CIERRE-080 | Checklist 100%: todo ítem `completado=TRUE` (por fase Inicio/Plan/Ejec/Cierre) o aborta listando faltantes | E §3.1; F 2.2 | `items.length>0 && every(completed)` | Aprobada | Parcial | `domain/closure/index.ts:5`; `app/src/data/business.ts:2–6` DUP | Dominio + Aplicación | `unit/business.test.ts:46–55` (puro); `tests/business.test.ts:4–6` (DUP) | Puro sin servicio; DUP frontend añade regla propia `items.length==0 → 'Define checklist'` y faseo sin validación por fase. `obligatorio` en BD (`item_checklist_proyecto.obligatorio`) ignorado por ambas → ¿100% incluye opcionales? Ver D-13 |
| BR-CIERRE-081 | ≥1 lección con título + contenido sustantivo | E §3.2 | `validLessonCount>0`; BD: `titulo,btrim<>'' AND leccion,btrim<>''` | Aprobada | Parcial | `domain/closure/index.ts:7`; `011:677–691` | Dominio + Aplicación | `unit/business.test.ts:53` | Puro sin servicio; DUP `lessonCount` sin verificar contenido (solo conteo). Ver D-13 |
| BR-CIERRE-082 | Sin riesgos `Pendiente/Contingencia/vacío` vinculados; válidos solo `Controlado/Mitigado/Cerrado` | E §3.3 | `linked.every(![Pendiente,Contingencia].includes)` | Aprobada | Divergente | `domain/closure/index.ts:8`; `011:612–613` | Dominio + Aplicación | `unit/business.test.ts:54` | E admite `Cerrado` pero `CHECK riesgo_proyecto.estado` solo permite 4 valores sin `Cerrado`; TS permite cualquier otro estado (p. ej. `X`) como válido. Ver D-10 |
| BR-CIERRE-083 | Bifurcación: si ∃ riesgo vinculado con `estrategia=Transferir` → `Cerrado con observaciones`, si no → `Cerrado exitoso` (estrategia vigente) | E §3.4 | `linked.some(estrategia=Transferir)` | Aprobada | Parcial | `domain/closure/index.ts:10` | Dominio + Aplicación | `unit/business.test.ts:46–51` | Puro sin servicio; falta versionado de estrategia |
| BR-CIERRE-084 | Post-cierre: riesgos no retirados → custodia operativa; sella fecha/mes de cierre; historial+snapshot | E §3.4; F 4 | Sellado + conversión | Ambigua | Ausente | `domain/projects/state.ts:5–7` `isOperationalRisk()` (predicado de lectura, no mutación); `[H]` `007:12–18` + `008:19–24` (`fecha_cierre_real/periodo_cierre_mes` + inmutabilidad) **sin columnas en `011`** (`011` usa `validacion_cierre` + `evento`) | BD + Aplicación | `unit/business.test.ts:68–72` (predicado) | Histórica/no activa + doble modelo. `control_actual='Riesgo Operacional'` (E) sin columna en `011`. Requiere D-14 + migración. Ver §7 |
| BR-CIERRE-085 | Evidencia de proyecto cerrado inmutable; documento con evidencia vigente no se archiva/elimina | Política aprobada (protección documental) | triggers `impedir_evidencia_de_proyecto_cerrado`, `impedir_archivar_evidencia_de_cierre` | Aprobada | Ausente | `[H]` `010_closed_evidence_guard.sql`; **sin equivalente en `011`** (solo `tr_evento_proyecto_inmutable` y `tr_auditoria_seguridad_inmutable`) | BD | Faltante | Histórica/no activa. Invariante a recuperar vía nueva migración si se ratifica. Ver §7 |
| BR-CIERRE-086 | `validacion_cierre.resultado APTO` exige `validador + 4 oks`; histórico sin evidencia → `SIN_EVIDENCIA_HISTORICA`, nunca APTO | V: `011:939–956` | `ck_cierre_apto` | Aprobada | Implementada | `011:939–956,1167` | BD | `schema-invariants` | Conforme; falta servicio `cierres.validar` + `entregables.validar` (permisos existen, sin endpoint) |
| BR-CIERRE-087 | Ítem que `requiere_documento` exige documento `VIGENTE` vinculado | E implícito | `documentsOk = every(!requiere \|\| hasCurrentDocument)` | Aprobada | Parcial | `domain/closure/index.ts:6` + DUP `app/src/data/business.ts:7–8` vigentes; `[H]` `010:42–60` (anti-archivado) **sin equivalente en `011`** | Dominio + BD (si se recupera) | `unit/business.test.ts:47` | TS y DUP coinciden; BD activa no protege archivado ni exige vínculo al cerrar (sin servicio). Ver D-13 y §7 |

### OPER — operación y reglas temporales

| ID | Regla | Fuente | Fórmula / condición | Estado | Impl. | Ubicación | Destino | Prueba | Observación |
|---|---|---|---|---|---|---|---|---|---|
| BR-OPER-090 | Almacenamiento UTC; reportes `America/Santiago`; fechas civiles `YYYY-MM-DD` validadas sin desplazamiento | E §1.2; V | `civilDate()` + `santiagoDate()`; `config` sin zona; `substitution` exige offset | Aprobada | Implementada | `domain/shared/civil-date.ts`; `011` `date/timestamptz` | Dominio + Contrato | `unit/business.test.ts:63–66` | Conforme; `substitution.ts:21` rechaza fechas ingenuas — correcto |
| BR-OPER-091 | Seguimiento append-only; `avance 0–100`; `fecha_registro` explícita | V: `011:502–513` (+ `[H]` `008:30–34`, `007:49–53`) | trigger `impedir_mutacion_seguimiento`; CHECKs 0–100 | Aprobada | Parcial | CHECKs `011:502–513` activos; trigger `[H]` `008:30–34` y columna SPI `[H]` `007:49–53` **sin equivalente en `011`** | BD | `schema-invariants` (CHECKs) | CHECKs conformes; append-only a recuperar vía migración. Ver §7 |
| BR-OPER-092 | `servicio_operativo` 0–1 por proyecto; `fecha_termino ≥ inicio`; `meses>0` | V: `011:527–536` | `UNIQUE(proyecto_id)` + `ck_servicio_operativo_fechas` | Aprobada | Implementada | `011:527–536` | BD | `schema-invariants` | Conforme; `En transición → operación` sin automatismo (proceso) |
| BR-OPER-093 | Suplencia PM: `[inicio,fin)` UTC, ≤366d, sin solapes, solo PM interno/activo/miembro, permisos delegables, revoca al cambiar titular | V: `011:384–420,1129–1146` + `application/projects/substitution.ts` | `EXCLUDE gist` + `validar_permiso_suplencia` + `assertDesignator` | Aprobada | Implementada | `substitution.ts:7–56`; `011:384–420` | Aplicación + BD | `substitution-http` T12–T14 | Conforme; es la única regla temporal con servicio completo |
| BR-OPER-094 | Versionado optimista + id/tvt inmutables en edición/transferencia; 409 al conflicto | V | `version::text`, `renameProject`, `transferProject` | Aprobada | Implementada | `repositories/projects.ts:15–18`; `edit.ts:22`; `transfer.ts:12,27` | Aplicación | `projects-http` T15; `transfer-http` T11 | Conforme |
| BR-OPER-095 | Contratos frontera: `bigint→string`, `numeric(20,4)→string 4 decimales`, `date YYYY-MM-DD`, `periodo YYYY-MM→día 1`, query solo `after/limit`, body ≤8KB, `Origin` exacto | V: `contracts.ts`, `business-routes.ts:52–98`, `DEPLOY.md:9–11` | Zod estricto + `respond/ApiError` | Aprobada | Implementada | `infrastructure/http/contracts.ts:4–47`; `business-routes.ts:52–98` | Contrato | `access-contracts`, `api:openapi:check` | Conforme; no exponer documentos/metadatos |
| BR-OPER-096 | Auth condiciona dominio: `proyectos.editar/cerrar`, `seguimiento.registrar`, `riesgos.gestionar`, `compras.gestionar`, `cambios.aprobar/solicitar`, `complejidad.evaluar/override`, `documentos.*` (denegado pendiente política) | V: `011:142–180,439–459`, `authorization.ts` | `hasGrant` + `hasPermission(projectId)` + titularidad/suplencia | Aprobada | Parcial | `authorization.ts:16–61` + `business-routes.ts:22–37` grants vigentes; sin endpoints para dominios no operativos | Aplicación | T01–T04, T08–T10 | Núcleo conforme; `documentos.*` denegado por `authorization.ts:22` hasta aprobar clasificación. No reauditar F1–F7. Ver §8 |
| BR-OPER-097 | Horas, especialistas, asignaciones/repases, tarifas, SSO, notificaciones push/correo masivo | E alcance; `011:1180` | Fuera de alcance | Aplazada | Ausente | `011:1180–1181` comentario | — | — | No inventariar como deuda implementable; solo registrar aplazamiento |

Conteos matriz: 60 reglas (CICLO 7, CRONO 5, SPI 8, RIESGO 6, FIN 6, COMPLEJ 3, CC 5, COMPRA 4, CIERRE 8, OPER 8; incluye 3 DUP frontend y 2 aplazadas). Funcional: 52 Aprobada / 3 Propuesta (020, 045, 073) / 3 Ambigua (031, 034, 084) / 2 Aplazada (035, 097). Implementación global: 18 Implementada / 28 Parcial / 5 Divergente (025, 027, 031, 070, 082) / 9 Ausente (007, 010, 021, 043, 045, 084, 085, 035, 097). Criterio global §7: Implementada = invariancia vigente + prueba; Parcial = existe en capa vigente pero falta wiring/contraparte; Divergente = contradicción entre capas vigentes o vigente vs aprobada; Ausente = solo `[H]` o nada en activo.

## 3. Discrepancias ordenadas por impacto

**I-01 Complejidad: CORREGIDA — no hay divergencia de redondeo (BR-COMPLEJ-050/051).**
Verificación §7: `floor((S+5)/10)` ≡ `round(x,1)` en las 625 combinaciones de factores 1–5 (0 divergencias; caso 3.75→38→Alto en ambas). TS `index.ts:7` implementa **Bajo ≤2.5 / Medio 2.6–3.7 / Alto 3.8–4.4 / Estratégico ≥4.5** conforme a U. Pendiente técnico subsistente: BD no valida `tipificacion ↔ índice` y falta wiring + tests de bordes (D-11).

**I-02 SPI plan=0 y rango (BR-SPI-020/022).**
E histórica: `0/0→100`, otro `0`, admite >100%, `NUMERIC(8,2)`. TS vigente: `0/0→0.0000`, valida `0–100` (bloquea >100%), 4 decimales + ratio; sin columna activa (007 histórica). No es divergencia SQL activa; es política pendiente D-04. Impacto: semáforo y curva S en el límite.

**I-03 CPI denominador 0 (BR-SPI-023).**
E: `100 si no hay hitos vencidos`. TS `cpi()`→`percentOf`→`null` si denominador 0 (`money.ts:37–41`); test fija `null`. Impacto: `performanceLight(null)=SIN_DATOS` vs VERDE esperado. Pendiente D-05.

**I-04 Riesgo escala 1–4 vs 1–5 (BR-RIESGO-031).** Divergencia confirmada.
E/F/UI: 1–5, S hasta 25. DDL `011`: `BETWEEN 1 AND 4`, S máx 16; rango Crítico 15–25 solo {15,16}. Impacto: umbral Crítico casi inalcanzable; `riskLight` asume ≥15. Pendiente D-08.

**I-05 Compras sin Pendiente y nombre BORP/Solicitada (BR-COMPRA-070).** Divergencia confirmada.
E/F: `Pendiente→Solicitada→SOLPED→OC→OK`. TS: `SOLICITADA/BORP/SOLPED/OC/OK`, sin `Pendiente`. BD `011:591` admite 4 etapas sin `Pendiente/Solicitada` y deja saltos sin bloquear (`011:600`). Pendiente D-12.

**I-06 Cierre estados y obligatoriedad (BR-CIERRE-080/082/087).** Divergencia confirmada (082).
E exige `Controlado/Mitigado/Cerrado`; CHECK `011:612` solo 4 sin `Cerrado`; TS `closure/index.ts:8` acepta cualquier estado ≠ `Pendiente/Contingencia`. `obligatorio` (`011:924`) ignorado por ambas capas. Pendiente D-10/D-13.

**I-07 Sellado de cierre: HISTÓRICO, no doble modelo activo (BR-CIERRE-084).**
`007` (`fecha_cierre_real/periodo_cierre_mes`) + `008` (inmutabilidad) son `[H]` sin columnas en `011` (que usa `validacion_cierre` + `evento`). `isOperationalRisk()` es predicado, no mutación; `control_actual` (E) sin columna en `011`. Estado: Ausente; invariante a recuperar. Pendiente D-14.

**I-08 `riskLight` con severidades `null` (BR-SPI-025).** Divergencia confirmada (defecto + decisión).
`health/index.ts:8–14`: `length≥3 → AMARILLO` precede a `SIN_DATOS`. `[null,null,null]` → AMARILLO. Test no cubre el caso. Pendiente D-06.

**I-09 CC folio/formato y resolución sin servicio (BR-CC-060/062/063, BR-CRONO-011).**
BD `011` garantiza unicidad folio/secuencia y solicitudes, pero no formato `{TVT}-CC-003`, no aplica `valor_propuesto → fecha_termino_actual`, no crea hito `CAMBIO` (columnas `[H]` ausentes en `011:552–569`). Prohibición de inferir `periodo` sin enforcement. Pendiente D-03/D-CC.

**I-10 Duplicaciones a corregir (BR-SPI-027, BR-FIN-044, BR-CIERRE-080/087).** Divergencia confirmada.
`app/src/data/business.ts` vs `domain/*`: regex sin negativos, formato punto/coma, `lessonCount` sin validar contenido, mensajes propios. Destino: Dominio autoritativo; frontend solo formato.

**I-11 Transversalidad (BR-RIESGO-032).**
`007` (`es_transversal`) y `010` (guard) son `[H]`; `011` exige `proyecto_id NOT NULL`. Transversal puro sin soporte activo. `evaluateClosure` filtra correctamente por proyecto. Pendiente D-09. `isOperationalRisk` no distingue transversal (menor).

**I-12 Semántica `Controlado` (BR-RIESGO-034).**
`COMMENT 011:1165` declara interpretación pendiente. E §3.3 lo lista como válido para cierre sin definir transición. Estado Ambigua; CHECK vigente. Pendiente D-10.

Históricas reclasificadas (no son divergencias activas): BR-CRONO-010, BR-SPI-021, BR-FIN-043, BR-COMPRA-071/073 (parcial BD), BR-CIERRE-085, BR-OPER-091 (trigger), BR-CC-064 (economía `008`/`009`). Detalle §7.

## 4. Mapa arquitectónico recomendado

| Capa | Responsabilidad | Reglas que van aquí | Garantiza la invariancia |
|---|---|---|---|
| **PostgreSQL `pmo_cusn` (solo `011` activo)** | Integridad, unicidad, FK, CHECK, GENERATED, EXCLUDE, triggers append-only/inmutabilidad | BR-CICLO-001/002/003/005/006, BR-CRONO-012/014, BR-RIESGO-030(S)/034, BR-FIN-040/041, BR-COMPLEJ-050(fórmula V1)/052(override), BR-CC-061/064(parcial: consumo), BR-COMPRA-072, BR-CIERRE-086, BR-OPER-092/093(EXCLUDE) | Sí — última defensa concurrente. `[H]` `007–010` no sustituyen a `011`; lo ausente en `011` (§7) requiere nueva migración, no cita histórica |
| **Dominio TS `app/api/src/domain/`** | Fórmulas, clasificación, validaciones puras testeables | BR-CRONO-013, BR-SPI-020/022/023/024/025/026, BR-RIESGO-030(clasificación), BR-FIN-044, BR-COMPLEJ-050/051, BR-COMPRA-070/071/073, BR-CIERRE-080/081/082/083/087, BR-OPER-090 | Sí para cálculo puro; **no** para persistencia. Un solo `complexity()`, un solo `spi()/cpi()`, un solo `evaluateClosure()` |
| **Aplicación `app/api/src/application/`** | TX, autorización por objeto, orden de operaciones, cambios de estado, eventos+auditoría | BR-CICLO-002/004/007, BR-CRONO-011, BR-CC-062/063, BR-CIERRE-080–084/087 (orquestación `validateAndClose`), BR-OPER-093/094/096 | Sí para transiciones. Cada TX: `FOR UPDATE` proyecto → `assertPermission/hasGrant` → mutación → `evento_proyecto` + `auditoria_seguridad` |
| **Repositorios/consultas** | Obtención y agregación; sin reglas de negocio | Alimentar `cpi()` (hitos ≤ corte por proyecto+moneda), `riskLight` (severidades abiertas), `qualityLight` (contingencias + CC abiertos), `evaluateClosure` (ítems+lecciones+riesgos vinculados) | No — solo proyección exacta (`numeric→string`, `date→YYYY-MM-DD`) |
| **Zod/Hono `infrastructure/http/`** | Validación de frontera y contratos OpenAPI | BR-OPER-095; BR-CC-060 (formato folio), BR-COMPLEJ-052 (permiso), BR-CRONO-011 (YYYY-MM) | No — rechaza forma, no sustituye invariancia BD/Aplicación |
| **Frontend `app/src/data/`** | Presentación y formato local | `decimalText`, mensajes `closureIssues` | No — eliminar lógica de decisión; importar tipos, no reimplementar `savings/subtract` |

Regla anti-duplicación: si la invariancia ya está en `GENERATED/CHECK/TRIGGER/EXCLUDE`, el Dominio la **reutiliza para cálculo previo**, no la redefine con semántica distinta. `business.ts` debe adelgazarse a formato; `domain/*` debe tener un único dueño por fórmula.

## 5. Decisiones pendientes (por dominio, no defectos)

**CICLO/CRONO.**
- D-01: ¿`En Planificación` (E) es sinónimo de `Requiere P1P2` (V) o falta un estado? Fijar glosario; no auto-mapear.
- D-02: ¿`Detenido` congela SPI/CPI/curva o solo pausa operación? ¿`En transición` bloquea nuevas solicitudes de cambio?
- D-03: ¿Quién ejecuta `APROBADA → fecha_termino_actual` y con qué permiso (`cambios.aprobar` + titularidad)? ¿Aplica también a `FECHA_INICIO/OPERACION_*` o solo `FECHA_TERMINO`?

**SPI/FIN.**
- D-04: Fijar SPI con `plan=0`: ¿`0/0→100` (E), `→0` (SQL/TS actual) o `→null/SIN_DATOS`? ¿Se admite >100%? ¿2 o 4 decimales autoritativos (`NUMERIC(8,2)` vs `numeric(16,4)` generado)?
- D-05: CPI sin exigible: ¿`100`+VERDE (E) o `null`+SIN_DATOS (TS actual)? Confirmar corte inclusivo `≤YYYY-MM` y agregación por moneda.
- D-06: `riskLight` con `null`: ¿precedencia a `SIN_DATOS` sobre conteo ≥3?

**RIESGO.**
- D-08: ¿Escala 1–4 (DDL vigente) o 1–5 (E/F/UI)? Si 1–4, redefinir rangos Crítico/Alto/Bajo (S máx 16).
- D-09: ¿Existe riesgo transversal puro (`proyecto_id NULL`) en v2.1.0 o todo riesgo cuelga de proyecto? Si existe, migrar `es_transversal` del parche a `011`.
- D-10: Definir transición a `Controlado` y si `Cerrado` es estado válido de `riesgo_proyecto` (hoy CHECK lo rechaza).

**COMPLEJ.**
- D-11: Escala vigente **Bajo 1.0–2.5; Medio 2.6–3.7; Alto 3.8–4.4; Estratégico 4.5–5.0** (fijada por propietario). Redondeo verificado sin divergencia (§7). Pendiente técnico: validación BD `tipificacion ↔ índice` + permiso `complejidad.override` en servicio + tests de bordes 2.55/2.6/3.75/3.8/4.5.

**CC/COMPRA.**
- D-12: Compras: ¿estado inicial `Pendiente`? ¿etiqueta `Solicitada` tras BORP o `BORP`? ¿Bloquear saltos (BORP→OC) o permitir con advertencia (`011:600` hoy los deja pasar)?
- CC: ¿formato folio estricto `{TVT}-CC-003` con CHECK? ¿`periodo_facturacion` obligatorio en contrato al aprobar con impacto>0? ¿Quién suma TCV (`condicion_comercial`) y crea hito `CAMBIO`?

**CIERRE.**
- D-13: ¿100% sobre todos los ítems u obligatorios? ¿Documento exigible solo si `requiere_documento`? ¿Lección válida = `titulo+leccion` no vacíos (BD) o validación sustantiva? ¿Fases deben ir al 100% cada una?
- D-14: ¿Sellado en `proyecto.fecha_cierre_real/periodo` (parche 007) o en `validacion_cierre+evento` (011)? ¿Conversión a `'Riesgo Operacional'` escribe qué columna (`control_actual` de E no existe en 011)?

**OPER/AUTH.**
- D-15: Documentos: mantener denegación `authorization.ts:22` hasta aprobar clasificación; definir qué permiso (`documentos.gestionar/consultar`, `entregables.validar`, `cierres.validar`) ejecuta cada paso del cierre.

## 6. Secuencia sugerida (sin backlog)

1. **CICLO+CRONO:** fijar D-01/D-02/D-03; implementar `Resolver solicitud` + `aplicar fecha_termino_actual` en TX (desbloquea CC y cronograma).
2. **CIERRE:** fijar D-10/D-13/D-14; implementar `validateAndClose` transaccional con las 3 barreras + bifurcación + sellado único + inmutabilidad `010` (ya lista en BD).
3. **RIESGO:** fijar D-08/D-09; alinear escala, CHECK y `riskLight`; exponer `riesgos.gestionar` (desbloquea semáforos y cierre).
4. **SPI/FIN:** fijar D-04/D-05/D-06; unificar `spi/cpi/lights` en Dominio, dejar SQL como caché, agregar agregaciones por proyecto+moneda+corte.
5. **COMPLEJ:** fijar redondeo D-11; exponer `evaluar + override` con permiso; agregar validación BD `tipificacion↔indice`.
6. **CC/COMPRA:** folio estricto + inyección `CAMBIO` con `periodo` explícito (D-12/CC); máquina de compras + `Pendiente` y bloqueo de saltos según decisión.

Sin horas/repases/especialistas (aplazados), sin exportaciones Slides/Docs, sin motores de reglas ni dependencias nuevas.

## 7. Correcciones efectuadas (rectificación 2026-11-06)

Criterio global aplicado: **Implementada** = invariancia vigente en su capa autoritativa (`011` u otra capa vigente) + prueba que la cubre. **Parcial** = existe en capa vigente pero falta wiring, contraparte activa o enforcement completo. **Divergente** = contradicción entre capas vigentes, o entre capa vigente y política aprobada. **Ausente** = sin implementación en activo (solo `[H]` o nada). Una función pura existente (`domain/*`) no cuenta como servicio operativo integrado.

1. **Recuento:** 60 reglas únicas (no 57). Suma por dominios: 7+5+8+6+6+3+5+4+8+8 = 60. Funcional: 52 Aprobada / 3 Propuesta (020, 045, 073) / 3 Ambigua (031, 034, 084) / 2 Aplazada (035, 097). Implementación: 18 / 28 / 5 / 9 (ver conteo en §2).
2. **SQL erróneamente clasificado como activo (pasa a `[H]`/Ausente o Parcial):**
   - BR-CRONO-010: `008` baseline → Ausente (sin equivalente en `011`).
   - BR-SPI-021: `007` SPI generado → Ausente (sin columna en `011:502–513`).
   - BR-FIN-042 (margen): `007` `margen_porcentaje` → sin columna en `011:552–569` (unidades sí activas).
   - BR-FIN-043: `007/008` hito-CAMBIO → Ausente (sin columnas ni CHECKs en `011`).
   - BR-COMPRA-071: `007` `presupuesto/ahorro` → Parcial (TS vigente, columna histórica).
   - BR-COMPRA-073: `007` fechas recepción → Parcial (TS vigente, columnas ausentes).
   - BR-CIERRE-084: `007/008` sellado → Ausente (sin columnas en `011`).
   - BR-CIERRE-085: `010` inmutabilidad evidencia → Ausente (sin triggers en `011`).
   - BR-CIERRE-087: `010` anti-archivado → Parcial (TS vigente, trigger histórico).
   - BR-OPER-091: `008` seguimiento inmutable → Parcial (CHECKs activos, trigger histórico); SPI `007` histórico.
   - BR-CC-064: `008` economía + `009` aprobación económica → Parcial (consumo `011:784–803` activo; resto histórico).
   - BR-RIESGO-032: `010` guard + `007` transversal → Parcial (CHECK + filtro vigentes; transversal/guard históricos).
3. **Complejidad:** eliminada la falsa divergencia de redondeo. Comprobación: `S100 = R*35+F*20+P*15+A*30`; TS `tenths = floor((S100+5)/10)`; SQL `round(S100/100,1)` con `numeric` exacto y valores positivos ⇒ `floor(x*10+0.5)` ≡ `round_half_away(x,1)`; barrido de las 625 combinaciones 1–5: **0 divergencias** (incluye 3.75→38→Alto en ambas). BR-COMPLEJ-050/051 pasan de Divergente a Parcial (falta wiring + validación `tipificacion↔índice`, no cálculo).
4. **Reclasificaciones funcionales:** BR-RIESGO-034 pasa a Ambigua (COMMENT `011:1165` declara Controlado pendiente); BR-SPI-020 queda en Propuesta histórica con semántica pendiente D-04 (no se cuenta como divergencia SQL activa). Las sub-decisiones D-02/D-03/D-05/D-06/D-09/D-10/D-12/D-13/D-14/D-15 permanecen en §5 sin convertirlas en defectos.
5. **Defectos vs pendientes:** BR-SPI-025 y BR-CIERRE-082 se mantienen Divergentes (contradicción vigente comprobada); BR-SPI-027 se mantiene Divergente (duplicación a corregir). El resto de Parcial/Ausente con política aprobada va a §8 clase B; lo que exige D-… va a clase C.
6. **Menores:** escala explicitada Bajo 1.0–2.5; corregida referencia BR-CC-052 → BR-CC-063; `011` verificado por grep (funciones `proteger_/impedir_` presentes: solicitud resuelta, CC consumido, evento, auditoría, rol, CC-solicitud, titular, suplencia; ausentes: baseline, seguimiento, evidencia, economía `008`, aprobación `009`).

## 8. Dependencias de implementación (prerrequisitos)

Orden recomendado por dependencias (no es backlog; no implementar todavía):

1. **Titularidad/autorización primero:** BR-CICLO-002/003 + BR-OPER-093/094/096 sostienen todo lo demás (crear/proyecto, titular único, suplencia, `hasGrant/hasPermission`, versionado, auditoría). Sin esto no hay actor válido para ninguna TX de dominio.
2. **Riesgos antes que cierre y semáforos:** BR-RIESGO-030/031/033/034 (escala D-08, P/I, estrategias, `tipo_evaluacion`) alimentan BR-SPI-025/026 (luces), BR-CIERRE-082/083 (barrera + bifurcación) y BR-CIERRE-086 (`riesgos_ok`). No planificar `validateAndClose` transaccional antes de fijar D-08/D-09/D-10 y fuentes de evidencia (ítems + documentos + lecciones + riesgos vinculados).
3. **Controles de cambio antes que fechas y finanzas:** BR-CRONO-012 + BR-CC-060/061/062/064 (folio, firma, solicitud, consumo) preceden a BR-CRONO-011 (aplicar `valor_propuesto → fecha_termino_actual`) y a BR-CC-063/BR-FIN-043 (hito `CAMBIO` + TCV). Sin columnas/constraints recuperados (§7.2) el servicio no tiene dónde escribir.
4. **Facturación antes que CPI:** BR-FIN-040/041/042 (matriz, TCV, unidades) + hitos `CAMBIO` preceden a BR-SPI-023 (CPI por proyecto+moneda+corte D-05). Sin hitos no hay denominador exigible.
5. **Documentos antes que validación de entregables:** BR-CIERRE-087 + BR-CIERRE-085 (vínculo VIGENTE + inmutabilidad, hoy ausentes) preceden a BR-CIERRE-080/086 (`checklist_ok/documentos_ok/APTO` + permisos `entregables.validar/cierres.validar/documentos.*` hoy denegados D-15).
6. **Complejidad y compras en paralelo al final:** BR-COMPLEJ-050/051/052 (requiere validación `tipificacion↔índice` + permiso override) y BR-COMPRA-070/071/072/073 (requiere D-12 + columnas `presupuesto/ahorro/fechas` si se recuperan) no bloquean cierre/CPI.
7. **SPI/CPI/semáforos al wirear:** BR-SPI-020/022/023/024/025/026 + BR-CRONO-013 + BR-FIN-044 dependen de seguimiento (BR-OPER-091 append-only a recuperar), hitos y riesgos; definir D-04/D-05/D-06 antes de fijar `SIN_DATOS` vs VERDE/100.

---
*Rectificado por inspección estática + grep en `011` y barrido de 625 combinaciones de complejidad. Referencias activas verificadas en archivos citados; `[H]` = histórico `007–010` no activo. Pruebas: `app/api/tests/unit/business.test.ts`, `tests/business.test.ts`, suite `v210-suite.ts` T01–T20. Sin cambios de código, migraciones, datos ni dependencias.*
