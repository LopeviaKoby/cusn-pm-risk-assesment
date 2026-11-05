-- PMO y Gestion de Riesgos - esquema relacional inicial
-- Destino: PostgreSQL 18.x (DDL compatible con PostgreSQL 18.6).
-- Origen: 20 CSV de PMO Maestro DB y reglas de negocio confirmadas.
-- Alcance: definicion de estructura; NO carga ni transforma los datos historicos.
-- Las correspondencias historicas ambiguas requieren conciliacion previa a migrar.
-- Las columnas *_origen conservan identificadores de archivos, no sustituyen las FK.
-- No se modelan salarios, contratos, tarifas ni bloqueo de horas extra.
-- Las vistas de Snapshot/Dash_Fact se derivaran de tablas operativas y no se duplican aqui.


CREATE SCHEMA IF NOT EXISTS pmo;
SET search_path TO pmo, public;

-- 01_Catalogos: catalogo flexible. Los valores existentes requieren depuracion.
CREATE TABLE catalogo_valor (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo             text NOT NULL CHECK (btrim(tipo) <> ''),
    valor            text NOT NULL CHECK (btrim(valor) <> ''),
    padre_valor      text,
    orden            integer,
    activo           boolean NOT NULL DEFAULT true,
    CONSTRAINT uq_catalogo_tipo_valor UNIQUE (tipo, valor)
);

-- Incluye UF como unidad indexada. PAB no es sinonimo de 'PAB(USD)'.
CREATE TABLE unidad_monetaria (
    codigo           varchar(3) PRIMARY KEY,
    clase            text NOT NULL CHECK (clase IN ('MONEDA', 'UNIDAD_INDEXADA')),
    CONSTRAINT ck_unidad_monetaria_codigo
        CHECK (codigo IN ('USD','PEN','CLP','COP','ARS','BRL','PAB','MXN','UF'))
);

-- Dimensiones de negocio derivadas de atributos repetidos de los CSV.
-- Sus nombres NO se declaran unicos: primero hay que reconciliar variantes.
CREATE TABLE cliente (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           text NOT NULL CHECK (btrim(nombre) <> ''),
    sector_industria text,
    descripcion      text
);

CREATE TABLE proveedor (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           text NOT NULL CHECK (btrim(nombre) <> '')
);

-- 02_Proyectos: TVT es la clave de negocio; TVT_KEY es una clave de origen alternativa.
CREATE TABLE proyecto (
    id                         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tvt                        text NOT NULL UNIQUE CHECK (btrim(tvt) <> ''),
    tvt_key_origen             text UNIQUE,
    nombre                     text NOT NULL CHECK (btrim(nombre) <> ''),
    cliente_id                 bigint REFERENCES cliente(id),
    estado_cliente             text,
    pais                       text,
    lob                        text,
    servicio_lob               text,
    squad                      text,
    gestor_nombre              text,
    preventa                   text,
    tam                        text,
    sdm                        text,
    account_manager            text,
    sap                        text,
    ceco                       text,
    pep                        text,
    tcv                        numeric(20,4),
    tcv_unidad_codigo          varchar(3) REFERENCES unidad_monetaria(codigo),
    fecha_recepcion_p1p2       date,
    fecha_termino_baseline     date,
    contraparte_cliente        text,
    correo_cliente             text,
    telefono_cliente           text,
    situacion_inicial          text,
    lideres_tecnicos           text,
    activo                     boolean NOT NULL DEFAULT true,
    ultimo_recordatorio_at     timestamptz,
    creado_at                  timestamptz,
    actualizado_at             timestamptz,
    creado_por                 text,
    actualizado_por            text
);

-- 15_Especialistas: el email corporativo es potencial identificador futuro.
-- Es opcional por falta de datos fiables en el Excel; no implica usuario autenticado.
CREATE TABLE especialista (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           text NOT NULL CHECK (btrim(nombre) <> ''),
    email_corporativo text CHECK (
        email_corporativo IS NULL OR
        email_corporativo ~* '^[^[:space:]@]+@tivit[.]com$'
    ),
    cargo            text,
    lob              text,
    pais             text
);

CREATE UNIQUE INDEX uq_especialista_email_ci
    ON especialista (lower(email_corporativo))
    WHERE email_corporativo IS NOT NULL;

-- 03_Estado_Current: catalogo especifico de estados, sin precargar valores historicos.
CREATE TABLE estado_proyecto (
    id                       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                   text NOT NULL UNIQUE CHECK (btrim(nombre) <> ''),
    es_cierre                boolean NOT NULL DEFAULT false,
    requiere_documentacion   boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_estado_doc_cierre
        CHECK (NOT requiere_documentacion OR es_cierre)
);

CREATE TABLE proyecto_estado_actual (
    proyecto_id               bigint PRIMARY KEY REFERENCES proyecto(id),
    estado_proyecto_id        bigint NOT NULL REFERENCES estado_proyecto(id),
    fecha_registro_avance     date,
    avance_planificado_pct    numeric(10,4),
    avance_real_pct           numeric(10,4),
    spi_pct                   numeric(10,4),
    fecha_inicio_proyecto     date,
    fecha_termino_proyecto    date,
    plazo_meses               numeric(12,2),
    operacion_no_aplica       boolean,
    meses_servicio            numeric(12,2),
    fecha_inicio_operacion    date,
    fecha_termino_operacion   date,
    margen_pct                numeric(10,4),
    estado_facturacion        text,
    facturacion_unidad_codigo varchar(3) REFERENCES unidad_monetaria(codigo),
    actividades               text,
    proximos_pasos            text,
    lecciones_resumen         text,
    checklist_entregables     jsonb,
    terminado_fecha           date,
    terminado_mes             date,
    termino_real_base         date,
    actualizado_at            timestamptz,
    actualizado_por           text
);

-- Documentos referenciados por URL: no se almacenan archivos binarios en PostgreSQL.
-- La verificacion obligatoria del cierre es regla de aplicacion/proceso; no hay
-- aun lista de documentos requeridos para implementarla como restriccion SQL.
CREATE TABLE documento_proyecto (
    id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id            bigint NOT NULL REFERENCES proyecto(id),
    tipo_documento         text NOT NULL,
    url                    text NOT NULL CHECK (btrim(url) <> ''),
    relacionado_con_cierre boolean NOT NULL DEFAULT false,
    validado               boolean,
    validado_at            timestamptz,
    validado_por           text,
    registrado_at          timestamptz NOT NULL DEFAULT now()
);

-- 04_Estado_Log: eventos historicos de tipos STATUS/INFO/FACT/etc.
-- proyecto_id admite NULL para no inventar proyecto al reconciliar registros huerfanos.
CREATE TABLE proyecto_evento (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id         bigint REFERENCES proyecto(id),
    tvt_key_origen      text,
    tvt_origen          text,
    registrado_at       timestamptz NOT NULL,
    tipo_evento         text NOT NULL,
    contenido           jsonb NOT NULL,
    usuario_email       text
);

-- 18_Complejidad: una evaluacion actual por proyecto.
CREATE TABLE proyecto_complejidad (
    proyecto_id         bigint PRIMARY KEY REFERENCES proyecto(id),
    factor_riesgo       text,
    factor_facturacion  text,
    factor_plazo        text,
    factor_alcance      text,
    nota_riesgo         text,
    nota_facturacion    text,
    nota_plazo          text,
    nota_alcance        text,
    indice_complejidad  numeric(10,4),
    tipificacion        text,
    override_estrategico boolean,
    nota_override       text,
    actualizado_at      timestamptz,
    actualizado_por     text
);

-- 06_Riesgos: separacion conceptual confirmada entre riesgo global y aplicacion
-- al proyecto. El vinculo hacia un riesgo global es opcional e historicamente no
-- demostrable solo por coincidencias del nombre del riesgo.
CREATE TABLE riesgo_global (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    risk_id_origen       text UNIQUE,
    nombre               text NOT NULL,
    causa_potencial      text,
    control_actual       text,
    estado               text,
    categoria            text,
    probabilidad         smallint,
    impacto              smallint,
    severidad            numeric(12,4),
    estrategia           text,
    plan_mitigacion      text,
    plan_contingencia    text,
    responsable_nombre   text,
    creado_at            timestamptz,
    actualizado_at       timestamptz,
    creado_por           text,
    actualizado_por      text
);

CREATE TABLE riesgo_proyecto (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    risk_id_origen       text UNIQUE,
    proyecto_id          bigint NOT NULL REFERENCES proyecto(id),
    riesgo_global_id     bigint REFERENCES riesgo_global(id),
    transversal          boolean NOT NULL DEFAULT false,
    nombre               text NOT NULL,
    causa_potencial      text,
    control_actual       text,
    estado               text,
    categoria            text,
    probabilidad         smallint,
    impacto              smallint,
    severidad            numeric(12,4),
    estrategia           text,
    plan_mitigacion      text,
    plan_contingencia    text,
    responsable_nombre   text,
    creado_at            timestamptz,
    actualizado_at       timestamptz,
    creado_por           text,
    actualizado_por      text
);

-- 07_Cambios: solicitud formal de cambio de proyecto.
CREATE TABLE solicitud_cambio (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen             text UNIQUE,
    proyecto_id           bigint NOT NULL REFERENCES proyecto(id),
    folio                 text UNIQUE,
    secuencia             integer,
    fecha_elaboracion     date,
    descripcion           text,
    justificacion         text,
    firmado               text,
    urgencia              text,
    responsable_cambio    text,
    responsable_cliente_nombre text,
    responsable_cliente_correo text,
    responsable_tivit_nombre text,
    responsable_cuenta    text,
    costo                 numeric(20,4),
    costo_unidad_codigo   varchar(3) REFERENCES unidad_monetaria(codigo),
    costo_tipo            text,
    costo_fecha_facturacion date,
    documento_url         text,
    documento_id_origen   text,
    documento_creado_at   timestamptz,
    aprobacion            text,
    creado_at             timestamptz,
    actualizado_at        timestamptz,
    creado_por            text,
    actualizado_por       text,
    -- Permite una FK compuesta desde cambios de planificacion para evitar
    -- referencias cruzadas entre proyectos distintos.
    CONSTRAINT uq_cambio_id_proyecto UNIQUE (id, proyecto_id)
);

-- Ambito1..Ambito4: atributos multivaluados representados como elementos.
CREATE TABLE solicitud_cambio_ambito (
    solicitud_cambio_id bigint NOT NULL REFERENCES solicitud_cambio(id),
    posicion            smallint NOT NULL CHECK (posicion BETWEEN 1 AND 4),
    ambito              text NOT NULL CHECK (btrim(ambito) <> ''),
    PRIMARY KEY (solicitud_cambio_id, posicion)
);

-- 19_Cambios_Planificacion: vinculo a solicitud de cambio NO obligatorio:
-- 18/26 referencias de origen no pudieron emparejarse en los datos analizados.
CREATE TABLE cambio_planificacion (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen             text UNIQUE,
    proyecto_id           bigint NOT NULL REFERENCES proyecto(id),
    solicitud_cambio_id   bigint,
    cambio_ref_origen     text,
    cambio_folio_origen   text,
    cambio_documento_url  text,
    campo                 text NOT NULL,
    valor_anterior        text,
    valor_propuesto       text,
    solicitante           text,
    estado                text,
    motivo                text,
    comentario            text,
    creado_at             timestamptz,
    resuelto_at           timestamptz,
    resuelto_por          text,
    CONSTRAINT fk_cambio_planificacion_proyecto
        FOREIGN KEY (solicitud_cambio_id, proyecto_id)
        REFERENCES solicitud_cambio(id, proyecto_id)
);

-- 05_Facturacion: NO se declara unicidad por proyecto/mes/tipo/cuota;
-- se observaron varias lineas con combinaciones repetidas.
CREATE TABLE facturacion (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen               text UNIQUE,
    proyecto_id             bigint NOT NULL REFERENCES proyecto(id),
    periodo_mes             date NOT NULL CHECK (EXTRACT(DAY FROM periodo_mes) = 1),
    tipo                    text,
    cuota                   text,
    unidad_codigo           varchar(3) REFERENCES unidad_monetaria(codigo),
    showprice               numeric(20,4),
    importe_planificado     numeric(20,4),
    importe_real            numeric(20,4),
    margen                  numeric(12,4),
    estado                  text,
    origen                  text,
    origen_ref              text,
    comentario              text,
    actualizado_at          timestamptz,
    actualizado_por         text
);

-- 13_Compras: compras de proyecto con proveedor independiente.
CREATE TABLE compra (
    id                       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen                text UNIQUE,
    proyecto_id              bigint NOT NULL REFERENCES proyecto(id),
    proveedor_id             bigint REFERENCES proveedor(id),
    proveedor_nombre_origen  text,
    fecha_compra             date,
    gestor_compra            text,
    clasificacion_capex_opex text,
    estado_compra            text,
    concepto                 text,
    estatus_solped           text,
    estatus_oc               text,
    aprobador_pendiente      text,
    aprobador_final          text,
    borp                     text,
    solped                   text,
    orden_compra             text,
    conformidad              text,
    descripcion              text,
    observaciones            text,
    fecha_borp               timestamptz,
    fecha_solped             timestamptz,
    fecha_orden_compra       timestamptz,
    fecha_conformidad        timestamptz,
    unidad_codigo            varchar(3) REFERENCES unidad_monetaria(codigo),
    valor_setup              numeric(20,4),
    valor_recurrente         numeric(20,4),
    meses_recurrente         integer,
    total                    numeric(20,4),
    presupuesto              numeric(20,4),
    monto_adjudicado         numeric(20,4),
    ahorro                   numeric(20,4),
    recepcion_esperada       date,
    recepcion_real           date,
    creado_at                timestamptz,
    actualizado_at           timestamptz,
    creado_por               text,
    actualizado_por          text,
    CONSTRAINT ck_meses_recurrente CHECK (
        meses_recurrente IS NULL OR meses_recurrente >= 0
    )
);

-- 08_Repases_Asignaciones: NO imponer unicidad por proyecto, mes, area
-- hasta validar si pueden existir asignaciones/ampliaciones independientes.
CREATE TABLE repase_asignacion (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key_origen         text UNIQUE,
    proyecto_id        bigint NOT NULL REFERENCES proyecto(id),
    periodo_mes        date NOT NULL CHECK (EXTRACT(DAY FROM periodo_mes) = 1),
    area               text NOT NULL,
    horas_asignadas    numeric(12,2) NOT NULL CHECK (horas_asignadas >= 0),
    descripcion        text,
    observacion        text,
    creado_at          timestamptz,
    actualizado_at     timestamptz,
    creado_por         text,
    actualizado_por    text,
    CONSTRAINT uq_repase_asignacion_id_proyecto UNIQUE (id, proyecto_id)
);

-- 09_Repases_Uso: asignacion opcional hasta conciliar/completar el enlace.
-- FK compuesta garantiza que, si hay asignacion, sea del mismo proyecto.
-- Se excluye ValorHora: vacio en origen y tarifas fuera de alcance.
CREATE TABLE repase_consumo (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen          text UNIQUE,
    proyecto_id        bigint NOT NULL REFERENCES proyecto(id),
    asignacion_id      bigint,
    periodo_mes        date NOT NULL CHECK (EXTRACT(DAY FROM periodo_mes) = 1),
    fecha              date,
    area               text NOT NULL,
    recurso_nombre     text,
    horas_usadas       numeric(12,2) NOT NULL CHECK (horas_usadas >= 0),
    observacion        text,
    creado_at          timestamptz,
    actualizado_at     timestamptz,
    creado_por         text,
    actualizado_por    text,
    CONSTRAINT fk_consumo_asignacion_mismo_proyecto
        FOREIGN KEY (asignacion_id, proyecto_id)
        REFERENCES repase_asignacion(id, proyecto_id)
);

-- 16_HH_Registros: empleado puede trabajar en varios proyectos, sin cap mensual
-- de 180 horas ni costos salariales dentro de esta base.
-- Email observado en el formulario NO se presupone correo del especialista.
CREATE TABLE registro_horas (
    id                       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen                text UNIQUE,
    proyecto_id              bigint NOT NULL REFERENCES proyecto(id),
    especialista_id          bigint REFERENCES especialista(id),
    especialista_nombre_origen text,
    especialista_lob_origen  text,
    especialista_pais_origen text,
    fecha                    date NOT NULL,
    horas                    numeric(12,2) NOT NULL CHECK (horas > 0),
    tipo                     text,
    modalidad_repase         text,
    comentario               text,
    email_formulario_origen  text,
    registrado_at            timestamptz,
    CONSTRAINT ck_hora_identidad_origen CHECK (
        especialista_id IS NOT NULL OR
        NULLIF(btrim(especialista_nombre_origen), '') IS NOT NULL
    )
);

-- 17_Compromisos: no se ha observado clave fiable hacia un proyecto.
CREATE TABLE compromiso (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen         text UNIQUE,
    titulo            text,
    descripcion       text,
    responsable       text,
    pais              text,
    completado        boolean,
    creado_at         timestamptz,
    actualizado_at    timestamptz,
    creado_por        text,
    actualizado_por   text
);

-- 20_Lecciones: entidad respaldada por la estructura, sin registros historicos.
CREATE TABLE leccion_aprendida (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_origen             text UNIQUE,
    proyecto_id           bigint NOT NULL REFERENCES proyecto(id),
    area                  text,
    fecha                 date,
    titulo                text NOT NULL,
    situacion             text,
    impacto               text,
    acciones_correctivas  text,
    leccion               text,
    correo_texto          text,
    creado_at             timestamptz,
    actualizado_at        timestamptz,
    creado_por            text,
    actualizado_por       text
);

-- 12_Refresh_Log: bitacora tecnica aislada del modelo de negocio.
-- DurationSec y contadores requieren conversion/validacion durante la migracion.
CREATE TABLE refresh_ejecucion (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    iniciado_at         timestamptz NOT NULL,
    finalizado_at       timestamptz,
    duracion_segundos   numeric(20,3),
    filas_snapshot      bigint,
    filas_fact          bigint,
    estado              text,
    error_detalle       text
);
