import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from './App';

const mockUserSupervisor = {
  id_usuario: 5,
  nombre_completo: 'Ing. Laura Torres (Supervisora)',
  correo_electronico: 'supervisor@lopsrm.gob.mx',
  cedula_profesional: 'CED-SUP-112233',
  id_rol: 4,
  rol: {
    id_rol: 4,
    nombre_rol: 'SUPERVISOR',
    descripcion: 'Supervisión técnica de campo',
  },
  activo: true,
  fecha_registro: '2026-01-15T00:00:00.000Z',
};

const mockObra = {
  id_obra: 101,
  clave_obra: 'OBRA-2026-CDMX-01',
  nombre_obra: 'Construcción de Puente Vehicular Eje 5',
  numero_contrato: 'DGCOP-ADU-2026-001',
  presupuesto_autorizado: 5000000,
  porcentaje_anticipo: 30,
  fecha_inicio_programada: '2026-11-01',
  fecha_termino_programada: '2027-05-30',
  estatus: 'EN_EJECUCION' as const,
  activo: true,
  asignaciones: [
    {
      id_asignacion: 1,
      id_obra: 101,
      id_usuario: 5,
      rol_en_obra: 'SUPERVISOR' as const,
      activo: true,
      usuario: mockUserSupervisor,
    },
  ],
};

const mockReporteExistente = {
  id_reporte: 1,
  id_obra: 101,
  obra: mockObra,
  id_supervisor: 5,
  supervisor: mockUserSupervisor,
  fecha_reporte: '2026-11-08',
  clima: 'Soleado',
  temperatura_celsius: 25.0,
  observaciones_clima: 'Cielo despejado sin afectación a colados',
  senalamiento_preventivo: true,
  equipo_proteccion_epp: true,
  suministro_material: true,
  estatus_personal: 'Suficiente',
  condiciones_seguridad: 'Área perimetral acordonada y pasillos despejados',
  checklist_seguridad: { senalizacion: true, extintores: true, botiquin: true, orden_limpieza: true },
  observaciones_seguridad: 'Recorrido matutino sin novedades de riesgo',
  checklist_epp: { casco: true, chaleco: true, botas: true, guantes: true, lentes: true, arnes: false },
  observaciones_epp: '100% del personal porta EPP reglamentario',
  resumen_cuadrilla: [
    { categoria: 'Cabos', cantidad: 1, descripcion: 'Control general y trazo' },
    { categoria: 'Albañiles', cantidad: 4, descripcion: 'Pegado de muros y cimbrado' },
    { categoria: 'Peones', cantidad: 6, descripcion: 'Acarreo de materiales y limpieza' },
  ],
  maquinaria_sitio: [
    { tipo: 'Retroexcavadora CAT 416', cantidad: 1, horas_uso: 7, estatus: 'Operativa' },
    { tipo: 'Camión de volteo 14m3', cantidad: 2, horas_uso: 6, estatus: 'Operativa' },
  ],
  actividades_realizadas: 'Excavación para cimentación en eje A-4 y colado de plantillas de concreto f\'c=100 kg/cm2.',
  avance_fisico_acumulado: 8.5,
  fecha_estimada_fin: '2027-05-30',
  fecha_creacion: '2026-11-08T18:00:00.000Z',
  activo: true,
  fotos: [
    { numero_foto: 1, url_archivo: 'https://storage/f1.jpg', descripcion_foto: 'Excavación zapata 1' },
  ],
  incidencias: [],
};

describe('Sprint 6: Reporte Diario de Supervisión y Bitácora (HU-034 a HU-040)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lopsrm_token', 'test-jwt-supervisor-token');
    localStorage.setItem('lopsrm_user', JSON.stringify(mockUserSupervisor));

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || 'GET';

      if (url.includes('/api/v1/auth/profile')) {
        return Promise.resolve(new Response(JSON.stringify(mockUserSupervisor), { status: 200 }));
      }

      if (url.includes('/api/v1/obras/mis-obras')) {
        return Promise.resolve(new Response(JSON.stringify([mockObra]), { status: 200 }));
      }

      if (url.includes('/api/v1/obras/candidatos')) {
        return Promise.resolve(
          new Response(JSON.stringify({ residentes: [], superintendentes: [], supervisores: [mockUserSupervisor] }), { status: 200 }),
        );
      }

      if (url.includes('/api/v1/obras') && method === 'GET') {
        return Promise.resolve(new Response(JSON.stringify([mockObra]), { status: 200 }));
      }

      // Endpoint de último reporte
      if (url.includes('/api/v1/reportes/obra/') && url.includes('/ultimo')) {
        return Promise.resolve(new Response(JSON.stringify(mockReporteExistente), { status: 200 }));
      }

      // Endpoint GET de reportes (bitácora)
      if (url.includes('/api/v1/reportes') && method === 'GET') {
        return Promise.resolve(new Response(JSON.stringify([mockReporteExistente]), { status: 200 }));
      }

      // Endpoint POST de nuevo reporte diario (HU-034 a HU-039)
      if (url.includes('/api/v1/reportes') && method === 'POST') {
        const body = JSON.parse(init.body);
        const nuevoReporte = {
          id_reporte: 2,
          ...body,
          supervisor: mockUserSupervisor,
          obra: mockObra,
        };
        return Promise.resolve(new Response(JSON.stringify(nuevoReporte), { status: 201 }));
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });
  });

  // =========================================================================
  // HU-040: Consultar bitácora diaria
  // =========================================================================
  it('HU-040: debe permitir abrir el modal de Bitácora Diaria y consultar los reportes registrados', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Buscar el botón de Bitácora Diaria en la tarjeta de obra
    const btnBitacora = await screen.findByRole('button', {
      name: /Bitácora Diaria de Supervisión/i,
    });
    expect(btnBitacora).toBeInTheDocument();

    await user.click(btnBitacora);

    // Debe abrir el modal con el título oficial de HU-040
    expect(
      await screen.findByText(/Bitácora Diaria y Reportes de Supervisión/i),
    ).toBeInTheDocument();

    // Debe mostrar el reporte precargado con su fecha, clima y actividades
    expect(screen.getByText(/2026-11-08/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Soleado/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Excavación para cimentación en eje A-4 y colado de plantillas/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/11 personas \(Suficiente\)/i)).toBeInTheDocument();
  });

  // =========================================================================
  // HU-034 a HU-039: Captura de reporte diario de supervisión
  // =========================================================================
  it('HU-034 a HU-039: el Supervisor debe poder registrar un reporte diario con clima, seguridad, EPP, personal y maquinaria', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Abrir modal de bitácora
    const btnBitacora = await screen.findByRole('button', {
      name: /Bitácora Diaria de Supervisión/i,
    });
    await user.click(btnBitacora);

    // Abrir formulario de nuevo reporte diario (HU-034)
    const btnNuevoReporte = await screen.findByRole('button', {
      name: /\+ Registrar Reporte Diario \(HU-034\)/i,
    });
    expect(btnNuevoReporte).toBeInTheDocument();
    await user.click(btnNuevoReporte);

    // Comprobar presencia de las secciones normativas del formulario
    expect(
      await screen.findByText(/1\. Datos Generales de la Jornada y Actividades Realizadas \(HU-034\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/2\. Condiciones Meteorológicas \(HU-035\)/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Condiciones de Seguridad de la Obra \(HU-036\)/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Cumplimiento de Equipo de Protección Personal - EPP \(HU-037\)/i)).toBeInTheDocument();
    expect(screen.getByText(/5\. Personal Presente en Obra y Cuadrillas \(HU-038\)/i)).toBeInTheDocument();
    expect(screen.getByText(/6\. Maquinaria y Equipo Utilizado en Sitio \(HU-039\)/i)).toBeInTheDocument();

    // Diligenciar actividades de la jornada (HU-034)
    const textareaActividades = screen.getByPlaceholderText(
      /Documente en detalle los frentes de trabajo atendidos, colados, excavaciones/i,
    );
    await user.type(textareaActividades, 'Habilitado de acero y colado de losa en zona B.');

    // Capturar avance físico acumulado mayor o igual al previo
    const inputAvance = screen.getByPlaceholderText(/Mínimo 8.5%/i);
    await user.clear(inputAvance);
    await user.type(inputAvance, '10.5');

    // Cambiar condición climática (HU-035)
    const selectClima = screen.getByDisplayValue(/☀️ Soleado/i);
    await user.selectOptions(selectClima, 'Lluvia Ligera');

    // Agregar categoría a la cuadrilla de personal (HU-038) usando catálogo con opción Otro
    const selectCategoria = screen.getByDisplayValue(/-- Seleccionar Categoría de Personal --/i);
    await user.selectOptions(selectCategoria, 'Otro (especificar)');
    const inputCategoriaOtro = screen.getByPlaceholderText(/Nombre del oficio o puesto/i);
    await user.type(inputCategoriaOtro, 'Fierreros');
    const inputCantPersonal = screen.getAllByPlaceholderText(/Cant\./i)[0];
    await user.type(inputCantPersonal, '5');

    const btnAgregarPersonal = screen.getByRole('button', { name: /\+ Agregar Personal/i });
    await user.click(btnAgregarPersonal);

    expect(screen.getByText('Fierreros')).toBeInTheDocument();
    expect(screen.getByText(/5 trabajadores/i)).toBeInTheDocument();

    // Guardar reporte diario
    const btnGuardar = screen.getByRole('button', {
      name: /Guardar Reporte Diario en Bitácora \(HU-034\)/i,
    });
    await user.click(btnGuardar);

    // Debe mostrar mensaje de confirmación
    await waitFor(() => {
      expect(
        screen.getByText(/HU-034 a HU-039: Reporte diario del día .* registrado exitosamente/i),
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // HU-040: Ver detalle pericial de reporte
  // =========================================================================
  it('HU-040: debe permitir abrir el detalle pericial de un reporte con su desglose de seguridad y cuadrilla', async () => {
    const user = userEvent.setup();
    render(<App />);

    const btnBitacora = await screen.findByRole('button', {
      name: /Bitácora Diaria de Supervisión/i,
    });
    await user.click(btnBitacora);

    // Clic en "Ver Detalle"
    const btnVerDetalle = await screen.findByRole('button', { name: /Ver Detalle/i });
    await user.click(btnVerDetalle);

    // Comprobar modal de detalle
    expect(await screen.findByText(/Reporte Diario #1 — 2026-11-08/i)).toBeInTheDocument();
    expect(screen.getByText(/🛡️ Medidas de Seguridad \(HU-036\)/i)).toBeInTheDocument();
    expect(screen.getByText(/👷 Cumplimiento de EPP \(HU-037\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal y Cuadrillas en Sitio \(HU-038\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Maquinaria y Equipo Empleado \(HU-039\)/i)).toBeInTheDocument();

    // Cerrar detalle
    const btnCerrar = screen.getByRole('button', { name: /Cerrar Detalle/i });
    await user.click(btnCerrar);
  });
});
