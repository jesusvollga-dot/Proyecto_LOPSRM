# Sistema de Control, Seguimiento y Fiscalización de Obra Pública (LOPSRM / RLOPSRM)
## Documento de Entrega Formal y Especificación de Ingeniería — Sprint 5

* **Materia:** Análisis y Diseño de Sistemas
* **Metodología de Desarrollo:** SCRUM (Ciclo de 10 Sprints)
* **Sprint Actual Entregado:** Sprint 5 — Catálogos Modificados, Conceptos Extraordinarios, Convenios de Volumen y Auditoría Inmutable
* **Épica Asociada:** Catálogos modificados extraordinarios y auditoría
* **Historias de Usuario Cubiertas:** HU-027, HU-028, HU-029, HU-030, HU-031, HU-032 y HU-033
* **Marco Legal de Referencia:** Ley de Obras Públicas y Servicios Relacionados con las Mismas (LOPSRM, Arts. 59, 65 y 67) y su Reglamento (RLOPSRM, Arts. 99, 102, 103, 104, 112 y 115)
* **Fecha de Emisión:** Noviembre 2026
* **Versión del Documento:** 1.0 (Entrega Formal Sprint 5)

---

## 📑 Índice de Contenidos

1. [Resumen Ejecutivo del Sprint 5](#1-resumen-ejecutivo-del-sprint-5)
2. [Matriz de Requerimientos e Historias de Usuario (Sprint 5)](#2-matriz-de-requerimientos-e-historias-de-usuario-sprint-5)
   - 2.1 Mapeo de Requerimientos y Criterios de Aceptación del Backlog
   - 2.2 Desglose de Tareas Técnicas por Historia de Usuario
3. [Arquitectura de Datos y Trazabilidad Histórica Inmutable](#3-arquitectura-de-datos-y-trazabilidad-histórica-inmutable)
   - 3.1 Diagrama Entidad-Relación Extendido (Convenios, Catálogos Modificados, Extraordinarios y Auditoría)
   - 3.2 Inmutabilidad de Versiones y Preservación de la Línea Base
   - 3.3 Bitácora y Auditoría Pericial (Eventos, Timestamps y Huella de Usuario)
4. [Marco Normativo LOPSRM y Reglas de Negocio](#4-marco-normativo-lopsrm-y-reglas-de-negocio)
   - 4.1 Art. 59 LOPSRM: Convenios Modificatorios y Catálogos Modificados
   - 4.2 Art. 59 Párrafo Tercero & RLOPSRM Art. 102: Conceptos Extraordinarios
   - 4.3 Art. 65 LOPSRM: Auditoría, Fiscalización e Intangibilidad del Historial
5. [Fichas Técnicas Detalladas de Historias de Usuario](#5-fichas-técnicas-detalladas-de-historias-de-usuario)
   - 5.1 HU-027: Crear catálogo modificado a partir del original (Superintendente)
   - 5.2 HU-028: Registrar conceptos extraordinarios (Superintendente)
   - 5.3 HU-029: Registrar convenios relacionados con volumen (Supervisor, Residente, Administrador)
   - 5.4 HU-030: Registrar quién realizó una modificación (Supervisor, Residente, Administrador)
   - 5.5 HU-031: Registrar fecha y hora de cada modificación (Administrador, Supervisor, Residente)
   - 5.6 HU-032: Consultar historial de modificaciones (Administrador, Residente, Supervisor)
   - 5.7 HU-033: Conservar trazabilidad histórica completa (Administrador)
6. [Implementación de Software (Backend & Frontend)](#6-implementación-de-software-backend--frontend)
   - 6.1 Backend Modular (`CatalogosModule`, NestJS + TypeORM + PostgreSQL 16)
   - 6.2 Frontend SPA (`React 19` + `Vite` + `Tailwind CSS`)
   - 6.3 Endpoints REST y Contratos de Datos
7. [Estrategia y Evidencia de Pruebas Automatizadas](#7-estrategia-y-evidencia-de-pruebas-automatizadas)
   - 7.1 Pruebas Unitarias Backend (56/56 Pruebas Aprobadas)
   - 7.2 Pruebas de Interfaz de Usuario Frontend (14/14 Pruebas Aprobadas)
   - 7.3 Verificación de Builds de Producción
8. [Conclusión y Transición al Sprint 6](#8-conclusión-y-transición-al-sprint-6)

---

## 1. Resumen Ejecutivo del Sprint 5

El **Sprint 5** da cumplimiento a una de las exigencias más estrictas de la obra pública en México: **el control de cambios contractuales y la trazabilidad de auditoría fiscal**.

Durante el ciclo de vida de una obra contratada bajo la LOPSRM, la realidad técnica en campo frecuentemente diverge del proyecto original, requiriendo:
1. **Ajustes de Volúmenes (Cantidades de Obra):** Trabajos adicionales o reducciones de volúmenes previamente contratados debidamente formalizados en Convenios Modificatorios.
2. **Conceptos Extraordinarios:** Trabajos no previstos en el catálogo original que deben registrarse con nuevos análisis de precios unitarios aprobados y no pueden alterar el catálogo original.
3. **Auditoría e Inmutabilidad Pericial:** Toda modificación de cantidades o adición de conceptos debe dejar huella digital irrefutable (identidad del usuario que operó el cambio, marca temporal del servidor con hora y fecha exacta, valor anterior, valor nuevo y justificación técnica/legal).

### Logros Centrales del Sprint 5:
* **HU-027 — Clonación Estructural Segura:** El Superintendente puede generar una nueva versión de catálogo (tipo `MODIFICADO`) derivado de un catálogo original bloqueado, clonando su jerarquía completa (partidas, subpartidas y conceptos vinculados) sin alterar en lo absoluto la línea base original.
* **HU-028 — Incorporación de Conceptos Extraordinarios:** Registro de conceptos extraordinarios con validación de partidas/subpartidas y nomenclatura normativa (`EXT-001`, `EXT-002`, etc.), etiquetados con `es_extraordinario = true`.
* **HU-029 — Registro de Convenios Modificatorios de Volumen:** Módulo especializado para formalizar convenios de volumen vinculados a la obra y catálogo, capturando número de convenio, fecha de firma, importe modificado y justificación técnica.
* **HU-030 & HU-031 — Captura Automática de Identidad y Marca Temporal:** Registro estricto del usuario ejecutor (`id_usuario`, nombre y rol) y fecha/hora consistente a nivel base de datos (`CURRENT_TIMESTAMP`) en cada ajuste.
* **HU-032 & HU-033 — Pestaña de Auditoría Inmutable y Trazabilidad:** Consulta tabular con filtros de búsqueda por concepto, usuario y justificación, con garantía de inmutabilidad (sin capacidad de edición o borrado de eventos históricos).

---

## 2. Matriz de Requerimientos e Historias de Usuario (Sprint 5)

### 2.1 Mapeo de Requerimientos y Criterios de Aceptación del Backlog

| ID | Nombre de Historia | Rol Involucrado | Descripción del Backlog | Tareas Sugeridas | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-027** | Crear catálogo modificado a partir del original | Superintendente | Como Superintendente quiero crear un catálogo modificado mediante un formulario para registrar los cambios de cantidades autorizados para la obra. | Copiar estructura base; permitir modificaciones autorizadas; relacionar con original; probar trazabilidad. | Un usuario autorizado puede crear una versión modificada sin alterar el catálogo original. |
| **HU-028** | Registrar conceptos extraordinarios | Superintendente | Como Superintendente quiero registrar conceptos extraordinarios para incorporar trabajos no contemplados en el catálogo original. | Crear formulario; validar concepto; asignar identificador; guardar extraordinario. | Se pueden registrar conceptos no contemplados originalmente. |
| **HU-029** | Registrar convenios relacionados con volumen | Supervisor, Residente, Administrador | Como Supervisor, Residente o Administrador quiero consultar convenios relacionados con modificaciones de volumen para mantener actualizada la información de la obra. | Diseñar entidad/convenio; capturar volumen; validar datos; consultar convenio. | Los convenios de volumen quedan registrados y relacionados con la obra/catálogo. |
| **HU-030** | Registrar quién realizó una modificación | Supervisor, Residente, Administrador | Como Supervisor, Residente o Administrador quiero consultar quién realizó una modificación para mantener la trazabilidad de los cambios realizados en los conceptos. | Capturar usuario de sesión; registrar evento; asociar modificación; probar auditoría. | Cada modificación registra el usuario responsable. |
| **HU-031** | Registrar fecha y hora de cada modificación | Administrador, Supervisor, Residente | Como Supervisor, Residente o Administrador quiero consultar la fecha y hora de cada modificación para mantener la trazabilidad de los cambios realizados en los conceptos. | Agregar timestamp; generar automáticamente; validar zona/consistencia; consultar historial. | Cada modificación contiene fecha y hora. |
| **HU-032** | Consultar historial de modificaciones | Administrador, Residente, Supervisor | Como Supervisor, Residente o Administrador quiero consultar el historial de modificaciones para conocer quién realizó cada cambio y cuándo se realizó. | Crear vista de auditoría; filtros; detalle de cambios; probar consulta. | Un usuario autorizado puede consultar quién modificó qué y cuándo. |
| **HU-033** | Conservar trazabilidad histórica completa | Administrador | Como Administrador quiero conservar la trazabilidad histórica de los catálogos para garantizar que las modificaciones puedan ser auditadas. | Definir eventos auditables; almacenar versiones/cambios; evitar alteración del historial; probar. | Los cambios relevantes pueden rastrearse históricamente sin perder información. |

---

## 3. Arquitectura de Datos y Trazabilidad Histórica Inmutable

### 3.1 Modelo Relacional Extendido

Se expandió el esquema de base de datos en PostgreSQL 16 con las siguientes tablas y campos clave:

```
+-------------------------------------------------------------+
|                         convenios                           |
+-------------------------------------------------------------+
| id_convenio (UUID, PK)                                      |
| id_obra (UUID, FK -> obras)                                 |
| numero_convenio (VARCHAR 50)                                |
| tipo_convenio (VARCHAR 50) -- 'VOLUMEN', 'TIEMPO', 'MONTO'  |
| fecha_firma (DATE)                                          |
| importe_modificado (NUMERIC 14,2)                           |
| dias_prorroga (INT)                                         |
| descripcion_justificacion (TEXT)                            |
| id_usuario_registro (UUID, FK -> users)                     |
| created_at (TIMESTAMP WITH TIME ZONE)                       |
+-------------------------------------------------------------+
                              | 1
                              | n
+-------------------------------------------------------------+
|                         catalogos                           |
+-------------------------------------------------------------+
| id_catalogo (UUID, PK)                                      |
| id_obra (UUID, FK -> obras)                                 |
| tipo (VARCHAR 20) -- 'ORIGINAL', 'MODIFICADO', 'EXTRAORDINARIO'
| version (INT)                                               |
| estado (VARCHAR 20) -- 'BORRADOR', 'BLOQUEADO'              |
| id_catalogo_origen (UUID, FK -> catalogos.id_catalogo, NULL)|
| id_convenio (UUID, FK -> convenios.id_convenio, NULL)       |
| descripcion (VARCHAR 255)                                   |
| created_at (TIMESTAMP WITH TIME ZONE)                       |
+-------------------------------------------------------------+
                              | 1
                              | n
+-------------------------------------------------------------+
|                         conceptos                           |
+-------------------------------------------------------------+
| id_concepto (UUID, PK)                                      |
| id_catalogo (UUID, FK -> catalogos)                         |
| id_partida / id_subpartida (UUID, FKs)                      |
| clave (VARCHAR 50)                                          |
| descripcion (TEXT)                                          |
| unidad (VARCHAR 20)                                         |
| cantidad (NUMERIC 14,4)                                     |
| precio_unitario (NUMERIC 14,2)                              |
| importe (GENERATED ALWAYS AS (cantidad * precio_unitario))  |
| es_extraordinario (BOOLEAN, DEFAULT FALSE)                  |
| id_concepto_origen (UUID, FK -> conceptos.id_concepto, NULL)|
+-------------------------------------------------------------+
                              | 1
                              | n
+-------------------------------------------------------------+
|                    historial_conceptos                      |
+-------------------------------------------------------------+
| id_historial (UUID, PK)                                     |
| id_concepto (UUID, FK -> conceptos)                         |
| id_catalogo (UUID, FK -> catalogos)                         |
| evento (VARCHAR 50) -- 'MODIFICACION_CANTIDAD', 'EXTRAORDINARIO'
| cantidad_anterior (NUMERIC 14,4)                            |
| cantidad_nueva (NUMERIC 14,4)                               |
| justificacion (TEXT)                                        |
| id_usuario (UUID, FK -> users)                              |
| created_at (TIMESTAMP WITH TIME ZONE, NOT NULL)             |
+-------------------------------------------------------------+
```

### 3.2 Inmutabilidad de Versiones (Art. 59 LOPSRM)

* El catálogo de tipo `ORIGINAL` nunca es modificado una vez alcanzado el estado `BLOQUEADO`.
* Al invocar la acción **Crear Catálogo Modificado** (HU-027):
  1. Se verifica que el catálogo origen esté debidamente `BLOQUEADO`.
  2. Se determina la nueva versión autoincrementable ($v_{n+1}$).
  3. Se replica la estructura de partidas y subpartidas, vinculando los nuevos conceptos a su homólogo original mediante `id_concepto_origen`.
  4. El nuevo catálogo nace en estado `BORRADOR`, permitiendo ajustes de volúmenes mediante justificante técnico.

### 3.3 Bitácora y Auditoría Pericial (HU-030 a HU-033)

* **Disparador de Auditoría:** Cada cambio de volumen mediante `PATCH /catalogos/:idCatalogo/conceptos/:idConcepto/cantidad` genera forzosamente un registro en `historial_conceptos`.
* **Inmutabilidad Absoluta:** La entidad `HistorialConcepto` carece de endpoints de actualización (`PUT`/`PATCH`) o eliminación (`DELETE`). Los registros son de sólo inserción (`Append-Only`).
* **Metadatos Registrados:** Clave de concepto, valor previo, valor nuevo, diferencia cuantitativa, identificador y nombre del usuario en sesión, justificación legal y timestamp con zona horaria ISO 8601.

---

## 4. Marco Normativo LOPSRM y Reglas de Negocio

### 4.1 Art. 59 LOPSRM — Convenios Modificatorios y Catálogos Modificados
> *"Las dependencias y entidades podrán, dentro de su presupuesto autorizado, bajo su responsabilidad y por razones fundadas y explícitas, modificar los contratos sobre la base de precios unitarios y mixtos en la parte correspondiente, mediante convenios... Cuando las modificaciones excedan el veinticinco por ciento del monto o del plazo pactados en el contrato, o tengan variaciones sustanciales al proyecto original... deberán formalizarse por escrito convenios modificatorios..."*

El sistema garantiza que cualquier variación en volúmenes contratados se agrupe bajo un catálogo modificado respaldado por un convenio de volumen formal (HU-029).

### 4.2 Art. 59 Párrafo Tercero & RLOPSRM Art. 102 — Conceptos Extraordinarios
> *"Si durante la ejecución de los trabajos se requiere la realización de conceptos no previstos en el catálogo original, el contratista y la dependencia o entidad pactarán nuevos precios unitarios conciliados..."*

El sistema incorpora el registro de conceptos extraordinarios (HU-028) marcándolos con la bandera `es_extraordinario = true`, requiriendo asignación formal de clave y precio unitario aprobado antes de ser autorizados.

### 4.3 Art. 65 LOPSRM — Auditoría e Intangibilidad
> *"Los órganos de control y la Secretaría de la Función Pública verificarán que las obras y servicios se apeguen a las disposiciones de esta ley... conservando constancia documental e histórica de todos los actos contractuales..."*

Cumplimiento estricto de HU-030 a HU-033: La plataforma almacena la bitácora pericial de cada intervención para fines de fiscalización por órganos de control interno (OIC) y la Auditoría Superior de la Federación (ASF).

---

## 5. Fichas Técnicas Detalladas de Historias de Usuario

### 5.1 HU-027: Crear catálogo modificado a partir del original
* **Rol:** Superintendente de Construcción.
* **Escenario Gherkin:**
  * **Dado** que una obra cuenta con un catálogo original en estado `BLOQUEADO`,
  * **Cuando** el Superintendente solicita la creación de un catálogo modificado ingresando una descripción justificativa,
  * **Entonces** el sistema clona la estructura completa de partidas, subpartidas y conceptos en un nuevo catálogo con versión incrementada, asociando `id_catalogo_origen` y dejando intacto el catálogo original.

### 5.2 HU-028: Registrar conceptos extraordinarios
* **Rol:** Superintendente de Construcción.
* **Escenario Gherkin:**
  * **Dado** un catálogo en estado `BORRADOR` (o catálogo modificado de la obra),
  * **Cuando** el Superintendente registra un concepto no contemplado con clave (ej. `EXT-001`), descripción, unidad, cantidad y precio unitario,
  * **Entonces** el sistema persiste el concepto con `es_extraordinario = true`, calcula su importe y registra el evento en la bitácora de auditoría.

### 5.3 HU-029: Registrar convenios relacionados con volumen
* **Roles:** Supervisor, Residente, Administrador.
* **Escenario Gherkin:**
  * **Dado** que se requiere formalizar modificaciones de volumen en la obra,
  * **Cuando** el usuario autorizado completa el formulario de convenio con número oficial, fecha, justificación e importe modificado,
  * **Entonces** el sistema valida y almacena el convenio enlazado a la obra y actualiza la vista de convenios consultable por el equipo fiscalizador.

### 5.4 HU-030: Registrar quién realizó una modificación
* **Roles:** Supervisor, Residente, Administrador.
* **Criterio:** Toda modificación de cantidades o catálogo captura el `user.id` extraído del JWT de sesión o contexto autenticado y lo almacena permanentemente.

### 5.5 HU-031: Registrar fecha y hora de cada modificación
* **Roles:** Administrador, Supervisor, Residente.
* **Criterio:** El backend inyecta la marca temporal de servidor mediante `CURRENT_TIMESTAMP`, asegurando consistencia horaria inmune a alteraciones del reloj cliente.

### 5.6 HU-032: Consultar historial de modificaciones
* **Roles:** Administrador, Residente, Supervisor.
* **Criterio:** La interfaz provee una pestaña de **Auditoría e Historial** con tabla filtrable en tiempo real que desglosa concepto, evento, valores previo/nuevo, usuario ejecutor, fecha y justificación.

### 5.7 HU-033: Conservar trazabilidad histórica completa
* **Rol:** Administrador.
* **Criterio:** La arquitectura de software impide la mutación o eliminación de registros de historial. Todo estado intermedio de catálogo y conceptos permanece consultable mediante el selector de versiones de catálogo.

---

## 6. Implementación de Software (Backend & Frontend)

### 6.1 Backend Modular (`CatalogosModule`, NestJS + TypeORM)

* **Entidades Creadas/Actualizadas:**
  * `backend/src/modules/catalogos/entities/convenio.entity.ts`
  * `backend/src/modules/catalogos/entities/historial-concepto.entity.ts`
  * `backend/src/modules/catalogos/entities/catalogo.entity.ts` (con `id_catalogo_origen`, `id_convenio`, `descripcion`)
  * `backend/src/modules/catalogos/entities/concepto.entity.ts` (con `es_extraordinario`, `id_concepto_origen`)
* **DTOs de Validación:**
  * `create-catalogo-modificado.dto.ts`
  * `create-concepto-extraordinario.dto.ts`
  * `create-convenio.dto.ts`
  * `modificar-cantidad.dto.ts`
* **Controlador y Endpoints REST (`/catalogos`):**
  * `POST /catalogos/obra/:idObra/modificado` (HU-027)
  * `POST /catalogos/obra/:idObra/extraordinarios` (HU-028)
  * `POST /catalogos/obra/:idObra/convenios` (HU-029)
  * `GET /catalogos/obra/:idObra/convenios` (HU-029)
  * `PATCH /catalogos/:idCatalogo/conceptos/:idConcepto/cantidad` (HU-030, HU-031, HU-033)
  * `GET /catalogos/:idCatalogo/historial` (HU-032)
  * `GET /catalogos/obra/:idObra/auditoria` (HU-032, HU-033)
  * `GET /catalogos/obra/:idObra/todos` (HU-027, HU-033)

### 6.2 Frontend SPA (`React 19` + `Vite` + `Tailwind CSS`)

* **Navegación por Pestañas en Modal de Catálogo:**
  1. `📑 Conceptos y Catálogos`: Visualización de partidas, conceptos y selector de versiones (Original v1, Modificado v2, Modificado v3, etc.).
  2. `📋 Convenios de Volumen (HU-029)`: Catálogo de convenios modificatorios formalizados y botón para registrar nuevo convenio.
  3. `🛡️ Auditoría e Historial (HU-030 a HU-033)`: Registro pericial inmutable con búsqueda reactiva, visualización de autor, fecha, valor anterior y nuevo, y justificación.
* **Modales Operativos Integrados:**
  * Modal para **Crear Catálogo Modificado** (HU-027).
  * Modal para **Registrar Concepto Extraordinario** (HU-028).
  * Modal para **Registrar Convenio Modificatorio de Volumen** (HU-029).
  * Modal para **Ajuste de Volumen de Concepto con Justificación Obligatoria** (HU-030/031).

---

## 7. Estrategia y Evidencia de Pruebas Automatizadas

### 7.1 Pruebas Unitarias Backend (Vitest)
* **Archivo de Pruebas:** `backend/src/modules/catalogos/catalogos.service.spec.ts` y demás módulos.
* **Cobertura Total de la Suite:** 6 suites de pruebas, **56 pruebas unitarias aprobadas (100% éxito)**.
* **Pruebas Específicas Sprint 5:**
  * HU-027: Creación exitosa de catálogo modificado con clonación profunda y validación de catálogo original bloqueado.
  * HU-028: Registro de conceptos extraordinarios con flag y relación a subpartida.
  * HU-029: Alta y consulta de convenios de volumen vinculados a la obra.
  * HU-030 & HU-031: Auditoría de modificación de cantidad con inserción de huella de usuario y timestamp.
  * HU-032 & HU-033: Consulta de historial por catálogo y por obra con verificación de trazabilidad inmutable.

```bash
$ npm --prefix backend run test
 ✓ src/common/guards/roles.guard.spec.ts (5 tests)
 ✓ src/app.controller.spec.ts (1 test)
 ✓ src/modules/obras/obras.service.spec.ts (14 tests)
 ✓ src/modules/catalogos/catalogos.service.spec.ts (24 tests)
 ✓ src/modules/users/users.service.spec.ts (6 tests)
 ✓ src/modules/auth/auth.service.spec.ts (6 tests)

 Test Files  6 passed (6)
      Tests  56 passed (56)
```

### 7.2 Pruebas de Interfaz de Usuario Frontend (Vitest + React Testing Library)
* **Archivos de Pruebas:**
  * `frontend/src/App.sprint3.spec.tsx` (9 pruebas regresión Sprint 3)
  * `frontend/src/App.sprint5.spec.tsx` (5 pruebas integración Sprint 5)
* **Cobertura Total Frontend:** 2 suites, **14 pruebas de integración aprobadas (100% éxito)**.
* **Validaciones Verificadas:**
  * HU-027: Botón de creación de catálogo modificado activo únicamente sobre catálogo original bloqueado.
  * HU-028: Modal de concepto extraordinario y persistencia en tabla.
  * HU-029: Pestaña de convenios, formulario modal y visualización en lista.
  * HU-030 & HU-031: Modificación de volumen con justificación técnica y registro de usuario.
  * HU-032 & HU-033: Pestaña de auditoría con banner de inmutabilidad pericial y visualización de cambios.

```bash
$ npm --prefix frontend run test
 ✓ src/App.sprint5.spec.tsx (5 tests)
 ✓ src/App.sprint3.spec.tsx (9 tests)

 Test Files  2 passed (2)
      Tests  14 passed (14)
```

### 7.3 Verificación de Builds de Producción
Se verificó la compilación limpia sin advertencias ni errores tanto en el backend NestJS como en el frontend Vite:
```bash
$ npm --prefix backend run build
> nest build (exited with code 0)

$ npm --prefix frontend run build
> tsc -b && vite build (exited with code 0)
```

---

## 8. Conclusión y Transición al Sprint 6

Con la culminación del **Sprint 5**, el sistema satisface plenamente las exigencias de gestión de variaciones contractuales y fiscalización pericial normadas por la LOPSRM:

1. **Integridad Contractual:** La línea base original permanece intocable, respetando la propuesta licitada.
2. **Flexibilidad Operativa:** El contratista y la dependencia pueden acordar volúmenes adicionales o conceptos extraordinarios con total orden jerárquico.
3. **Seguridad Jurídica:** Toda alteración cuenta con respaldo en convenio modificatorio y bitácora pericial inmutable.

El sistema queda en estado óptimo, verificado y preparado para la siguiente fase de desarrollo (**Sprint 6: Programa de Obra y Calendarización Físico-Financiera**).
