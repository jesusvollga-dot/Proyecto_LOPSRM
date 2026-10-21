-- ============================================================================
-- PROYECTO: SISTEMA WEB PARA EL CONTROL, SEGUIMIENTO Y ADMINISTRACIÓN DE OBRA PÚBLICA
-- MARCO NORMATIVO: LOPSRM / RLOPSRM
-- MOTOR: PostgreSQL 16+
-- ARCHIVO: database/schema.sql
-- ============================================================================

-- Habilitar extensiones requeridas si son necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLA: ROLES (RBAC - 5 ROLES LEGALES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. TABLA: USUARIOS
-- Los usuarios se registran inactivos (activo = FALSE) y sin rol asignado
-- hasta que el Administrador valide y active la cuenta (RF-01, RF-02).
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT REFERENCES roles(id_rol) ON DELETE RESTRICT,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(100) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    cedula_profesional VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TABLA: OBRAS PÚBLICAS
-- Representa el contrato adjudicado conforme al Art. 46 de la LOPSRM (RF-03).
-- ============================================================================
CREATE TABLE IF NOT EXISTS obras (
    id_obra SERIAL PRIMARY KEY,
    clave_obra VARCHAR(50) UNIQUE NOT NULL,
    nombre_obra VARCHAR(255) NOT NULL,
    numero_contrato VARCHAR(100) UNIQUE NOT NULL,
    presupuesto_autorizado NUMERIC(14, 2) NOT NULL CHECK (presupuesto_autorizado > 0),
    porcentaje_anticipo NUMERIC(5, 2) NOT NULL DEFAULT 30.00 CHECK (porcentaje_anticipo >= 0 AND porcentaje_anticipo <= 30.00),
    fecha_inicio_programada DATE NOT NULL,
    fecha_termino_programada DATE NOT NULL,
    estatus VARCHAR(30) NOT NULL DEFAULT 'EN_EJECUCION' 
        CHECK (estatus IN ('EN_EJECUCION', 'SUSPENDIDA', 'TERMINADA', 'FINIQUITADA')),
    activo BOOLEAN NOT NULL DEFAULT TRUE, -- Borrado lógico (Soft Delete)
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fechas_obra CHECK (fecha_termino_programada >= fecha_inicio_programada)
);

-- ============================================================================
-- 4. TABLA: ASIGNACIONES DE OBRA (CUADRILLAS OPERATIVAS)
-- Asignación obligatoria de la terna: Residente, Superintendente y Supervisor (RF-04).
-- ============================================================================
CREATE TABLE IF NOT EXISTS asignaciones_obra (
    id_asignacion SERIAL PRIMARY KEY,
    id_obra INT NOT NULL REFERENCES obras(id_obra) ON DELETE RESTRICT,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    rol_en_obra VARCHAR(50) NOT NULL 
        CHECK (rol_en_obra IN ('RESIDENTE', 'SUPERINTENDENTE', 'SUPERVISOR')),
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_obra_rol UNIQUE (id_obra, rol_en_obra)
);

-- ============================================================================
-- 5. TABLA: CATÁLOGOS DE CONCEPTOS
-- Gestión triple de catálogos: Original, Modificado y Extraordinario (RF-08).
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalogos (
    id_catalogo SERIAL PRIMARY KEY,
    id_obra INT NOT NULL REFERENCES obras(id_obra) ON DELETE RESTRICT,
    tipo_catalogo VARCHAR(30) NOT NULL 
        CHECK (tipo_catalogo IN ('ORIGINAL', 'MODIFICADO', 'EXTRAORDINARIO')),
    version INT NOT NULL DEFAULT 1 CHECK (version >= 1),
    estatus_aprobacion VARCHAR(30) NOT NULL DEFAULT 'BORRADOR' 
        CHECK (estatus_aprobacion IN ('BORRADOR', 'AUTORIZADO', 'BLOQUEADO')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================================
-- 6. TABLA: CONCEPTOS DE TRABAJO (MATRIZ DE PRECIOS UNITARIOS)
-- Importe calculado automáticamente: Cantidad * Costo Directo Unitario (RF-06, RF-07).
-- ============================================================================
CREATE TABLE IF NOT EXISTS conceptos (
    id_concepto SERIAL PRIMARY KEY,
    id_catalogo INT NOT NULL REFERENCES catalogos(id_catalogo) ON DELETE RESTRICT,
    partida VARCHAR(100) NOT NULL,
    subpartida VARCHAR(100),
    clave_concepto VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    cantidad NUMERIC(14, 2) NOT NULL CHECK (cantidad >= 0),
    costo_directo_unitario NUMERIC(14, 2) NOT NULL CHECK (costo_directo_unitario >= 0),
    importe_costo_directo NUMERIC(14, 2) GENERATED ALWAYS AS (cantidad * costo_directo_unitario) STORED,
    porcentaje_incidencia NUMERIC(6, 4) DEFAULT 0.0000,
    activo BOOLEAN NOT NULL DEFAULT TRUE, -- Borrado lógico (Soft Delete)
    CONSTRAINT uq_catalogo_clave UNIQUE (id_catalogo, clave_concepto)
);

-- ============================================================================
-- 7. TABLA: HISTORIAL DE CONCEPTOS (AUDITORÍA INMUTABLE)
-- Registro inmutable de cada alteración a conceptos (RF-09).
-- ============================================================================
CREATE TABLE IF NOT EXISTS historial_conceptos (
    id_historial SERIAL PRIMARY KEY,
    id_concepto INT NOT NULL REFERENCES conceptos(id_concepto) ON DELETE RESTRICT,
    id_usuario_modifica INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    campo_modificado VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    justificacion TEXT NOT NULL
);

-- ============================================================================
-- 8. TABLA: REPORTES DIARIOS DE SUPERVISIÓN
-- Captura diaria de clima, checklists, personal y avance acumulado (RF-11, RF-12).
-- ============================================================================
CREATE TABLE IF NOT EXISTS reportes_diarios (
    id_reporte SERIAL PRIMARY KEY,
    id_obra INT NOT NULL REFERENCES obras(id_obra) ON DELETE RESTRICT,
    id_supervisor INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    fecha_reporte DATE NOT NULL,
    clima VARCHAR(50) NOT NULL 
        CHECK (clima IN ('Soleado', 'Parcialmente Nublado', 'Nublado', 'Lluvia Ligera', 'Lluvia Fuerte', 'Tormenta')),
    senalamiento_preventivo BOOLEAN NOT NULL DEFAULT FALSE,
    equipo_proteccion_epp BOOLEAN NOT NULL DEFAULT FALSE,
    suministro_material BOOLEAN NOT NULL DEFAULT FALSE,
    estatus_personal VARCHAR(30) NOT NULL 
        CHECK (estatus_personal IN ('Suficiente', 'Insuficiente')),
    resumen_cuadrilla JSONB,
    maquinaria_sitio JSONB,
    avance_fisico_acumulado NUMERIC(6, 2) NOT NULL 
        CHECK (avance_fisico_acumulado >= 0.00 AND avance_fisico_acumulado <= 100.00),
    fecha_estimada_fin DATE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_obra_fecha_reporte UNIQUE (id_obra, fecha_reporte)
);

-- ============================================================================
-- 9. TABLA: EVIDENCIA FOTOGRÁFICA (EXACTAMENTE 6 FOTOGRAFÍAS)
-- Carga forzosa de exactamente 6 fotografías fechadas por reporte (RF-13).
-- ============================================================================
CREATE TABLE IF NOT EXISTS fotos_reporte (
    id_foto SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL REFERENCES reportes_diarios(id_reporte) ON DELETE RESTRICT,
    numero_foto INT NOT NULL CHECK (numero_foto BETWEEN 1 AND 6),
    url_archivo VARCHAR(255) NOT NULL,
    descripcion_foto VARCHAR(255),
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reporte_numero_foto UNIQUE (id_reporte, numero_foto)
);

-- ============================================================================
-- 10. TABLA: INCIDENCIAS E INTERFERENCIAS DE REPORTE
-- Registro de eventos críticos que afecten el programa de obra (RF-12).
-- ============================================================================
CREATE TABLE IF NOT EXISTS incidencias_reporte (
    id_incidencia SERIAL PRIMARY KEY,
    id_reporte INT NOT NULL REFERENCES reportes_diarios(id_reporte) ON DELETE RESTRICT,
    tipo VARCHAR(50) NOT NULL 
        CHECK (tipo IN ('Problematica', 'Interferencia', 'Suspension_Parcial', 'Fuerza_Mayor')),
    descripcion TEXT NOT NULL,
    acciones_a_seguir TEXT NOT NULL,
    estatus VARCHAR(30) NOT NULL DEFAULT 'Pendiente' 
        CHECK (estatus IN ('Pendiente', 'Solucionado')),
    fecha_solucion DATE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. TABLA: ESTIMACIONES Y FLUJO SEMÁFORO
-- Trámite de pago en ciclo perentorio de 15 días naturales y retenciones (RF-15, RF-16, RF-17).
-- ============================================================================
CREATE TABLE IF NOT EXISTS estimaciones (
    id_estimacion SERIAL PRIMARY KEY,
    id_obra INT NOT NULL REFERENCES obras(id_obra) ON DELETE RESTRICT,
    id_superintendente INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    numero_estimacion INT NOT NULL CHECK (numero_estimacion > 0),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    amortizacion_anticipo NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (amortizacion_anticipo >= 0),
    retencion_5_al_millar NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (retencion_5_al_millar >= 0),
    total_a_pagar NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_a_pagar >= 0),
    estatus_semaforo VARCHAR(30) NOT NULL DEFAULT 'AMARILLO' 
        CHECK (estatus_semaforo IN ('AMARILLO', 'NARANJA', 'VERDE', 'ROJO')),
    motivo_rechazo TEXT,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_15_dias TIMESTAMP WITH TIME ZONE,
    fecha_autorizacion_final TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_obra_numero_estimacion UNIQUE (id_obra, numero_estimacion),
    CONSTRAINT chk_periodo_estimacion CHECK (periodo_fin >= periodo_inicio)
);

-- ============================================================================
-- 12. TABLA: DETALLE DE ESTIMACIÓN (CANTIDADES EJECUTADAS POR CONCEPTO)
-- Vinculación de volúmenes ejecutados a los conceptos del catálogo base (RF-15).
-- ============================================================================
CREATE TABLE IF NOT EXISTS detalle_estimaciones (
    id_detalle SERIAL PRIMARY KEY,
    id_estimacion INT NOT NULL REFERENCES estimaciones(id_estimacion) ON DELETE RESTRICT,
    id_concepto INT NOT NULL REFERENCES conceptos(id_concepto) ON DELETE RESTRICT,
    cantidad_ejecutada NUMERIC(14, 2) NOT NULL CHECK (cantidad_ejecutada > 0),
    precio_unitario NUMERIC(14, 2) NOT NULL CHECK (precio_unitario >= 0),
    importe_acumulado NUMERIC(14, 2) GENERATED ALWAYS AS (cantidad_ejecutada * precio_unitario) STORED,
    CONSTRAINT uq_estimacion_concepto UNIQUE (id_estimacion, id_concepto)
);

-- ============================================================================
-- ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN DE CONSULTAS FRECUENTES)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_conceptos_catalogo ON conceptos(id_catalogo) WHERE activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_conceptos_clave ON conceptos(clave_concepto);
CREATE INDEX IF NOT EXISTS idx_reportes_obra_fecha ON reportes_diarios(id_obra, fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_estimaciones_obra ON estimaciones(id_obra);
CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario ON asignaciones_obra(id_usuario) WHERE activo = TRUE;

-- ============================================================================
-- DATOS SEMILLA: LOS 5 ROLES DEL SISTEMA (LOPSRM)
-- ============================================================================
INSERT INTO roles (nombre_rol, descripcion) VALUES
('ADMINISTRADOR', 'Gobierno de la plataforma, alta de usuarios, obras y asignación de cuadrillas'),
('RESIDENTE', 'Representante de la Dependencia convocante. Autorización técnica y financiera definitiva'),
('SUPERINTENDENTE', 'Representante técnico del Contratista. Formulación de catálogos y estimaciones'),
('SUPERVISOR', 'Supervisión técnica de campo. Captura de reportes diarios con 6 fotos y visto bueno'),
('DIRECTOR', 'Supervisión ejecutiva, tableros de control (Curva S) y fiscalización general')
ON CONFLICT (nombre_rol) DO NOTHING;
