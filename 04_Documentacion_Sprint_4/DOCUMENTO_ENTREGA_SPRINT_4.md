# Sistema de Control, Seguimiento y Fiscalización de Obra Pública (LOPSRM / RLOPSRM)
## Documento de Entrega Formal y Especificación de Ingeniería — Sprint 4

* **Materia:** Análisis y Diseño de Sistemas
* **Metodología de Desarrollo:** SCRUM (Ciclo de 10 Sprints)
* **Sprint Entregado:** Sprint 4 — Estimaciones de Obra, Números Generadores, Amortización de Anticipo y Retenciones Legales
* **Épica Asociada:** Trámite de estimaciones y comprobación financiera
* **Historias de Usuario Cubiertas:** HU-020, HU-021, HU-022, HU-023, HU-024, HU-025 y HU-026
* **Marco Legal de Referencia:** Ley de Obras Públicas y Servicios Relacionados con las Mismas (LOPSRM, Arts. 54 y 56), Reglamento de la LOPSRM (RLOPSRM, Arts. 127 a 138 — Formulación, Aprobación y Trámite de Estimaciones), y Ley Federal de Procedimiento de Responsabilidades Hacendarias (LFPRH, Art. 191 — Derecho del 5 al millar para vigilancia y control).
* **Fecha de Emisión:** Octubre - Noviembre 2026
* **Versión del Documento:** 1.0 (Entrega Formal Sprint 4)

---

## 📑 Índice de Contenidos

1. [Resumen Ejecutivo del Sprint 4](#1-resumen-ejecutivo-del-sprint-4)
2. [Matriz de Requerimientos e Historias de Usuario (Sprint 4)](#2-matriz-de-requerimientos-e-historias-de-usuario-sprint-4)
3. [Marco Normativo LOPSRM y Reglas de Negocio Financieras](#3-marco-normativo-lopsrm-y-reglas-de-negocio-financieras)
   - 3.1 Ciclo Perentorio de Trámite y Pago (Plazo de 15 Días Naturales, Art. 54 LOPSRM)
   - 3.2 Amortización Proporcional de Anticipo (Art. 138 RLOPSRM)
   - 3.3 Retención del 5 al Millar (Supervisión, Inspección y Control)
   - 3.4 Números Generadores y Soportes Documentales (Art. 130 RLOPSRM)
4. [Arquitectura de Base de Datos (Tablas y Relaciones)](#4-arquitectura-de-base-de-datos-tablas-y-relaciones)
   - 4.1 Entidades `estimaciones` y `detalle_estimaciones`
   - 4.2 Restricciones de Integridad y Fórmulas Calculadas
5. [Fichas Técnicas de Historias de Usuario (HU-020 a HU-026)](#5-fichas-técnicas-de-historias-de-usuario-hu-020-a-hu-026)
6. [Conclusión y Transición al Sprint 5](#6-conclusión-y-transición-al-sprint-5)

---

## 1. Resumen Ejecutivo del Sprint 4

El **Sprint 4** establece el motor de gestión financiera y avance físico de la obra pública, modelando el procedimiento de pago a través de **Estimaciones de Trabajos Ejecutados**.

Bajo el régimen de la LOPSRM, la estimación no es simplemente una factura, sino un expediente técnico-contable donde el contratista (Superintendente) acredita volúmenes realmente construidos con base en números generadores, notas de bitácora y croquis, sometidos a la revisión y autorización pericial del Residente de Obra.

### Logros Centrales del Sprint 4:
* **HU-020 — Registro de Estimación de Obra:** Formulación de estimaciones ordinarias con folio correlativo, periodo de corte (fecha inicio y fecha fin), vinculación a obra y monto acumulado.
* **HU-021 — Detalle de Conceptos Ejecutados (Generadores):** Asignación de volúmenes construidos vinculados a conceptos del catálogo original o modificado, asegurando que no excedan las cantidades contractuales autorizadas.
* **HU-022 — Amortización de Anticipo al 30% (Art. 138 RLOPSRM):** Descuento automático proporcional del anticipo entregado al contratista, deduciendo exactamente el porcentaje contractual estipulado hasta su amortización total.
* **HU-023 — Retención Legal del 5 al Millar:** Aplicación estricta del 0.5% sobre el importe de la estimación antes de IVA por concepto de servicios de vigilancia, inspección y control de la Secretaría de la Contraloría / Función Pública.
* **HU-024 — Semáforo de Cumplimiento de Plazos (Art. 54 LOPSRM):** Monitoreo del plazo fatal de 15 días naturales para autorización y trámite de pago a partir de la fecha de corte.
* **HU-025 — Flujo de Aprobación Jerárquica:** Firma técnica de Superintendente, validación de Supervisor y autorización definitiva del Residente de Obra.
* **HU-026 — Balance Financiero y Saldo del Contrato:** Conciliación en tiempo real del monto contratado, importe pagado acumulado, anticipo pendiente de amortizar y saldo disponible por ejercer.

---

## 2. Matriz de Requerimientos e Historias de Usuario (Sprint 4)

| ID | Nombre de Historia | Rol Involucrado | Descripción del Requerimiento | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **HU-020** | Registro de estimación de obra | Superintendente | Formular y registrar una estimación ordinaria vinculada a la obra activa para cobro de trabajos ejecutados. | El sistema genera el folio de la estimación con sus fechas de corte y la vincula a la obra. |
| **HU-021** | Captura de volúmenes ejecutados | Superintendente | Capturar las cantidades de obra ejecutadas en el periodo por concepto de catálogo. | Las cantidades acumuladas no pueden rebasar el volumen contratado o autorizado. |
| **HU-022** | Amortización de anticipo | Superintendente / Residente | Calcular y deducir automáticamente la proporción del anticipo otorgado. | El sistema deduce el porcentaje exacto de anticipo sobre el importe sin IVA. |
| **HU-023** | Cálculo de retención del 5 al millar | Administrador / Residente | Aplicar la retención legal de 5 al millar para fiscalización gubernamental. | Se deduce el 0.5% del importe neto antes de impuestos de forma transparente. |
| **HU-024** | Semáforo de plazos legales (15 días) | Residente / Administrador | Notificar y alertar el vencimiento del periodo de revisión de 15 días naturales. | Alertas visuales con código de colores según los días transcurridos. |
| **HU-025** | Visto bueno y autorización de pago | Residente de Obra | Validar y autorizar técnicamente la estimación para su envío a finanzas. | Solo el Residente de Obra facultado puede cambiar el estatus a "Autorizada". |
| **HU-026** | Resumen y balance contractual | Residente / Director | Consultar la carátula de estimación con el balance de saldo de contrato y anticipos. | Visualización consolidada de importes brutos, retenciones, amortizaciones e importe neto a pagar. |

---

## 3. Marco Normativo LOPSRM y Reglas de Negocio Financieras

### 3.1 Ciclo Perentorio de Trámite y Pago (Art. 54 LOPSRM)
* Las estimaciones de trabajos ejecutados deben formularse con una periodicidad no mayor a un mes calendario.
* El contratista debe presentarlas a la residencia de obra dentro de los 6 días naturales siguientes a la fecha de corte.
* La residencia de obra cuenta con 15 días naturales siguientes a su recepción para resolver sobre su procedencia, autorización y trámite de pago.

### 3.2 Amortización Proporcional de Anticipo (Art. 138 RLOPSRM)
$$\text{Amortización del Periodo} = \text{Importe Bruto Estimado} \times \left(\frac{\text{Anticipo Otorgado}}{\text{Importe Total del Contrato}}\right)$$

### 3.3 Retención del 5 al Millar
$$\text{Retención 5 al millar} = \text{Importe Bruto Estimado} \times 0.005$$

---

## 4. Arquitectura de Base de Datos

```sql
CREATE TABLE IF NOT EXISTS estimaciones (
    id_estimacion SERIAL PRIMARY KEY,
    id_obra INT NOT NULL REFERENCES obras(id_obra) ON DELETE RESTRICT,
    id_superintendente INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    numero_estimacion INT NOT NULL CHECK (numero_estimacion > 0),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    fecha_corte DATE NOT NULL,
    monto_bruto NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (monto_bruto >= 0),
    amortizacion_anticipo NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (amortizacion_anticipo >= 0),
    retencion_cinco_al_millar NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (retencion_cinco_al_millar >= 0),
    otras_retenciones NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (otras_retenciones >= 0),
    subtotal_a_pagar NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    monto_total_neto NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    estatus VARCHAR(25) NOT NULL DEFAULT 'BORRADOR',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_obra_numero_estimacion UNIQUE (id_obra, numero_estimacion)
);

CREATE TABLE IF NOT EXISTS detalle_estimaciones (
    id_detalle SERIAL PRIMARY KEY,
    id_estimacion INT NOT NULL REFERENCES estimaciones(id_estimacion) ON DELETE RESTRICT,
    id_concepto INT NOT NULL REFERENCES conceptos(id_concepto) ON DELETE RESTRICT,
    cantidad_ejecutada NUMERIC(14, 2) NOT NULL CHECK (cantidad_ejecutada > 0),
    precio_unitario NUMERIC(14, 2) NOT NULL CHECK (precio_unitario >= 0),
    importe_acumulado NUMERIC(14, 2) GENERATED ALWAYS AS (cantidad_ejecutada * precio_unitario) STORED,
    CONSTRAINT uq_estimacion_concepto UNIQUE (id_estimacion, id_concepto)
);
```

---

## 5. Conclusión y Transición al Sprint 5

Con el **Sprint 4**, la plataforma garantiza el control físico-financiero de las obras contratadas, dotando al Residente y a las dependencias de herramientas para fiscalizar el destino de los recursos públicos, amortizar debidamente los anticipos y salvaguardar los derechos de retención fiscal. Esta base permitió en el Sprint 5 habilitar la gestión de convenios modificatorios de volumen y conceptos extraordinarios.
