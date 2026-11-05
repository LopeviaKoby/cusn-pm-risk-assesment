-- ============================================================================
-- CU SN | PMO Y GESTION DE RIESGO
-- Esquema logico v2.0.0 para PostgreSQL 18.6
-- Esquema: pmo_cusn (NO modifica ni utiliza el esquema existente pmo)
-- Entidades: 49 tablas.
-- DDL de creacion inicial: no es una migracion incremental ni incluye datos CSV.
-- Todos los nombres se crean en pmo_cusn mediante SET LOCAL search_path.
-- ============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS pmo_cusn;
SET LOCAL search_path TO pmo_cusn, pg_catalog;

-- [01] UNIDADES MONETARIAS: definicion facilitada por el usuario.
CREATE TABLE unidad_monetaria (
    codigo           varchar(3) PRIMARY KEY,
    clase            text NOT NULL CHECK (clase IN ('MONEDA', 'UNIDAD_INDEXADA')),
    CONSTRAINT ck_unidad_monetaria_codigo
        CHECK (codigo IN ('USD','PEN','CLP','COP','ARS','BRL','PAB','MXN','UF'))
);

INSERT INTO unidad_monetaria (codigo, clase) VALUES
    ('USD','MONEDA'), ('PEN','MONEDA'), ('CLP','MONEDA'),
    ('COP','MONEDA'), ('ARS','MONEDA'), ('BRL','MONEDA'),
    ('PAB','MONEDA'), ('MXN','MONEDA'), ('UF','UNIDAD_INDEXADA');

-- [02-09] MAESTROS ORGANIZACIONALES Y DE REFERENCIA
CREATE TABLE pais (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo varchar(3) NOT NULL UNIQUE,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true
);

CREATE TABLE squad (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL UNIQUE CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true
);

CREATE TABLE lob (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL UNIQUE CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true
);

CREATE TABLE servicio_lob (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lob_id bigint NOT NULL REFERENCES lob(id) ON DELETE RESTRICT,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT uq_servicio_lob_nombre UNIQUE (lob_id, nombre),
    CONSTRAINT uq_servicio_lob_id_lob UNIQUE (id, lob_id)
);

CREATE TABLE cliente (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    sector text,
    descripcion text,
    estado_cliente text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contacto_cliente (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id bigint NOT NULL REFERENCES cliente(id) ON DELETE RESTRICT,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    email text,
    telefono text,
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT uq_contacto_cliente_id_cliente UNIQUE (id, cliente_id)
);

CREATE TABLE proveedor (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE usuario (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    google_sub text UNIQUE,
    email text NOT NULL CHECK (position('@' in email) > 1),
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_usuario_email_normalizado ON usuario (lower(btrim(email)));

CREATE TABLE rol (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo varchar(30) NOT NULL UNIQUE,
    nombre text NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT ck_rol_codigo CHECK (codigo IN
        ('ADMIN','COORDINADOR','PM','ESPECIALISTA','VISUALIZADOR'))
);

INSERT INTO rol (codigo, nombre) VALUES
    ('ADMIN','Head de PMO'),
    ('COORDINADOR','Coordinador'),
    ('PM','Project Manager'),
    ('ESPECIALISTA','Especialista'),
    ('VISUALIZADOR','Visualizador');

CREATE TABLE permiso (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo text NOT NULL UNIQUE CHECK (btrim(codigo) <> ''),
    descripcion text NOT NULL,
    delegable boolean NOT NULL DEFAULT false
);

-- Catalogo de permisos de ejemplo, sin concesiones automaticas a ningun rol.
-- La matriz de autorizacion requiere aprobacion funcional antes de poblar rol_permiso.
INSERT INTO permiso (codigo, descripcion, delegable) VALUES
    ('usuarios.administrar','Administrar usuarios y asignaciones de rol',false),
    ('permisos.administrar','Administrar reglas de autorizacion',false),
    ('proyectos.consultar','Consultar proyectos autorizados',false),
    ('proyectos.crear','Crear proyectos',true),
    ('proyectos.editar','Editar proyectos autorizados',true),
    ('proyectos.desactivar','Desactivar proyectos',false),
    ('seguimiento.registrar','Registrar seguimiento de proyectos',true),
    ('proyectos.cerrar','Solicitar o ejecutar cierre autorizado',false),
    ('riesgos.gestionar','Gestionar riesgos de proyecto',true),
    ('riesgos_globales.gestionar','Gestionar riesgos corporativos',true),
    ('compras.gestionar','Gestionar compras y etapas',true),
    ('facturacion.reportar','Informar facturacion realizada',true),
    ('cambios.crear','Crear controles de cambio',true),
    ('cambios.solicitar','Solicitar cambios de fechas',true),
    ('cambios.aprobar','Aprobar cambios de planificacion',false),
    ('complejidad.evaluar','Evaluar complejidad',true),
    ('complejidad.override','Autorizar excepcion estrategica',false),
    ('compromisos.gestionar','Gestionar compromisos',true),
    ('lecciones.gestionar','Gestionar lecciones aprendidas',true),
    ('documentos.gestionar','Registrar y vincular documentos',true),
    ('entregables.validar','Validar evidencias de entregables',false),
    ('cierres.validar','Realizar validacion de cierre',false),
    ('notificaciones.enviar','Ejecutar envios o recordatorios',false),
    ('delegaciones.otorgar','Autorizar suplencias de acceso',false);

CREATE TABLE tipo_documento (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo text NOT NULL UNIQUE CHECK (btrim(codigo) <> ''),
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true
);

CREATE TABLE tipo_entregable (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL UNIQUE CHECK (btrim(nombre) <> ''),
    descripcion text,
    orden integer CHECK (orden IS NULL OR orden >= 0),
    activo boolean NOT NULL DEFAULT true
);

CREATE TABLE ambito_cambio (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL UNIQUE CHECK (btrim(nombre) <> ''),
    activo boolean NOT NULL DEFAULT true
);

INSERT INTO ambito_cambio (nombre) VALUES
    ('Alcance'), ('Plazo'), ('Costo'), ('Calidad'), ('Recursos'), ('Dependencias');

CREATE TABLE riesgo_global (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    descripcion text,
    categoria text,
    probabilidad_sugerida smallint CHECK (probabilidad_sugerida BETWEEN 1 AND 4),
    impacto_sugerido smallint CHECK (impacto_sugerido BETWEEN 1 AND 4),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE control_riesgo (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    descripcion text NOT NULL CHECK (btrim(descripcion) <> ''),
    tipo_control text CHECK (tipo_control IN ('PREVENTIVO','DETECTIVO','CORRECTIVO')),
    responsable_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    frecuencia text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- [10] PROYECTO
CREATE TABLE proyecto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tvt text NOT NULL UNIQUE CHECK (btrim(tvt) <> ''),
    cliente_id bigint NOT NULL REFERENCES cliente(id) ON DELETE RESTRICT,
    pais_id bigint NOT NULL REFERENCES pais(id) ON DELETE RESTRICT,
    lob_id bigint NOT NULL REFERENCES lob(id) ON DELETE RESTRICT,
    squad_id bigint REFERENCES squad(id) ON DELETE RESTRICT,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    descripcion text,
    situacion_inicial text,
    estado_actual text NOT NULL DEFAULT 'Requiere P1P2',
    fecha_recepcion_p1p2 date,
    fecha_inicio date,
    fecha_termino_baseline date,
    fecha_termino_actual date,
    drive_folder_id text UNIQUE,
    referencia_sap text,
    referencia_ceco text,
    referencia_pep text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_proyecto_estado CHECK (estado_actual IN (
        'Requiere P1P2','En ejecución','En transición',
        'Detenido','Cancelado','Cerrado exitoso','Cerrado con observaciones')),
    CONSTRAINT ck_proyecto_fechas CHECK (
        fecha_inicio IS NULL OR fecha_termino_baseline IS NULL
        OR fecha_termino_baseline >= fecha_inicio),
    CONSTRAINT uq_proyecto_id_lob UNIQUE (id, lob_id),
    CONSTRAINT uq_proyecto_id_cliente UNIQUE (id, cliente_id)
);

-- Integridad entre LOB del proyecto y LOB del servicio.
CREATE TABLE proyecto_servicio_lob (
    proyecto_id bigint NOT NULL,
    servicio_lob_id bigint NOT NULL,
    lob_id bigint NOT NULL,
    PRIMARY KEY (proyecto_id, servicio_lob_id),
    FOREIGN KEY (proyecto_id, lob_id) REFERENCES proyecto(id, lob_id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_lob_id, lob_id) REFERENCES servicio_lob(id, lob_id) ON DELETE RESTRICT
);

-- Integridad entre cliente del proyecto y cliente del contacto.
CREATE TABLE proyecto_contacto (
    proyecto_id bigint NOT NULL,
    contacto_id bigint NOT NULL,
    cliente_id bigint NOT NULL,
    rol_contacto text NOT NULL CHECK (btrim(rol_contacto) <> ''),
    PRIMARY KEY (proyecto_id, contacto_id, rol_contacto),
    FOREIGN KEY (proyecto_id, cliente_id) REFERENCES proyecto(id, cliente_id) ON DELETE CASCADE,
    FOREIGN KEY (contacto_id, cliente_id) REFERENCES contacto_cliente(id, cliente_id) ON DELETE RESTRICT
);

-- [11-16] SEGURIDAD Y PARTICIPACION
CREATE TABLE rol_permiso (
    rol_id bigint NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
    permiso_id bigint NOT NULL REFERENCES permiso(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE asignacion_rol (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id bigint NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    rol_id bigint NOT NULL REFERENCES rol(id) ON DELETE RESTRICT,
    alcance text NOT NULL CHECK (alcance IN ('GLOBAL','PAIS','PROYECTO')),
    pais_id bigint REFERENCES pais(id) ON DELETE RESTRICT,
    proyecto_id bigint REFERENCES proyecto(id) ON DELETE RESTRICT,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_asignacion_rol_alcance CHECK (
        (alcance = 'GLOBAL' AND pais_id IS NULL AND proyecto_id IS NULL) OR
        (alcance = 'PAIS' AND pais_id IS NOT NULL AND proyecto_id IS NULL) OR
        (alcance = 'PROYECTO' AND pais_id IS NULL AND proyecto_id IS NOT NULL))
);
CREATE UNIQUE INDEX uq_asig_rol_global ON asignacion_rol(usuario_id, rol_id)
    WHERE activo AND alcance = 'GLOBAL';
CREATE UNIQUE INDEX uq_asig_rol_pais ON asignacion_rol(usuario_id, rol_id, pais_id)
    WHERE activo AND alcance = 'PAIS';
CREATE UNIQUE INDEX uq_asig_rol_proyecto ON asignacion_rol(usuario_id, rol_id, proyecto_id)
    WHERE activo AND alcance = 'PROYECTO';

CREATE TABLE participacion_proyecto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    usuario_id bigint NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    funcion text NOT NULL CHECK (btrim(funcion) <> ''),
    fecha_inicio date,
    fecha_fin date,
    CONSTRAINT ck_participacion_fechas CHECK (
        fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);
CREATE UNIQUE INDEX uq_participacion_proyecto_funcion_actual
    ON participacion_proyecto(proyecto_id, usuario_id, funcion)
    WHERE fecha_fin IS NULL;

CREATE TABLE delegacion_acceso (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delegante_id bigint NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    delegado_id bigint NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    autorizado_por_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    alcance text NOT NULL CHECK (alcance IN ('GLOBAL','PAIS','PROYECTO')),
    pais_id bigint REFERENCES pais(id) ON DELETE RESTRICT,
    proyecto_id bigint REFERENCES proyecto(id) ON DELETE RESTRICT,
    inicio timestamptz NOT NULL,
    fin timestamptz NOT NULL,
    motivo text NOT NULL CHECK (btrim(motivo) <> ''),
    estado text NOT NULL DEFAULT 'PENDIENTE' CHECK
        (estado IN ('PENDIENTE','ACTIVA','REVOCADA','RECHAZADA')),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_delegacion_distintos CHECK (delegante_id <> delegado_id),
    CONSTRAINT ck_delegacion_vigencia CHECK (fin > inicio),
    CONSTRAINT ck_delegacion_alcance CHECK (
        (alcance = 'GLOBAL' AND pais_id IS NULL AND proyecto_id IS NULL) OR
        (alcance = 'PAIS' AND pais_id IS NOT NULL AND proyecto_id IS NULL) OR
        (alcance = 'PROYECTO' AND pais_id IS NULL AND proyecto_id IS NOT NULL))
);

CREATE TABLE delegacion_permiso (
    delegacion_id bigint NOT NULL REFERENCES delegacion_acceso(id) ON DELETE CASCADE,
    permiso_id bigint NOT NULL REFERENCES permiso(id) ON DELETE RESTRICT,
    PRIMARY KEY (delegacion_id, permiso_id)
);

-- [17-19] SEGUIMIENTO, EVENTOS Y OPERACION
CREATE TABLE seguimiento_proyecto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    registrado_por bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha_registro date NOT NULL,
    avance_planificado numeric(5,2) NOT NULL CHECK (avance_planificado BETWEEN 0 AND 100),
    avance_real numeric(5,2) NOT NULL CHECK (avance_real BETWEEN 0 AND 100),
    actividades text,
    proximos_pasos text,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evento_proyecto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    actor_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    tipo_evento text NOT NULL CHECK (btrim(tipo_evento) <> ''),
    estado_anterior text,
    estado_nuevo text,
    motivo text,
    detalle jsonb NOT NULL DEFAULT '{}'::jsonb,
    fecha_evento timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE servicio_operativo (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL UNIQUE REFERENCES proyecto(id) ON DELETE RESTRICT,
    fecha_inicio date,
    fecha_termino date,
    meses_servicio integer CHECK (meses_servicio IS NULL OR meses_servicio > 0),
    observaciones text,
    CONSTRAINT ck_servicio_operativo_fechas CHECK (
        fecha_inicio IS NULL OR fecha_termino IS NULL OR fecha_termino >= fecha_inicio)
);

-- [20-21] INGRESOS COMERCIALES Y REPORTE DEL GESTOR
CREATE TABLE condicion_comercial (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL UNIQUE REFERENCES proyecto(id) ON DELETE RESTRICT,
    tcv_tipo text NOT NULL CHECK (tcv_tipo IN ('DEFINIDO','ILIMITADO')),
    tcv_valor numeric(20,4),
    unidad_codigo varchar(3) REFERENCES unidad_monetaria(codigo) ON DELETE RESTRICT,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_condicion_tcv CHECK (
        (tcv_tipo = 'ILIMITADO' AND tcv_valor IS NULL) OR
        (tcv_tipo = 'DEFINIDO' AND tcv_valor IS NOT NULL AND
         tcv_valor >= 0 AND unidad_codigo IS NOT NULL))
);

CREATE TABLE hito_facturacion (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    periodo date NOT NULL,
    tipo_hito text,
    tipo_cuota text,
    unidad_codigo varchar(3) REFERENCES unidad_monetaria(codigo) ON DELETE RESTRICT,
    showprice numeric(20,4),
    planificado numeric(20,4),
    real_reportado numeric(20,4),
    estado text,
    comentario text,
    origen text,
    origen_ref text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_facturacion_mes CHECK (
        periodo = date_trunc('month', periodo::timestamp)::date)
);

-- [22-23] COMPRAS
CREATE TABLE compra (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    proveedor_id bigint NOT NULL REFERENCES proveedor(id) ON DELETE RESTRICT,
    gestor_compra_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    concepto text,
    descripcion text,
    tipo_gasto text CHECK (tipo_gasto IN ('CAPEX','OPEX')),
    unidad_codigo varchar(3) REFERENCES unidad_monetaria(codigo) ON DELETE RESTRICT,
    fecha_solicitud date,
    monto_adjudicado numeric(20,4) CHECK (monto_adjudicado IS NULL OR monto_adjudicado >= 0),
    valor_setup numeric(20,4) CHECK (valor_setup IS NULL OR valor_setup >= 0),
    valor_recurrente numeric(20,4) CHECK (valor_recurrente IS NULL OR valor_recurrente >= 0),
    meses_recurrentes integer CHECK (meses_recurrentes IS NULL OR meses_recurrentes >= 0),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE etapa_compra (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    compra_id bigint NOT NULL REFERENCES compra(id) ON DELETE RESTRICT,
    tipo_etapa text NOT NULL CHECK (tipo_etapa IN ('BORP','SOLPED','OC','CONFORMIDAD')),
    referencia_documento text,
    estado text,
    fecha_registro timestamptz,
    CONSTRAINT uq_compra_tipo_etapa UNIQUE (compra_id, tipo_etapa)
);

-- BORP -> SOLPED -> OC -> CONFORMIDAD: orden definido.
-- Se dejan sin bloquear transiciones saltadas hasta confirmacion del negocio.

-- [24-27] RIESGOS DE PROYECTO, CONTROLES, ACCIONES Y EVALUACIONES
CREATE TABLE riesgo_proyecto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    riesgo_global_id bigint REFERENCES riesgo_global(id) ON DELETE RESTRICT,
    responsable_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    descripcion text,
    categoria text,
    estado text NOT NULL DEFAULT 'Pendiente'
        CHECK (estado IN ('Pendiente','Contingencia','Controlado','Mitigado')),
    estrategia text CHECK (estrategia IN
        ('Mitigar','Aceptar','Transferir','Evitar','Reducir')),
    plan_mitigacion text,
    plan_contingencia text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evaluacion_riesgo (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    riesgo_proyecto_id bigint NOT NULL REFERENCES riesgo_proyecto(id) ON DELETE RESTRICT,
    evaluador_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha_evaluacion timestamptz NOT NULL DEFAULT now(),
    tipo_evaluacion text NOT NULL CHECK
        (tipo_evaluacion IN ('INICIAL','RESIDUAL','REVISION')),
    probabilidad smallint NOT NULL CHECK (probabilidad BETWEEN 1 AND 4),
    impacto smallint NOT NULL CHECK (impacto BETWEEN 1 AND 4),
    severidad smallint GENERATED ALWAYS AS (probabilidad * impacto) STORED,
    justificacion text
);

CREATE TABLE riesgo_control_riesgo (
    riesgo_proyecto_id bigint NOT NULL REFERENCES riesgo_proyecto(id) ON DELETE RESTRICT,
    control_riesgo_id bigint NOT NULL REFERENCES control_riesgo(id) ON DELETE RESTRICT,
    observaciones text,
    PRIMARY KEY (riesgo_proyecto_id, control_riesgo_id)
);

CREATE TABLE accion_riesgo (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    riesgo_proyecto_id bigint NOT NULL REFERENCES riesgo_proyecto(id) ON DELETE RESTRICT,
    responsable_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    descripcion text NOT NULL CHECK (btrim(descripcion) <> ''),
    estado text NOT NULL DEFAULT 'PENDIENTE',
    fecha_compromiso date,
    fecha_cumplimiento date,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- [28-30] CONTROL DE CAMBIO DE FECHAS Y SUS SOLICITUDES
CREATE TABLE control_cambio (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    secuencia integer NOT NULL CHECK (secuencia > 0),
    folio text NOT NULL CHECK (btrim(folio) <> ''),
    fecha_elaboracion date NOT NULL,
    descripcion text NOT NULL CHECK (btrim(descripcion) <> ''),
    justificacion text,
    urgencia text NOT NULL CHECK (urgencia IN ('ALTA','MEDIA','BAJA')),
    estado_firma text NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado_firma IN ('PENDIENTE','NOTIFICADO','FIRMADO')),
    estado_aprobacion text CHECK
        (estado_aprobacion IN ('PENDIENTE','APROBADO','RECHAZADO')),
    responsabilidad text CHECK (responsabilidad IN ('CLIENTE','TIVIT','AMBOS')),
    responsable_cliente_id bigint REFERENCES contacto_cliente(id) ON DELETE RESTRICT,
    responsable_interno_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    account_responsable_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    impacto_monetario numeric(20,4),
    tipo_impacto text CHECK (tipo_impacto IN ('COSTO_TIVIT','BENEFICIO')),
    unidad_codigo varchar(3) REFERENCES unidad_monetaria(codigo) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_cc_proyecto_folio UNIQUE (proyecto_id, folio),
    CONSTRAINT uq_cc_proyecto_secuencia UNIQUE (proyecto_id, secuencia),
    CONSTRAINT uq_cc_id_proyecto UNIQUE (id, proyecto_id),
    CONSTRAINT ck_cc_moneda CHECK (impacto_monetario IS NULL OR unidad_codigo IS NOT NULL),
    CONSTRAINT ck_cc_responsables CHECK (
        responsabilidad IS NULL OR
        (responsabilidad = 'CLIENTE' AND responsable_cliente_id IS NOT NULL) OR
        (responsabilidad = 'TIVIT' AND responsable_interno_id IS NOT NULL) OR
        (responsabilidad = 'AMBOS' AND responsable_cliente_id IS NOT NULL
             AND responsable_interno_id IS NOT NULL))
);

CREATE TABLE cambio_ambito (
    control_cambio_id bigint NOT NULL REFERENCES control_cambio(id) ON DELETE RESTRICT,
    ambito_id bigint NOT NULL REFERENCES ambito_cambio(id) ON DELETE RESTRICT,
    PRIMARY KEY (control_cambio_id, ambito_id)
);

CREATE TABLE solicitud_cambio_planificacion (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    control_cambio_id bigint,
    solicitante_id bigint NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    aprobador_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    campo text NOT NULL CHECK (campo IN (
        'FECHA_INICIO','FECHA_TERMINO','FECHA_OPERACION_INICIO','FECHA_OPERACION_TERMINO')),
    valor_anterior date NOT NULL,
    valor_propuesto date NOT NULL,
    es_excepcion boolean NOT NULL DEFAULT false,
    justificacion text,
    estado text NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE','APROBADO','RECHAZADO')),
    fecha_solicitud timestamptz NOT NULL DEFAULT now(),
    fecha_resolucion timestamptz,
    CONSTRAINT fk_solicitud_cc_mismo_proyecto
        FOREIGN KEY (control_cambio_id, proyecto_id)
        REFERENCES control_cambio(id, proyecto_id) ON DELETE RESTRICT,
    CONSTRAINT ck_solicitud_diferencia CHECK (valor_anterior <> valor_propuesto),
    CONSTRAINT ck_solicitud_excepcion CHECK (
        (es_excepcion AND control_cambio_id IS NULL
             AND justificacion IS NOT NULL AND btrim(justificacion) <> '') OR
        (NOT es_excepcion AND control_cambio_id IS NOT NULL)),
    CONSTRAINT ck_solicitud_resolucion CHECK (
        (estado = 'PENDIENTE' AND fecha_resolucion IS NULL AND aprobador_id IS NULL) OR
        (estado IN ('APROBADO','RECHAZADO') AND fecha_resolucion IS NOT NULL
             AND aprobador_id IS NOT NULL)),
    CONSTRAINT ck_solicitud_separacion_funciones CHECK (
        aprobador_id IS NULL OR aprobador_id <> solicitante_id)
);

-- Garantia de consumo unico: un CC a lo sumo respalda una APROBACION.
CREATE UNIQUE INDEX uq_solicitud_cc_aprobado
    ON solicitud_cambio_planificacion(control_cambio_id)
    WHERE estado = 'APROBADO' AND control_cambio_id IS NOT NULL;
-- Evita reservar un CC en dos solicitudes simultaneamente pendientes.
CREATE UNIQUE INDEX uq_solicitud_cc_pendiente
    ON solicitud_cambio_planificacion(control_cambio_id)
    WHERE estado = 'PENDIENTE' AND control_cambio_id IS NOT NULL;
-- Una solicitud pendiente por proyecto y campo.
CREATE UNIQUE INDEX uq_solicitud_campo_pendiente
    ON solicitud_cambio_planificacion(proyecto_id, campo)
    WHERE estado = 'PENDIENTE';

-- El CC debe permanecer FIRMADO al solicitar y al aprobar.
CREATE FUNCTION validar_control_cambio_para_solicitud()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_estado text;
BEGIN
    IF NEW.control_cambio_id IS NOT NULL AND NEW.estado IN ('PENDIENTE','APROBADO') THEN
        SELECT c.estado_firma INTO v_estado
        FROM control_cambio AS c
        WHERE c.id = NEW.control_cambio_id AND c.proyecto_id = NEW.proyecto_id
        FOR SHARE;
        IF v_estado IS DISTINCT FROM 'FIRMADO' THEN
            RAISE EXCEPTION 'El control de cambio % debe estar firmado y ser del proyecto %',
                NEW.control_cambio_id, NEW.proyecto_id;
        END IF;
        IF EXISTS (
            SELECT 1 FROM solicitud_cambio_planificacion s
            WHERE s.control_cambio_id = NEW.control_cambio_id
              AND s.estado = 'APROBADO'
              AND s.id IS DISTINCT FROM NEW.id
        ) THEN
            RAISE EXCEPTION 'El control de cambio % ya fue consumido', NEW.control_cambio_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER tr_validar_cc_solicitud
    BEFORE INSERT OR UPDATE ON solicitud_cambio_planificacion
    FOR EACH ROW EXECUTE FUNCTION validar_control_cambio_para_solicitud();

-- Las solicitudes resueltas forman parte de la trazabilidad y no se reescriben.
CREATE FUNCTION impedir_mutacion_solicitud_resuelta()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.estado IN ('APROBADO','RECHAZADO') THEN
        RAISE EXCEPTION 'La solicitud resuelta % es inmutable', OLD.id;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER tr_proteger_solicitud_resuelta
    BEFORE UPDATE OR DELETE ON solicitud_cambio_planificacion
    FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_solicitud_resuelta();

-- Los CC consumidos no deben borrarse ni modificarse silenciosamente.
CREATE FUNCTION proteger_control_cambio_consumido()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM solicitud_cambio_planificacion s
        WHERE s.control_cambio_id = OLD.id AND s.estado = 'APROBADO'
    ) THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'No se permite eliminar un control de cambio consumido: %', OLD.id;
        ELSIF NEW IS DISTINCT FROM OLD THEN
            RAISE EXCEPTION 'No se permite modificar un control de cambio consumido: %', OLD.id;
        END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER tr_proteger_control_cambio
    BEFORE UPDATE OR DELETE ON control_cambio
    FOR EACH ROW EXECUTE FUNCTION proteger_control_cambio_consumido();

-- [31] COMPLEJIDAD
CREATE TABLE evaluacion_complejidad (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    evaluador_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    riesgo smallint NOT NULL CHECK (riesgo BETWEEN 1 AND 5),
    facturacion smallint NOT NULL CHECK (facturacion BETWEEN 1 AND 5),
    plazo smallint NOT NULL CHECK (plazo BETWEEN 1 AND 5),
    alcance smallint NOT NULL CHECK (alcance BETWEEN 1 AND 5),
    nota_riesgo text,
    nota_facturacion text,
    nota_plazo text,
    nota_alcance text,
    indice_complejidad numeric(2,1) NOT NULL
        CHECK (indice_complejidad BETWEEN 1 AND 5),
    tipificacion text NOT NULL
        CHECK (tipificacion IN ('BAJO','MEDIO','ALTO','ESTRATEGICO')),
    override_estrategico boolean NOT NULL DEFAULT false,
    motivo_override text,
    version_modelo text NOT NULL DEFAULT 'V1',
    fecha_evaluacion timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_complejidad_v1_formula CHECK (
        version_modelo <> 'V1' OR indice_complejidad = round(
            riesgo * 0.35 + facturacion * 0.20 + plazo * 0.15 + alcance * 0.30, 1)),
    CONSTRAINT ck_complejidad_override CHECK (
        NOT override_estrategico OR
        (tipificacion = 'ESTRATEGICO' AND motivo_override IS NOT NULL
         AND btrim(motivo_override) <> ''))
);

-- [32-33] COMPROMISOS Y LECCIONES APRENDIDAS
CREATE TABLE compromiso (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint REFERENCES proyecto(id) ON DELETE RESTRICT,
    pais_id bigint REFERENCES pais(id) ON DELETE RESTRICT,
    responsable_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    responsable_texto text,
    titulo text NOT NULL CHECK (btrim(titulo) <> ''),
    descripcion text,
    alcance text NOT NULL CHECK (alcance IN ('GLOBAL','PAIS','PROYECTO')),
    fecha_compromiso date,
    fecha_limite date,
    completado boolean NOT NULL DEFAULT false,
    completado_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_compromiso_alcance CHECK (
        (alcance = 'GLOBAL' AND proyecto_id IS NULL AND pais_id IS NULL) OR
        (alcance = 'PAIS' AND pais_id IS NOT NULL AND proyecto_id IS NULL) OR
        (alcance = 'PROYECTO' AND proyecto_id IS NOT NULL AND pais_id IS NULL)),
    CONSTRAINT ck_compromiso_responsable CHECK (
        responsable_id IS NOT NULL OR
        (responsable_texto IS NOT NULL AND btrim(responsable_texto) <> '')),
    CONSTRAINT ck_compromiso_fechas CHECK (
        fecha_compromiso IS NULL OR fecha_limite IS NULL
        OR fecha_limite >= fecha_compromiso)
);

CREATE TABLE leccion_aprendida (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint REFERENCES proyecto(id) ON DELETE RESTRICT,
    autor_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha date,
    titulo text NOT NULL CHECK (btrim(titulo) <> ''),
    area text,
    situacion text,
    impacto text,
    acciones_correctivas text,
    leccion text NOT NULL CHECK (btrim(leccion) <> ''),
    correo_texto text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- [34-38] DOCUMENTOS EN GOOGLE DRIVE Y VINCULOS
CREATE TABLE documento (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_documento_id bigint REFERENCES tipo_documento(id) ON DELETE RESTRICT,
    drive_file_id text NOT NULL UNIQUE CHECK (btrim(drive_file_id) <> ''),
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    mime_type text NOT NULL,
    drive_version bigint CHECK (drive_version IS NULL OR drive_version > 0),
    drive_modified_at timestamptz,
    ultimo_sync_at timestamptz,
    estado_registro text NOT NULL DEFAULT 'VIGENTE'
        CHECK (estado_registro IN ('VIGENTE','ARCHIVADO')),
    created_by bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE proyecto_documento (
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    documento_id bigint NOT NULL REFERENCES documento(id) ON DELETE RESTRICT,
    vinculado_at timestamptz NOT NULL DEFAULT now(),
    vinculado_por bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    PRIMARY KEY (proyecto_id, documento_id)
);

CREATE TABLE control_cambio_documento (
    control_cambio_id bigint NOT NULL REFERENCES control_cambio(id) ON DELETE RESTRICT,
    documento_id bigint NOT NULL REFERENCES documento(id) ON DELETE RESTRICT,
    vinculado_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (control_cambio_id, documento_id)
);

CREATE TABLE leccion_documento (
    leccion_id bigint NOT NULL REFERENCES leccion_aprendida(id) ON DELETE RESTRICT,
    documento_id bigint NOT NULL REFERENCES documento(id) ON DELETE RESTRICT,
    vinculado_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (leccion_id, documento_id)
);

-- [39-40] CHECKLIST POR PROYECTO Y EVIDENCIAS
CREATE TABLE item_checklist_proyecto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    tipo_entregable_id bigint REFERENCES tipo_entregable(id) ON DELETE RESTRICT,
    nombre text NOT NULL CHECK (btrim(nombre) <> ''),
    orden integer CHECK (orden IS NULL OR orden >= 0),
    obligatorio boolean NOT NULL DEFAULT true,
    requiere_documento boolean NOT NULL DEFAULT false,
    completado boolean NOT NULL DEFAULT false,
    comentario text,
    completado_por bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    completado_at timestamptz
);

CREATE TABLE item_checklist_documento (
    item_checklist_id bigint NOT NULL REFERENCES item_checklist_proyecto(id) ON DELETE RESTRICT,
    documento_id bigint NOT NULL REFERENCES documento(id) ON DELETE RESTRICT,
    vinculado_at timestamptz NOT NULL DEFAULT now(),
    vinculado_por bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    PRIMARY KEY (item_checklist_id, documento_id)
);

-- [41-42] VALIDACIONES DE CIERRE Y NOTIFICACIONES
CREATE TABLE validacion_cierre (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyecto(id) ON DELETE RESTRICT,
    validador_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha_validacion timestamptz NOT NULL DEFAULT now(),
    checklist_ok boolean,
    documentos_ok boolean,
    riesgos_ok boolean,
    lecciones_ok boolean,
    resultado text NOT NULL CHECK
        (resultado IN ('PENDIENTE','APTO','NO_APTO','SIN_EVIDENCIA_HISTORICA')),
    observaciones text,
    CONSTRAINT ck_cierre_apto CHECK (
        resultado <> 'APTO' OR
        (validador_id IS NOT NULL AND checklist_ok IS TRUE AND
         documentos_ok IS TRUE AND riesgos_ok IS TRUE AND lecciones_ok IS TRUE))
);

CREATE TABLE registro_notificacion (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_destinatario_id bigint REFERENCES usuario(id) ON DELETE RESTRICT,
    proyecto_id bigint REFERENCES proyecto(id) ON DELETE RESTRICT,
    destinatario_email text NOT NULL CHECK (position('@' in destinatario_email) > 1),
    tipo text NOT NULL,
    canal text NOT NULL DEFAULT 'EMAIL' CHECK (canal IN ('EMAIL','APLICACION')),
    asunto text NOT NULL,
    estado_envio text NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado_envio IN ('PENDIENTE','ENVIADA','ERROR','CANCELADA')),
    creado_at timestamptz NOT NULL DEFAULT now(),
    enviado_at timestamptz,
    error_detalle text
);

-- [43+] INDICES DE CONSULTA (ademas de PK, UNIQUE y parciales anteriores)
CREATE INDEX ix_servicio_lob_lob ON servicio_lob(lob_id);
CREATE INDEX ix_contacto_cliente_cliente ON contacto_cliente(cliente_id);
CREATE INDEX ix_proyecto_cliente ON proyecto(cliente_id);
CREATE INDEX ix_proyecto_pais ON proyecto(pais_id);
CREATE INDEX ix_proyecto_lob ON proyecto(lob_id);
CREATE INDEX ix_proyecto_squad ON proyecto(squad_id);
CREATE INDEX ix_proyecto_estado ON proyecto(estado_actual);
CREATE INDEX ix_proyecto_servicio_servicio ON proyecto_servicio_lob(servicio_lob_id);
CREATE INDEX ix_proyecto_contacto_contacto ON proyecto_contacto(contacto_id);
CREATE INDEX ix_rol_permiso_permiso ON rol_permiso(permiso_id);
CREATE INDEX ix_asignacion_usuario ON asignacion_rol(usuario_id);
CREATE INDEX ix_asignacion_rol ON asignacion_rol(rol_id);
CREATE INDEX ix_participacion_usuario ON participacion_proyecto(usuario_id);
CREATE INDEX ix_participacion_proyecto ON participacion_proyecto(proyecto_id);
CREATE INDEX ix_delegacion_delegado_periodo ON delegacion_acceso(delegado_id, inicio, fin);
CREATE INDEX ix_delegacion_delegante ON delegacion_acceso(delegante_id);
CREATE INDEX ix_delegacion_permiso_permiso ON delegacion_permiso(permiso_id);
CREATE INDEX ix_seguimiento_proyecto_fecha ON seguimiento_proyecto(proyecto_id, fecha_registro DESC);
CREATE INDEX ix_evento_proyecto_fecha ON evento_proyecto(proyecto_id, fecha_evento DESC);
CREATE INDEX ix_hito_facturacion_proyecto_periodo ON hito_facturacion(proyecto_id, periodo);
CREATE INDEX ix_hito_facturacion_unidad ON hito_facturacion(unidad_codigo);
CREATE INDEX ix_compra_proyecto ON compra(proyecto_id);
CREATE INDEX ix_compra_proveedor ON compra(proveedor_id);
CREATE INDEX ix_etapa_compra_compra ON etapa_compra(compra_id);
CREATE INDEX ix_riesgo_proyecto_proyecto ON riesgo_proyecto(proyecto_id);
CREATE INDEX ix_riesgo_proyecto_global ON riesgo_proyecto(riesgo_global_id);
CREATE INDEX ix_evaluacion_riesgo_fecha ON evaluacion_riesgo(riesgo_proyecto_id, fecha_evaluacion DESC);
CREATE INDEX ix_accion_riesgo_riesgo ON accion_riesgo(riesgo_proyecto_id);
CREATE INDEX ix_riesgo_control_control ON riesgo_control_riesgo(control_riesgo_id);
CREATE INDEX ix_cc_proyecto ON control_cambio(proyecto_id);
CREATE INDEX ix_cambio_ambito_ambito ON cambio_ambito(ambito_id);
CREATE INDEX ix_solicitud_proyecto ON solicitud_cambio_planificacion(proyecto_id);
CREATE INDEX ix_solicitud_estado ON solicitud_cambio_planificacion(estado);
CREATE INDEX ix_complejidad_proyecto_fecha ON evaluacion_complejidad(proyecto_id, fecha_evaluacion DESC);
CREATE INDEX ix_compromiso_proyecto ON compromiso(proyecto_id);
CREATE INDEX ix_compromiso_responsable ON compromiso(responsable_id);
CREATE INDEX ix_leccion_proyecto ON leccion_aprendida(proyecto_id);
CREATE INDEX ix_documento_tipo ON documento(tipo_documento_id);
CREATE INDEX ix_proyecto_documento_documento ON proyecto_documento(documento_id);
CREATE INDEX ix_cc_documento_documento ON control_cambio_documento(documento_id);
CREATE INDEX ix_leccion_documento_documento ON leccion_documento(documento_id);
CREATE INDEX ix_checklist_proyecto ON item_checklist_proyecto(proyecto_id);
CREATE INDEX ix_checklist_documento_documento ON item_checklist_documento(documento_id);
CREATE INDEX ix_validacion_cierre_proyecto_fecha ON validacion_cierre(proyecto_id, fecha_validacion DESC);
CREATE INDEX ix_notificacion_usuario_fecha ON registro_notificacion(usuario_destinatario_id, creado_at DESC);
CREATE INDEX ix_notificacion_proyecto ON registro_notificacion(proyecto_id);

-- AUDITORIA DE CAMBIOS DE ESTADO DEL PROYECTO: EVENTOS SOLO ANEXABLES.
CREATE FUNCTION impedir_mutacion_evento_proyecto()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'evento_proyecto es append-only; registre un nuevo evento';
END;
$$;
CREATE TRIGGER tr_evento_proyecto_inmutable
    BEFORE UPDATE OR DELETE ON evento_proyecto
    FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_evento_proyecto();

COMMENT ON SCHEMA pmo_cusn IS 'CU SN: gestion de proyectos, riesgos, cambios, evidencias y seguimiento PMO';
COMMENT ON TABLE unidad_monetaria IS 'Unidades permitidas: monedas y UF indexada; EUR no esta en la lista aprobada.';
COMMENT ON TABLE proyecto IS 'Estado actual; transiciones historizadas en evento_proyecto.';
COMMENT ON TABLE evento_proyecto IS 'Historial append-only; actualizacion de estado y evento deben registrarse en una transaccion de aplicacion.';
COMMENT ON TABLE hito_facturacion IS 'real_reportado es un valor informado por el gestor, no una factura ni un cobro contable confirmado.';
COMMENT ON TABLE condicion_comercial IS 'TCV contractual: valor definido o ilimitado.';
COMMENT ON TABLE solicitud_cambio_planificacion IS 'Un CC firmado solo puede respaldar una solicitud APROBADA; excepciones requieren justificacion.';
COMMENT ON TABLE evaluacion_riesgo IS 'Severidad P x I derivada; la interpretacion de Controlado sigue pendiente de validacion del negocio.';
COMMENT ON TABLE documento IS 'Archivo unico almacenado en Google Drive; esta tabla guarda metadatos y referencias.';
COMMENT ON TABLE validacion_cierre IS 'Las verificaciones historicas sin evidencia no deben marcarse APTO.';
COMMENT ON TABLE rol_permiso IS 'Se entrega sin asignaciones: la matriz de permisos debe aprobarse antes de habilitar acceso.';
COMMENT ON TABLE delegacion_acceso IS 'La vigencia efectiva se comprueba con estado ACTIVA y now() entre inicio y fin; no implica suplantacion.';

COMMIT;

-- INFORMACION DE ALCANCE
-- - No realiza migraciones ni inserta registros de los CSV antiguos.
-- - Horas, repases y tarifas internas permanecen fuera de alcance por decision.
-- - Estados de cierre, uso de CC, permisos y evidencia deben aplicarse desde
--   servicios transaccionales; el DDL no sustituye esas reglas de aplicacion.
-- - Pais, squad y LOB son maestros; no se crea el catalogo universal heredado.
-- - Monedas historicas distintas de las nueve aprobadas (como EUR) requieren
--   validacion/normalizacion previa antes de migrar, sin alterar esta CHECK.
