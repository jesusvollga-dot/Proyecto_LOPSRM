# Proyecto de Obra Pública y Servicios Relacionados (LOPSRM / RLOPSRM)

Este repositorio contiene la estructura técnica, legal y operativa estandarizada para la formulación, licitación, contratación, ejecución y cierre de proyectos de obra pública en México, en estricto cumplimiento con:

* **Ley:** [Ley de Obras Públicas y Servicios Relacionados con las Mismas (LOPSRM)](file:///home/bby_jss/Descargas/LOPSRM.pdf)
* **Reglamento:** [Reglamento de la Ley de Obras Públicas y Servicios Relacionados con las Mismas (RLOPSRM)](file:///home/bby_jss/Descargas/Reg_LOPSRM.pdf)

---

## 🗺️ Mapa General del Ciclo de Vida del Proyecto



---

## 📋 Resumen de Fases y Fundamento Legal

| Fase | Directorio | Artículos Ley | Artículos Reglamento | Entregables Clave |
| :--- | :--- | :--- | :--- | :--- |
| **1. Planeación** |  | Arts. 17 - 26 | Arts. 17 - 27 | Estudios, MIA, Derechos de vía, Proyecto Ejecutivo, Presupuesto base |
| **2. Proposición** |  | Arts. 34 - 36 | Arts. 44, 45, 61, 185-220 | DA-01 a DA-06 (Legal), PT-01 a PT-09 (Técnica), PE-01 a PE-05 (Económica) |
| **3. Contratación**|  | Arts. 46 - 51 | Arts. 78 - 95 | Contrato firmado, Fianza cumplimiento (10%), Fianza anticipo (100%), Acta de sitio |
| **4. Ejecución**   |  | Arts. 52 - 63 | Arts. 96 - 163 | Bitácora BESOP, Estimaciones, Generadores, Laboratorios, Ajustes de costos |
| **5. Cierre**      |  | Arts. 64 - 66 | Arts. 164 - 173 | Acta Entrega-Recepción, Fianza vicios ocultos (10%, 12 meses), Finiquito, Extinción |

---

## 👥 Figuras Clave y Responsabilidades

1. **Área Convocante / Dependencia:** Responsable de integrar el expediente técnico, emitir la convocatoria, conducir las juntas de aclaraciones, adjudicar el contrato y autorizar pagos de estimaciones.
2. **Residente de Obra (por la convocante):** Servidor público designado con cédula profesional que representa legal y técnicamente a la dependencia en campo (Art. 112 RLOPSRM).
3. **Superintendente de Construcción (por el contratista):** Profesional técnico facultado con cédula profesional, con experiencia afín comprobable y poder amplio para tomar decisiones en sitio (Art. 115 RLOPSRM).
4. **Órgano Interno de Control / Auditoría:** Supervisión normativa del uso de recursos públicos federales y cumplimiento de los plazos reglamentarios.

Consulta las guías individuales en cada una de las 5 carpetas principales para instrucciones detalladas, checklists de validación y formatos de cálculo.

---

## 🚀 Estado de Desarrollo de la Plataforma (Metodología SCRUM)

El sistema de software implementa un ciclo de 10 Sprints bajo el marco de la LOPSRM / RLOPSRM. **Actualmente el proyecto abarca hasta el Sprint 3 completado:**

| Sprint | Épica / Alcance | Historias de Usuario | Estatus | Entregables y Pruebas |
| :--- | :--- | :--- | :---: | :--- |
| **Sprint 1** | **Autenticación y Seguridad RBAC** | HU-001 a HU-006 | ✅ Concluido | Módulo Auth/Users, 5 roles normativos, JWT, Guardias RBAC. |
| **Sprint 2** | **Gestión de Obras y Cuadrillas** | HU-007 a HU-013 | ✅ Concluido | Registro de obras, asignación de superintendente y supervisor, validaciones de anticipo (máx 30% Art. 50 LOPSRM) y fechas. |
| **Sprint 3** | **Catálogo Original e Inmutabilidad** | HU-014 a HU-019 | ✅ Concluido | Partidas, subpartidas, conceptos con clave única, cálculo automático de importes, bloqueo formal e inmutabilidad legal (Art. 59 LOPSRM). 47/47 pruebas unitarias aprobadas. |
| **Sprint 4** | **Estimaciones y Generadores** | HU-020 a HU-023 | ⏳ Siguiente | Volúmenes de obra, amortización de anticipo y 5 al millar. |

### 🛠️ Puesta en Marcha y Ejecución de Pruebas

#### Backend (NestJS + TypeORM + PostgreSQL)
```bash
cd backend
npm install
npm run test     # Ejecución de 47 pruebas unitarias automatizadas (Vitest)
npm run build    # Compilación de producción
npm run start    # Inicio del servidor API en http://localhost:3000
```

#### Frontend (React 19 + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run build    # Compilación de la SPA
npm run dev      # Servidor de desarrollo en http://localhost:5173
```

Documentación completa y formal de cada sprint disponible en los directorios:
- Sprint 1: [`01_Documentacion_Sprint_1/DOCUMENTO_ENTREGA_SPRINT_1.md`](file:///home/bby_jss/PROYECTO_LOPSRM/01_Documentacion_Sprint_1/DOCUMENTO_ENTREGA_SPRINT_1.md)
- Sprint 3: [`03_Documentacion_Sprint_3/DOCUMENTO_ENTREGA_SPRINT_3.md`](file:///home/bby_jss/PROYECTO_LOPSRM/03_Documentacion_Sprint_3/DOCUMENTO_ENTREGA_SPRINT_3.md)

