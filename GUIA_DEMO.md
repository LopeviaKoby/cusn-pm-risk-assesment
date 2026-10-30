# GPL — Guía de demostración

GPL ayuda al Project Manager a consultar avances, priorizar seguimiento y formalizar riesgos. Esta demostración usa información ficticia y una fecha de corte fija; las propuestas de IA son sugerencias simuladas que requieren decisión humana.

Esta guía cubre solo el artefacto demo. El entorno local conectado descrito en [`specs/migracion-apps-script-a-bun.md`](specs/migracion-apps-script-a-bun.md) se ejecuta aparte con `pnpm run dev:web:api` y no forma parte de este recorrido.

Accede con la cuenta ficticia pública `pm@gpl.example.test` y clave `GPL-local-2026!`. Este acceso es de presentación, no autenticación segura. La aplicación comienza en Light; Dark está disponible durante la sesión.

| Área | Qué puedes consultar y hacer |
|---|---|
| **Workspace** | Alternar Por revisar/En seguimiento, buscar, seleccionar un asunto y consultar su vista previa o propuesta. |
| **Proyectos** | Filtrar por gestor, país, LOB, squad o líder técnico; crear un proyecto. Desde una fila, abrir Resumen, Ejecución y avance o Riesgos del mismo proyecto. |
| **Riesgos** | Consultar amenazas, oportunidades y transversales; filtrar, registrar un riesgo y abrir su detalle con respuesta, revisiones, acciones y evolución. Las sugerencias IA se consultan por separado. |
| **Portafolio** | Comparar avance y seguimiento en Visión general. En Finanzas, contrastar Showpricing original, Planificado PM y Real por mes, proyecto, país y moneda; consultar fuentes y egresos de compras por separado. |

## Recorrido sugerido

1. En **Workspace**, selecciona una propuesta y abre su revisión. Consulta señales, evidencias y atributos propuestos: abrirla no crea un riesgo oficial.
2. En **Proyectos**, filtra por LOB y abre **Implementación Atlas → Resumen**. Revisa identidad, avance, fechas y síntesis económica; pasa a **Ejecución y avance** para consultar curva, hitos e historial.
3. Abre **Riesgos** del proyecto y el detalle de un registro. Contrasta su evaluación, tratamiento y revisiones. Registra un riesgo manual y comprueba que aparece una sola vez; desde Riesgos globales también puedes registrar uno transversal.
4. Vuelve a **Proyectos**, crea un proyecto con los catálogos disponibles y recarga. Conserva sus datos sin inventar historial de avance. Si cancelas un formulario modificado, confirma si deseas descartar los cambios.
5. Abre **Portafolio → Finanzas**, selecciona una moneda y compara gráfico y tabla. Cambia proyecto o periodo y consulta las fuentes. TCV y ACV son referencias comerciales distintas de las tres series de facturación; el real no es pronóstico ni acredita por sí solo una factura emitida. No se mezclan divisas.

Las altas manuales sobreviven a la recarga **solo en el mismo navegador y origen**; no se guardan en Docker ni se comparten entre personas. Las decisiones de sugerencias IA duran la sesión. Las pestañas futuras identificadas como no disponibles no forman parte del recorrido. Las tablas densas permiten desplazamiento horizontal local.
