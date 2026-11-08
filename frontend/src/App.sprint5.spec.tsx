import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from './App';

const mockUserSuperintendente = {
  id_usuario: 10,
  nombre_completo: 'Ing. Carlos Mendoza (Superintendente)',
  correo_electronico: 'super@lopsrm.gob.mx',
  cedula_profesional: 'CED-998877',
  id_rol: 3,
  rol: {
    id_rol: 3,
    nombre_rol: 'SUPERINTENDENTE',
    descripcion: 'Superintendente de Construcción de Obra',
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
      id_usuario: 10,
      rol_en_obra: 'SUPERINTENDENTE' as const,
      activo: true,
      usuario: mockUserSuperintendente,
    },
  ],
};

const mockCatalogoOriginalBloqueado = {
  id_catalogo: 201,
  id_obra: 101,
  tipo_catalogo: 'ORIGINAL' as const,
  version: 1,
  estatus_aprobacion: 'BLOQUEADO' as const,
  fecha_bloqueo: '2026-11-01T12:00:00Z',
  bloqueado_por: 10,
  activo: true,
  partidas: [
    {
      id_partida: 301,
      id_catalogo: 201,
      codigo_partida: 'PREL',
      nombre_partida: 'TRABAJOS PRELIMINARES',
      descripcion: 'Preliminares',
      activo: true,
      subpartidas: [],
    },
  ],
  conceptos: [
    {
      id_concepto: 501,
      id_catalogo: 201,
      id_partida: 301,
      clave_concepto: 'PREL-001',
      descripcion: 'Trazo y nivelación con equipo topográfico',
      unidad_medida: 'M2',
      cantidad: 250,
      costo_directo_unitario: 120,
      importe_costo_directo: 30000,
      es_extraordinario: false,
      activo: true,
    },
  ],
};

const mockCatalogoModificado = {
  id_catalogo: 202,
  id_obra: 101,
  tipo_catalogo: 'MODIFICADO' as const,
  version: 2,
  estatus_aprobacion: 'BORRADOR' as const,
  id_catalogo_origen: 201,
  descripcion: 'Modificación autorizada por convenio de volumen 1',
  activo: true,
  partidas: [
    {
      id_partida: 302,
      id_catalogo: 202,
      codigo_partida: 'PREL',
      nombre_partida: 'TRABAJOS PRELIMINARES',
      activo: true,
      subpartidas: [],
    },
  ],
  conceptos: [
    {
      id_concepto: 502,
      id_catalogo: 202,
      id_partida: 302,
      clave_concepto: 'PREL-001',
      descripcion: 'Trazo y nivelación con equipo topográfico',
      unidad_medida: 'M2',
      cantidad: 350,
      costo_directo_unitario: 120,
      importe_costo_directo: 42000,
      es_extraordinario: false,
      id_concepto_origen: 501,
      activo: true,
    },
  ],
};

const mockConvenioVolumen = {
  id_convenio: 1,
  id_obra: 101,
  numero_convenio: 'CONV-VOL-01/2026',
  tipo_convenio: 'MODIFICATORIO_VOLUMEN' as const,
  descripcion: 'Ajuste de volúmenes en terracerías',
  fecha_firma: '2026-11-05',
  monto_adicional: 150000,
  porcentaje_variacion: 3.0,
  dias_ampliacion: 0,
  id_usuario_registro: 10,
  usuario_registro: mockUserSuperintendente,
  estatus: 'AUTORIZADO' as const,
  fecha_creacion: '2026-11-05T12:00:00Z',
  activo: true,
};

const mockHistorial = [
  {
    id_historial: 1,
    id_concepto: 502,
    id_catalogo: 202,
    id_usuario_modifica: 10,
    usuario: mockUserSuperintendente,
    fecha_modificacion: '2026-11-05T15:30:00Z',
    campo_modificado: 'cantidad',
    valor_anterior: '250',
    valor_nuevo: '350',
    justificacion: 'Ajuste de volumen según convenio 1',
    evento: 'MODIFICACION_CANTIDAD',
    concepto: {
      id_concepto: 502,
      clave_concepto: 'PREL-001',
      descripcion: 'Trazo y nivelación con equipo topográfico',
    },
  },
];

describe('Sprint 5: Catálogos Modificados, Extraordinarios y Auditoría (HU-027 a HU-033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('lopsrm_token', 'mock_jwt_token_super');
    localStorage.setItem('lopsrm_user', JSON.stringify(mockUserSuperintendente));

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      // Perfil
      if (url.includes('/api/v1/auth/profile')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserSuperintendente),
        });
      }

      // Obras del superintendente
      if (url.includes('/api/v1/obras/mis-obras')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockObra]),
        });
      }

      // Catálogo original por obra
      if (url === '/api/v1/catalogos/obra/101') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCatalogoOriginalBloqueado),
        });
      }

      // Todos los catálogos de la obra (Sprint 5)
      if (url === '/api/v1/catalogos/obra/101/todos') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockCatalogoOriginalBloqueado, mockCatalogoModificado]),
        });
      }

      // Convenios por obra
      if (url === '/api/v1/catalogos/obra/101/convenios') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockConvenioVolumen]),
        });
      }

      // Auditoría por obra
      if (url === '/api/v1/catalogos/obra/101/auditoria') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHistorial),
        });
      }

      // Catálogo específico por ID
      if (url === '/api/v1/catalogos/201') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCatalogoOriginalBloqueado),
        });
      }
      if (url === '/api/v1/catalogos/202') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCatalogoModificado),
        });
      }

      // POST crear catálogo modificado (HU-027)
      if (url === '/api/v1/catalogos/obra/101/modificado' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCatalogoModificado),
        });
      }

      // POST crear extraordinario (HU-028)
      if (url === '/api/v1/catalogos/obra/101/extraordinarios' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id_concepto: 999,
              id_catalogo: 203,
              clave_concepto: 'EXT-001',
              descripcion: 'Muro de contención imprevisto',
              unidad_medida: 'M3',
              cantidad: 30,
              costo_directo_unitario: 1500,
              es_extraordinario: true,
            }),
        });
      }

      // POST crear convenio (HU-029)
      if (url === '/api/v1/catalogos/obra/101/convenios' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConvenioVolumen),
        });
      }

      // PATCH modificar volumen concepto (HU-030/031)
      if (url.includes('/cantidad') && options?.method === 'PATCH') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockCatalogoModificado.conceptos[0],
              cantidad: body.cantidad_nueva,
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('HU-027: debe mostrar botón de Crear Catálogo Modificado cuando el original está bloqueado y abrir modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Abrir modal de catálogo
    const btnAbrir = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    await user.click(btnAbrir);

    // Verificar que aparece el botón de Crear Catálogo Modificado (HU-027)
    const btnModificado = await screen.findByRole('button', {
      name: /\+ Crear Catálogo Modificado \(HU-027\)/i,
    });
    expect(btnModificado).toBeInTheDocument();

    // Abrir modal
    await user.click(btnModificado);
    expect(screen.getByText(/HU-027: Crear Catálogo Modificado/i)).toBeInTheDocument();
    expect(screen.getByText(/Preservación del Catálogo Original/i)).toBeInTheDocument();
  });

  it('HU-028: debe abrir modal de Concepto Extraordinario y registrarlo formalmente', async () => {
    const user = userEvent.setup();
    render(<App />);

    const btnAbrir = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    await user.click(btnAbrir);

    // Botón Concepto Extraordinario (HU-028)
    const btnExtra = await screen.findByRole('button', {
      name: /\+ Concepto Extraordinario \(HU-028\)/i,
    });
    await user.click(btnExtra);

    expect(screen.getByText(/HU-028: Registrar Concepto Extraordinario/i)).toBeInTheDocument();

    // Llenar campos requeridos
    const descInput = screen.getByPlaceholderText(/Detalle de las actividades/i);
    const cantInput = screen.getByPlaceholderText('50.00');
    const puInput = screen.getByPlaceholderText('450.00');

    await user.type(descInput, 'Excavación profunda imprevista');
    await user.type(cantInput, '30');
    await user.type(puInput, '1500');

    const btnGuardar = screen.getByRole('button', { name: /Guardar Extraordinario/i });
    await user.click(btnGuardar);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/catalogos/obra/101/extraordinarios',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('HU-029: debe permitir consultar y registrar convenios de volumen', async () => {
    const user = userEvent.setup();
    render(<App />);

    const btnAbrir = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    await user.click(btnAbrir);

    // Cambiar a pestaña de Convenios (HU-029)
    const tabConvenios = await screen.findByRole('button', {
      name: /Convenios de Volumen \(HU-029\)/i,
    });
    await user.click(tabConvenios);

    // Verificar que renderiza el convenio existente
    expect(await screen.findByText('CONV-VOL-01/2026')).toBeInTheDocument();
    expect(screen.getByText(/Ajuste de volúmenes en terracerías/i)).toBeInTheDocument();

    // Abrir modal de alta de convenio
    const btnNuevoConvenio = screen.getByRole('button', {
      name: /\+ Registrar Convenio de Volumen \(HU-029\)/i,
    });
    await user.click(btnNuevoConvenio);

    expect(screen.getByText(/HU-029: Registrar Convenio de Volumen/i)).toBeInTheDocument();
  });

  it('HU-030 & HU-031: en catálogo modificado debe permitir modificar volumen y justificación', async () => {
    const user = userEvent.setup();
    render(<App />);

    const btnAbrir = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    await user.click(btnAbrir);

    // Cambiar a la versión modificada v2 en el selector
    const btnCatModificado = await screen.findByRole('button', {
      name: /MODIFICADO v2/i,
    });
    await user.click(btnCatModificado);

    // Botón Modificar Volumen en la fila del concepto
    const btnModVolumen = await screen.findByRole('button', {
      name: /Modificar Volumen/i,
    });
    await user.click(btnModVolumen);

    expect(screen.getByText(/HU-030\/031: Modificar Volumen/i)).toBeInTheDocument();

    // Ingresar nueva cantidad y justificación técnica
    const cantInput = screen.getByPlaceholderText(/Nueva cantidad autorizada/i);
    const justInput = screen.getByPlaceholderText(/Detalle el convenio, bitácora/i);

    fireEvent.change(cantInput, { target: { value: '400' } });
    await user.type(justInput, 'Aumento de volumen autorizado en bitácora nota 12');

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Modificación/i });
    await user.click(btnConfirmar);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cantidad'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('HU-032 & HU-033: debe consultar auditoría histórica inmutable con timestamp y responsable', async () => {
    const user = userEvent.setup();
    render(<App />);

    const btnAbrir = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    await user.click(btnAbrir);

    // Pestaña de Auditoría (HU-030 a HU-033)
    const tabAuditoria = await screen.findByRole('button', {
      name: /Auditoría e Historial/i,
    });
    await user.click(tabAuditoria);

    // Comprobar presencia del banner de inmutabilidad (HU-033)
    expect(
      await screen.findByText(/Trazabilidad Pericial e Historial Inmutable/i),
    ).toBeInTheDocument();

    // Comprobar presencia del registro histórico (HU-030, HU-031, HU-032)
    expect(screen.getByText('PREL-001')).toBeInTheDocument();
    expect(screen.getAllByText(/Ing. Carlos Mendoza/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ajuste de volumen según convenio 1/i)).toBeInTheDocument();
  });
});
