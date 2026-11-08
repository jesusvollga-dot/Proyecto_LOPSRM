import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from './App';

// Mocks de usuarios para pruebas RBAC
const mockUserAdmin = {
  id_usuario: 1,
  nombre_completo: 'Administrador del Sistema LOPSRM',
  correo_electronico: 'admin@lopsrm.gob.mx',
  cedula_profesional: 'CED-123456',
  id_rol: 1,
  rol: {
    id_rol: 1,
    nombre_rol: 'ADMINISTRADOR',
    descripcion: 'Administrador del Sistema',
  },
  activo: true,
  fecha_registro: '2026-01-01T00:00:00.000Z',
};

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

const mockCatalogoBorrador = {
  id_catalogo: 201,
  id_obra: 101,
  tipo_catalogo: 'ORIGINAL' as const,
  estatus_aprobacion: 'BORRADOR' as const,
  motivo_bloqueo: null,
  fecha_bloqueo: null,
  bloqueado_por: null,
  activo: true,
  partidas: [
    {
      id_partida: 301,
      id_catalogo: 201,
      codigo_partida: 'PREL',
      nombre_partida: 'TRABAJOS PRELIMINARES',
      descripcion: 'Actividades previas a la cimentación',
      activo: true,
      subpartidas: [
        {
          id_subpartida: 401,
          id_partida: 301,
          codigo_subpartida: 'TRAZO',
          nombre_subpartida: 'Trazo y Nivelación Topográfica',
          descripcion: null,
          activo: true,
        },
      ],
    },
  ],
  conceptos: [
    {
      id_concepto: 501,
      id_catalogo: 201,
      id_partida: 301,
      id_subpartida: 401,
      clave_concepto: 'PREL-001',
      descripcion: 'Trazo y nivelación con equipo topográfico para vialidades',
      unidad_medida: 'M2',
      cantidad: 250,
      costo_directo_unitario: 120,
      importe_costo_directo: 30000,
      activo: true,
      partida: 'TRABAJOS PRELIMINARES',
      subpartida: 'Trazo y Nivelación Topográfica',
    },
  ],
};

const mockCatalogoBloqueado = {
  ...mockCatalogoBorrador,
  estatus_aprobacion: 'BLOQUEADO' as const,
  fecha_bloqueo: '2026-10-26T18:00:00.000Z',
  bloqueado_por: 10,
  motivo_bloqueo: 'Revisión final autorizada conforme al Art. 59 LOPSRM',
};

describe('Sprint 3: Pruebas de Interfaz de Usuario (HU-014 a HU-019)', () => {
  let activeUser = mockUserAdmin;

  beforeEach(() => {
    localStorage.clear();
    activeUser = mockUserAdmin;
    localStorage.setItem('lopsrm_token', 'fake-jwt-token-sprint3');
    localStorage.setItem('lopsrm_user', JSON.stringify(activeUser));
    vi.restoreAllMocks();
  });

  const setupFetchMock = (catalogoResponse: any = mockCatalogoBorrador, customUser = mockUserAdmin) => {
    activeUser = customUser;
    localStorage.setItem('lopsrm_user', JSON.stringify(customUser));

    const fetchMock = vi.fn((url: string, options?: any) => {
      const urlStr = String(url);

      // Auth profile
      if (urlStr.includes('/api/v1/auth/profile')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => activeUser,
        } as Response);
      }

      // Users and roles
      if (urlStr.includes('/api/v1/users')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);
      }
      if (urlStr.includes('/api/v1/roles')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);
      }

      // Obras endpoints (lista general y mis-obras)
      if (urlStr.includes('/api/v1/obras')) {
        // Excluir POST /api/v1/catalogos/obra
        if (!urlStr.includes('/api/v1/catalogos/obra')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [mockObra],
          } as Response);
        }
      }

      // Endpoint de consulta y alta de catálogo por obra
      if (urlStr.includes('/api/v1/catalogos/obra/101')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: async () => mockCatalogoBorrador,
          } as Response);
        }
        if (!catalogoResponse) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: async () => ({ message: 'Catálogo no encontrado' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => catalogoResponse,
        } as Response);
      }

      // Endpoints de creación y modificación
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);
    });

    global.fetch = fetchMock;
    return fetchMock;
  };

  it('HU-014 Vista Inicial: debe mostrar botón de Catálogo Original y abrir el modal para la obra', async () => {
    setupFetchMock();
    render(<App />);

    // Verificar botón en la tarjeta de obra
    const catalogoBtn = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    expect(catalogoBtn).toBeInTheDocument();

    // Abrir modal
    fireEvent.click(catalogoBtn);

    // Verificar encabezado del modal con clave de obra y contrato
    expect(
      await screen.findByText(/Catálogo Original de Conceptos — Construcción de Puente Vehicular Eje 5/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('OBRA-2026-CDMX-01').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Contrato: DGCOP-ADU-2026-001/i).length).toBeGreaterThanOrEqual(1);
  });

  it('HU-014 Inicialización: debe mostrar opción de inicializar catálogo si no existe y crearlo en BORRADOR', async () => {
    let catalogoCreado = false;
    const fetchMock = vi.fn((url: string, options?: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/auth/profile')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockUserAdmin,
        } as Response);
      }
      if (urlStr.includes('/api/v1/users') || urlStr.includes('/api/v1/roles')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] } as Response);
      }
      if (urlStr.includes('/api/v1/obras') && !urlStr.includes('/api/v1/catalogos/obra')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [mockObra],
        } as Response);
      }
      if (urlStr.includes('/api/v1/catalogos/obra/101')) {
        if (!catalogoCreado) {
          if (options?.method === 'POST') {
            catalogoCreado = true;
            return Promise.resolve({
              ok: true,
              status: 201,
              json: async () => ({ ...mockCatalogoBorrador, partidas: [], conceptos: [] }),
            } as Response);
          }
          return Promise.resolve({
            ok: false,
            status: 404,
            json: async () => ({ message: 'No existe catálogo' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ...mockCatalogoBorrador, partidas: [], conceptos: [] }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });
    global.fetch = fetchMock;

    render(<App />);
    const catalogoBtn = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    fireEvent.click(catalogoBtn);

    // Debe mostrar banner de no inicializado
    expect(await screen.findByText(/Catálogo Original No Inicializado/i)).toBeInTheDocument();
    const initBtn = screen.getByRole('button', { name: /Inicializar Catálogo Original \(Borrador\)/i });
    expect(initBtn).toBeInTheDocument();

    // Inicializar catálogo
    fireEvent.click(initBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/catalogos/obra/101',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('HU-014 Registrar Partidas: debe abrir formulario de partida, validar campos y enviar registro', async () => {
    const fetchMock = setupFetchMock();
    const user = userEvent.setup();
    render(<App />);

    const catalogoBtn = await screen.findByRole('button', { name: /Catálogo de Conceptos/i });
    fireEvent.click(catalogoBtn);

    const addPartidaBtn = await screen.findByRole('button', { name: /\+ Registrar Partida \(HU-014\)/i });
    expect(addPartidaBtn).toBeInTheDocument();
    expect(addPartidaBtn).not.toBeDisabled();
    await user.click(addPartidaBtn);

    expect(await screen.findByText(/HU-014: Registrar Partida/i)).toBeInTheDocument();

    const codigoInput = screen.getByPlaceholderText(/EJ: PREL, CIMENT, ESTR, ALB/i);
    const nombreInput = screen.getByPlaceholderText(/EJ: Trabajos Preliminares/i);
    const descInput = screen.getByPlaceholderText(/Alcance general de los trabajos de esta partida.../i);

    await user.type(codigoInput, 'ciment');
    await user.type(nombreInput, 'Cimentación Profunda');
    await user.type(descInput, 'Zapatas, pilotes y trabes de liga');

    expect(codigoInput).toHaveValue('CIMENT');

    const submitBtn = screen.getByRole('button', { name: /Guardar Partida/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/catalogos/201/partidas',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            codigo_partida: 'CIMENT',
            nombre_partida: 'Cimentación Profunda',
            descripcion: 'Zapatas, pilotes y trabes de liga',
          }),
        }),
      );
    });
  });

  it('HU-015 Registrar Subpartidas: debe asociar una subpartida a una partida existente', async () => {
    const fetchMock = setupFetchMock();
    const user = userEvent.setup();
    render(<App />);

    const catalogoBtn = await screen.findByRole('button', { name: /Catálogo de Conceptos/i });
    fireEvent.click(catalogoBtn);

    const addSubpartidaBtn = await screen.findByRole('button', { name: /\+ Registrar Subpartida \(HU-015\)/i });
    expect(addSubpartidaBtn).not.toBeDisabled();
    await user.click(addSubpartidaBtn);

    expect(await screen.findByText(/HU-015: Registrar Subpartida/i)).toBeInTheDocument();

    const partidaSelect = screen.getByRole('combobox');
    await user.selectOptions(partidaSelect, '301');

    const codigoSubInput = screen.getByPlaceholderText(/EJ: TRAZO, DEMOL, EXCAV/i);
    const nombreSubInput = screen.getByPlaceholderText(/EJ: Trazo y Nivelación/i);

    await user.type(codigoSubInput, 'demol');
    await user.type(nombreSubInput, 'Demoliciones y Desmantelamientos');

    expect(codigoSubInput).toHaveValue('DEMOL');

    const submitBtn = screen.getByRole('button', { name: /Guardar Subpartida/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/catalogos/201/partidas/301/subpartidas',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            codigo_subpartida: 'DEMOL',
            nombre_subpartida: 'Demoliciones y Desmantelamientos',
            descripcion: undefined,
          }),
        }),
      );
    });
  });

  it('HU-016 y HU-017: Captura de conceptos con ID sugerido y cálculo reactivo en pantalla', async () => {
    const fetchMock = setupFetchMock();
    const user = userEvent.setup();
    render(<App />);

    const catalogoBtn = await screen.findByRole('button', { name: /Catálogo de Conceptos/i });
    fireEvent.click(catalogoBtn);

    const addConceptoBtn = await screen.findByRole('button', { name: /\+ Capturar Concepto \(HU-016\/017\)/i });
    expect(addConceptoBtn).not.toBeDisabled();
    await user.click(addConceptoBtn);

    expect(await screen.findByText(/HU-016 & HU-017: Capturar Concepto de Obra/i)).toBeInTheDocument();

    const sugerirBtn = screen.getByRole('button', { name: /⚡ Generar ID Automático/i });
    await user.click(sugerirBtn);

    const claveInput = screen.getByPlaceholderText(/EJ: PREL-001, CIM-ZAP-01/i);
    expect(claveInput).toHaveValue('PREL-002');

    const descInput = screen.getByPlaceholderText(/Excavación a mano para zapatas/i);
    await user.type(descInput, 'Acarreo de escombros en camión de volteo');

    const cantidadInput = screen.getByPlaceholderText('150.00');
    const punitarioInput = screen.getByPlaceholderText('345.50');

    await user.type(cantidadInput, '50');
    await user.type(punitarioInput, '200');

    expect(screen.getByText(/50 M3 ×/i)).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Guardar Concepto/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/catalogos/201/conceptos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            clave_concepto: 'PREL-002',
            descripcion: 'Acarreo de escombros en camión de volteo',
            unidad_medida: 'M3',
            cantidad: 50,
            costo_directo_unitario: 200,
            id_partida: 301,
          }),
        }),
      );
    });
  });

  it('HU-018 Bloquear Catálogo Original: modal de confirmación con advertencia de inmutabilidad legal', async () => {
    const fetchMock = setupFetchMock();
    const user = userEvent.setup();
    render(<App />);

    const catalogoBtn = await screen.findByRole('button', { name: /Catálogo de Conceptos/i });
    fireEvent.click(catalogoBtn);

    const bloquearBtn = await screen.findByRole('button', { name: /Bloquear Catálogo Original \(HU-018\)/i });
    expect(bloquearBtn).toBeInTheDocument();
    await user.click(bloquearBtn);

    expect(await screen.findByText(/HU-018: Bloquear Catálogo Original/i)).toBeInTheDocument();
    expect(screen.getByText(/ADVERTENCIA DE INMUTABILIDAD LEGAL \(LOPSRM\)/i)).toBeInTheDocument();
    expect(screen.getByText(/NO PODRÁ SER MODIFICADO DIRECTAMENTE/i)).toBeInTheDocument();

    const motivoTextarea = screen.getByDisplayValue(
      /Revisión final de proyecto ejecutivo y matriz de precios unitarios autorizada conforme a la LOPSRM./i,
    );
    expect(motivoTextarea).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar y Bloquear/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/catalogos/201/bloquear',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            motivo: 'Revisión final de proyecto ejecutivo y matriz de precios unitarios autorizada conforme a la LOPSRM.',
          }),
        }),
      );
    });
  });

  it('HU-019 Inmutabilidad Normativa: en estado BLOQUEADO, la UI deshabilita y bloquea modificaciones directas', async () => {
    setupFetchMock(mockCatalogoBloqueado);
    render(<App />);

    const catalogoBtn = await screen.findByRole('button', { name: /Catálogo de Conceptos/i });
    fireEvent.click(catalogoBtn);

    expect(await screen.findByText(/BLOQUEADO E INMUTABLE/i)).toBeInTheDocument();
    expect(
      screen.getByText(/HU-019 \/ Art\. 59 LOPSRM: Catálogo Original Inmutable y Bloqueado/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bloqueado el:/i)).toBeInTheDocument();

    const addPartidaBtn = screen.getByRole('button', { name: /\+ Registrar Partida \(HU-014\)/i });
    const addSubpartidaBtn = screen.getByRole('button', { name: /\+ Registrar Subpartida \(HU-015\)/i });
    const addConceptoBtn = screen.getByRole('button', { name: /\+ Capturar Concepto \(HU-016\/017\)/i });

    expect(addPartidaBtn).toBeDisabled();
    expect(addSubpartidaBtn).toBeDisabled();
    expect(addConceptoBtn).toBeDisabled();

    expect(screen.queryByRole('button', { name: /Bloquear Catálogo Original \(HU-018\)/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eliminar/i })).not.toBeInTheDocument();
  });

  it('HU-017 Visualización Jerárquica y Métricas: debe renderizar partidas, subpartidas, conceptos y métricas de presupuesto', async () => {
    setupFetchMock(mockCatalogoBorrador);
    render(<App />);

    const catalogoBtn = await screen.findByRole('button', { name: /Catálogo de Conceptos/i });
    fireEvent.click(catalogoBtn);

    expect(await screen.findByText('Partidas Estructuradas')).toBeInTheDocument();
    expect(screen.getByText('Conceptos Registrados')).toBeInTheDocument();
    expect(screen.getByText(/Importe Total Catálogo \(\$\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Presupuesto Contractual/i).length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('PREL')).toBeInTheDocument();
    expect(screen.getByText('TRABAJOS PRELIMINARES')).toBeInTheDocument();

    expect(screen.getByText('TRAZO')).toBeInTheDocument();
    expect(screen.getByText('Trazo y Nivelación Topográfica')).toBeInTheDocument();

    expect(screen.getByText('PREL-001')).toBeInTheDocument();
    expect(screen.getByText(/Trazo y nivelación con equipo topográfico para vialidades/i)).toBeInTheDocument();
    expect(screen.getByText('M2')).toBeInTheDocument();
    expect(screen.getByText('250.00')).toBeInTheDocument();
    expect(screen.getAllByText('$30,000.00').length).toBeGreaterThanOrEqual(1);
  });

  it('Acceso como Superintendente: puede consultar y abrir el catálogo desde su vista de obras asignadas', async () => {
    setupFetchMock(mockCatalogoBorrador, mockUserSuperintendente);
    render(<App />);

    const catalogoBtn = await screen.findByRole('button', {
      name: /Catálogo de Conceptos/i,
    });
    expect(catalogoBtn).toBeInTheDocument();

    fireEvent.click(catalogoBtn);

    expect(
      await screen.findByText(/Catálogo Original de Conceptos — Construcción de Puente Vehicular Eje 5/i),
    ).toBeInTheDocument();
    expect(screen.getByText('PREL-001')).toBeInTheDocument();
  });
});
