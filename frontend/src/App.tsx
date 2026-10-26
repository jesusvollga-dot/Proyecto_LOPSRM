import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  UserCheck,
  AlertCircle,
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  Award,
  LogOut,
  Clock,
  CheckCircle,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  PlusCircle,
  HardHat,
  FolderKanban,
  CheckSquare,
  FileText,
  Scale,
  Landmark,
  ShieldCheck,
  X,
  FileSpreadsheet,
  Layers,
  Hash,
  AlertTriangle,
} from 'lucide-react';

interface Role {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
}

interface UserProfile {
  id_usuario: number;
  nombre_completo: string;
  correo_electronico: string;
  cedula_profesional?: string;
  id_rol?: number | null;
  rol?: Role | null;
  activo: boolean;
  fecha_registro: string;
}

interface Asignacion {
  id_asignacion: number;
  id_obra: number;
  id_usuario: number;
  rol_en_obra: 'RESIDENTE' | 'SUPERINTENDENTE' | 'SUPERVISOR';
  activo: boolean;
  usuario?: UserProfile;
}

interface Obra {
  id_obra: number;
  clave_obra: string;
  nombre_obra: string;
  numero_contrato: string;
  presupuesto_autorizado: number;
  porcentaje_anticipo: number;
  fecha_inicio_programada: string;
  fecha_termino_programada: string;
  estatus: 'EN_EJECUCION' | 'SUSPENDIDA' | 'TERMINADA' | 'FINIQUITADA';
  activo: boolean;
  asignaciones?: Asignacion[];
}

interface CandidatosCuadrilla {
  residentes: UserProfile[];
  superintendentes: UserProfile[];
  supervisores: UserProfile[];
}

// ============================================================================
// Sprint 3: Catálogo Original (HU-014 a HU-019)
// ============================================================================
interface SubpartidaItem {
  id_subpartida: number;
  id_partida: number;
  codigo_subpartida: string;
  nombre_subpartida: string;
  descripcion?: string | null;
  activo: boolean;
}

interface PartidaItem {
  id_partida: number;
  id_catalogo: number;
  codigo_partida: string;
  nombre_partida: string;
  descripcion?: string | null;
  activo: boolean;
  subpartidas?: SubpartidaItem[];
}

interface ConceptoItem {
  id_concepto: number;
  id_catalogo: number;
  id_partida?: number | null;
  id_subpartida?: number | null;
  partida: string;
  subpartida?: string | null;
  clave_concepto: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: number;
  costo_directo_unitario: number;
  importe_costo_directo?: number;
  porcentaje_incidencia?: number;
  activo: boolean;
}

interface CatalogoItem {
  id_catalogo: number;
  id_obra: number;
  tipo_catalogo: 'ORIGINAL' | 'MODIFICADO' | 'EXTRAORDINARIO';
  version: number;
  estatus_aprobacion: 'BORRADOR' | 'AUTORIZADO' | 'BLOQUEADO';
  fecha_bloqueo?: string | null;
  bloqueado_por?: number | null;
  usuario_bloqueo?: UserProfile | null;
  fecha_creacion: string;
  activo: boolean;
  partidas?: PartidaItem[];
  conceptos?: ConceptoItem[];
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lopsrm_token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('lopsrm_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin Dashboard state
  const [adminTab, setAdminTab] = useState<'pending' | 'all' | 'roles' | 'obras'>('obras');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [pendingList, setPendingList] = useState<UserProfile[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserProfile | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(3);
  const [activateOnAssign, setActivateOnAssign] = useState<boolean>(true);
  const [adminActionMsg, setAdminActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sprint 2: Obras state
  const [obrasList, setObrasList] = useState<Obra[]>([]);
  const [myWorksList, setMyWorksList] = useState<Obra[]>([]);
  const [candidatos, setCandidatos] = useState<CandidatosCuadrilla>({
    residentes: [],
    superintendentes: [],
    supervisores: [],
  });
  const [isCreateObraModalOpen, setIsCreateObraModalOpen] = useState(false);
  const [selectedObraForCuadrilla, setSelectedObraForCuadrilla] = useState<Obra | null>(null);

  // Sprint 3: Catálogo Original state (HU-014 a HU-019)
  const [selectedObraForCatalogo, setSelectedObraForCatalogo] = useState<Obra | null>(null);
  const [catalogoActual, setCatalogoActual] = useState<CatalogoItem | null>(null);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [catalogoMsg, setCatalogoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modales Sprint 3
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [isSubpartidaModalOpen, setIsSubpartidaModalOpen] = useState(false);
  const [isConceptoModalOpen, setIsConceptoModalOpen] = useState(false);
  const [isBloquearModalOpen, setIsBloquearModalOpen] = useState(false);

  // Formulario Partida (HU-014)
  const [codigoPartida, setCodigoPartida] = useState('');
  const [nombrePartida, setNombrePartida] = useState('');
  const [descPartida, setDescPartida] = useState('');

  // Formulario Subpartida (HU-015)
  const [selectedPartidaId, setSelectedPartidaId] = useState<number | ''>('');
  const [codigoSubpartida, setCodigoSubpartida] = useState('');
  const [nombreSubpartida, setNombreSubpartida] = useState('');
  const [descSubpartida, setDescSubpartida] = useState('');

  // Formulario Concepto (HU-016 y HU-017)
  const [conceptoPartidaId, setConceptoPartidaId] = useState<number | ''>('');
  const [conceptoSubpartidaId, setConceptoSubpartidaId] = useState<number | ''>('');
  const [claveConcepto, setClaveConcepto] = useState('');
  const [descConcepto, setDescConcepto] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('M3');
  const [cantidadConcepto, setCantidadConcepto] = useState<number | ''>('');
  const [punitarioConcepto, setPunitarioConcepto] = useState<number | ''>('');

  // Bloqueo (HU-018)
  const [motivoBloqueo, setMotivoBloqueo] = useState(
    'Revisión final de proyecto ejecutivo y matriz de precios unitarios autorizada conforme a la LOPSRM.',
  );

  // Formulario Alta de Obra (HU-007, HU-008, HU-009)
  const [claveObra, setClaveObra] = useState('');
  const [nombreObra, setNombreObra] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [presupuestoAutorizado, setPresupuestoAutorizado] = useState<number | ''>('');
  const [porcentajeAnticipo, setPorcentajeAnticipo] = useState<number>(30);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaTermino, setFechaTermino] = useState('');

  // Modal para Avisos Legales, Términos y Normatividad CDMX
  const [legalModalContent, setLegalModalContent] = useState<
    'terminos' | 'privacidad' | 'licencias' | 'normatividad' | 'contraloria' | null
  >(null);

  // Fecha actual en formato YYYY-MM-DD para validación de fechas pasadas
  const todayStr = new Date().toISOString().split('T')[0];

  // Logout handler
  const handleLogout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('lopsrm_token');
    localStorage.removeItem('lopsrm_user');
  }, []);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem('lopsrm_user', JSON.stringify(data));
      } else {
        handleLogout();
      }
    } catch {
      // Servidor no disponible
    }
  }, [token, handleLogout]);

  // Fetch admin data
  const fetchAdminData = useCallback(async () => {
    if (!token) return;
    try {
      const [usersRes, pendingRes, rolesRes] = await Promise.all([
        fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/users/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/users/roles', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) setUsersList(await usersRes.json());
      if (pendingRes.ok) setPendingList(await pendingRes.json());
      if (rolesRes.ok) setRolesList(await rolesRes.json());
    } catch {
      console.error('Error al cargar datos administrativos');
    }
  }, [token]);

  // Fetch obras data (Sprint 2)
  const fetchObrasData = useCallback(async () => {
    if (!token) return;
    try {
      const [obrasRes, candRes] = await Promise.all([
        fetch('/api/v1/obras', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/obras/candidatos', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (obrasRes.ok) setObrasList(await obrasRes.json());
      if (candRes.ok) setCandidatos(await candRes.json());
    } catch {
      console.error('Error al cargar datos de obras');
    }
  }, [token]);

  // Fetch my works (HU-013)
  const fetchMyWorks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/obras/mis-obras', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyWorksList(await res.json());
    } catch {
      console.error('Error al consultar mis obras asignadas');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  useEffect(() => {
    if (token && currentUser) {
      if (currentUser.rol?.nombre_rol === 'ADMINISTRADOR') {
        fetchAdminData();
        fetchObrasData();
      } else {
        fetchMyWorks();
      }
    }
  }, [token, currentUser, fetchAdminData, fetchObrasData, fetchMyWorks]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo_electronico: email, contrasena: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      setToken(data.access_token);
      setCurrentUser(data.usuario);
      localStorage.setItem('lopsrm_token', data.access_token);
      localStorage.setItem('lopsrm_user', JSON.stringify(data.usuario));
      setAuthError(null);
    } catch {
      setAuthError('No se pudo conectar al servidor backend');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: fullName,
          correo_electronico: email,
          contrasena: password,
          cedula_profesional: cedula || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || 'Error en el registro');
        setLoading(false);
        return;
      }

      setAuthSuccess(data.mensaje);
      setFullName('');
      setCedula('');
      setAuthMode('login');
    } catch {
      setAuthError('Error de comunicación con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserForRole) return;
    setLoading(true);
    setAdminActionMsg(null);

    try {
      const res = await fetch(`/api/v1/users/${selectedUserForRole.id_usuario}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_rol: selectedRoleId,
          activo: activateOnAssign,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAdminActionMsg({ type: 'error', text: data.message || 'Error al asignar rol' });
      } else {
        setAdminActionMsg({
          type: 'success',
          text: `Rol ${data.rol?.nombre_rol} asignado exitosamente a ${data.nombre_completo}.`,
        });
        setSelectedUserForRole(null);
        fetchAdminData();
        fetchObrasData();
      }
    } catch {
      setAdminActionMsg({ type: 'error', text: 'Error al procesar solicitud' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    try {
      const res = await fetch(`/api/v1/users/${user.id_usuario}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !user.activo }),
      });

      if (res.ok) {
        fetchAdminData();
        fetchObrasData();
      }
    } catch {
      console.error('Error al actualizar estatus');
    }
  };

  // Registro de Nueva Obra Pública (Conforme a la LOPSRM / LOPDF)
  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAdminActionMsg(null);

    // Validación de anticipo máximo del 30%
    const anticipoNum = Number(porcentajeAnticipo);
    if (isNaN(anticipoNum) || anticipoNum < 0 || anticipoNum > 30) {
      setAdminActionMsg({
        type: 'error',
        text: 'El porcentaje de anticipo debe situarse entre el 0% y el 30% del total de la obra.',
      });
      setLoading(false);
      return;
    }

    // Validación de fecha de inicio (no fechas pasadas)
    if (fechaInicio < todayStr) {
      setAdminActionMsg({
        type: 'error',
        text: 'Inconsistencia en fechas: La fecha de inicio programada no puede ser una fecha pasada (anterior a la fecha actual).',
      });
      setLoading(false);
      return;
    }

    // Validación de secuencia temporal
    if (fechaTermino < fechaInicio) {
      setAdminActionMsg({
        type: 'error',
        text: 'Inconsistencia en fechas: La fecha de término programada no puede ser anterior a la fecha de inicio programada.',
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/obras', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clave_obra: claveObra,
          nombre_obra: nombreObra,
          numero_contrato: numeroContrato,
          presupuesto_autorizado: Number(presupuestoAutorizado),
          porcentaje_anticipo: Number(porcentajeAnticipo),
          fecha_inicio_programada: fechaInicio,
          fecha_termino_programada: fechaTermino,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAdminActionMsg({ type: 'error', text: data.message || 'Error al registrar obra' });
      } else {
        setAdminActionMsg({
          type: 'success',
          text: `Obra '${data.nombre_obra}' (${data.clave_obra}) registrada exitosamente.`,
        });
        setIsCreateObraModalOpen(false);
        // Reset form
        setClaveObra('');
        setNombreObra('');
        setNumeroContrato('');
        setPresupuestoAutorizado('');
        setPorcentajeAnticipo(30);
        setFechaInicio('');
        setFechaTermino('');
        setAdminTab('obras');
        // Visualización inmediata sin recargar
        setObrasList((prev) => [data, ...prev.filter((o) => o.id_obra !== data.id_obra)]);
        setMyWorksList((prev) => [data, ...prev.filter((o) => o.id_obra !== data.id_obra)]);
        await fetchObrasData();
        await fetchMyWorks();
      }
    } catch {
      setAdminActionMsg({ type: 'error', text: 'Error al conectar con la API de obras' });
    } finally {
      setLoading(false);
    }
  };

  // HU-010, HU-011, HU-012: Asignar miembro de cuadrilla a una obra
  const handleAssignCuadrillaMember = async (
    idObra: number,
    idUsuario: number,
    rolEnObra: 'RESIDENTE' | 'SUPERINTENDENTE' | 'SUPERVISOR',
  ) => {
    if (!idUsuario) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/obras/${idObra}/asignar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_usuario: idUsuario,
          rol_en_obra: rolEnObra,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdminActionMsg({ type: 'error', text: data.message || 'Error al asignar cuadrilla' });
      } else {
        setAdminActionMsg({
          type: 'success',
          text: `Asignación de ${rolEnObra} actualizada exitosamente.`,
        });
        fetchObrasData();
        // Update selected obra modal state
        setSelectedObraForCuadrilla(data);
      }
    } catch {
      setAdminActionMsg({ type: 'error', text: 'Error al asignar figura operativa' });
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estatus de obra
  const handleToggleObraStatus = async (obra: Obra) => {
    const nuevoEstatus = obra.estatus === 'EN_EJECUCION' ? 'SUSPENDIDA' : 'EN_EJECUCION';
    try {
      const res = await fetch(`/api/v1/obras/${obra.id_obra}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estatus: nuevoEstatus }),
      });
      if (res.ok) {
        fetchObrasData();
      }
    } catch {
      console.error('Error al actualizar estatus de obra');
    }
  };

  // =========================================================================
  // Sprint 3: Handlers de Catálogo Original (HU-014 a HU-019)
  // =========================================================================

  // Cargar catálogo original activo por obra
  const fetchCatalogoPorObra = useCallback(async (idObra: number) => {
    if (!token) return;
    setLoadingCatalogo(true);
    setCatalogoMsg(null);
    try {
      const res = await fetch(`/api/v1/catalogos/obra/${idObra}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCatalogoActual(data);
      } else if (res.status === 404) {
        setCatalogoActual(null);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al consultar catálogo.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de conexión al cargar catálogo.' });
    } finally {
      setLoadingCatalogo(false);
    }
  }, [token]);

  const openCatalogoModal = (obra: Obra) => {
    setSelectedObraForCatalogo(obra);
    setCatalogoMsg(null);
    fetchCatalogoPorObra(obra.id_obra);
  };

  // Crear catálogo original en borrador
  const handleCrearCatalogoOriginal = async () => {
    if (!token || !selectedObraForCatalogo) return;
    setLoadingCatalogo(true);
    try {
      const res = await fetch(`/api/v1/catalogos/obra/${selectedObraForCatalogo.id_obra}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCatalogoActual(data);
        setCatalogoMsg({ type: 'success', text: 'Catálogo original inicializado en estado BORRADOR.' });
        fetchCatalogoPorObra(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'No se pudo crear el catálogo.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de conexión al inicializar catálogo.' });
    } finally {
      setLoadingCatalogo(false);
    }
  };

  // HU-014: Registrar partida
  const handleCrearPartida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !catalogoActual) return;
    try {
      const res = await fetch(`/api/v1/catalogos/${catalogoActual.id_catalogo}/partidas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo_partida: codigoPartida.trim().toUpperCase(),
          nombre_partida: nombrePartida.trim(),
          descripcion: descPartida.trim() || undefined,
        }),
      });
      if (res.ok) {
        setCodigoPartida('');
        setNombrePartida('');
        setDescPartida('');
        setIsPartidaModalOpen(false);
        setCatalogoMsg({ type: 'success', text: 'HU-014: Partida registrada exitosamente en el catálogo original.' });
        if (selectedObraForCatalogo) fetchCatalogoPorObra(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al registrar partida.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de red al registrar partida.' });
    }
  };

  // HU-015: Registrar subpartida
  const handleCrearSubpartida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !catalogoActual || !selectedPartidaId) return;
    try {
      const res = await fetch(
        `/api/v1/catalogos/${catalogoActual.id_catalogo}/partidas/${selectedPartidaId}/subpartidas`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            codigo_subpartida: codigoSubpartida.trim().toUpperCase(),
            nombre_subpartida: nombreSubpartida.trim(),
            descripcion: descSubpartida.trim() || undefined,
          }),
        },
      );
      if (res.ok) {
        setCodigoSubpartida('');
        setNombreSubpartida('');
        setDescSubpartida('');
        setSelectedPartidaId('');
        setIsSubpartidaModalOpen(false);
        setCatalogoMsg({ type: 'success', text: 'HU-015: Subpartida asociada a la partida correctamente.' });
        if (selectedObraForCatalogo) fetchCatalogoPorObra(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al registrar subpartida.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de red al registrar subpartida.' });
    }
  };

  // HU-016: Sugerir ID / Clave única de concepto
  const handleSugerirClave = (partidaId: number | '') => {
    if (!partidaId || !catalogoActual) return;
    const partidaObj = catalogoActual.partidas?.find((p) => p.id_partida === Number(partidaId));
    const prefix = partidaObj?.codigo_partida || 'CONC';
    const totalEnPartida = (catalogoActual.conceptos || []).filter(
      (c) => c.id_partida === Number(partidaId),
    ).length;
    const sugerida = `${prefix}-${String(totalEnPartida + 1).padStart(3, '0')}`;
    setClaveConcepto(sugerida);
  };

  // HU-016 y HU-017: Capturar Concepto
  const handleCrearConcepto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !catalogoActual) return;
    try {
      const payload: any = {
        clave_concepto: claveConcepto.trim().toUpperCase(),
        descripcion: descConcepto.trim(),
        unidad_medida: unidadMedida.trim().toUpperCase(),
        cantidad: Number(cantidadConcepto),
        costo_directo_unitario: Number(punitarioConcepto),
      };
      if (conceptoPartidaId) payload.id_partida = Number(conceptoPartidaId);
      if (conceptoSubpartidaId) payload.id_subpartida = Number(conceptoSubpartidaId);

      const res = await fetch(`/api/v1/catalogos/${catalogoActual.id_catalogo}/conceptos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setClaveConcepto('');
        setDescConcepto('');
        setCantidadConcepto('');
        setPunitarioConcepto('');
        setConceptoSubpartidaId('');
        setIsConceptoModalOpen(false);
        setCatalogoMsg({
          type: 'success',
          text: 'HU-016/HU-017: Concepto guardado con ID único e importe calculado automáticamente.',
        });
        if (selectedObraForCatalogo) fetchCatalogoPorObra(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al guardar concepto.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de red al guardar concepto.' });
    }
  };

  // HU-018: Bloquear catálogo original
  const handleBloquearCatalogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !catalogoActual) return;
    try {
      const res = await fetch(`/api/v1/catalogos/${catalogoActual.id_catalogo}/bloquear`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo: motivoBloqueo }),
      });
      if (res.ok) {
        setIsBloquearModalOpen(false);
        setCatalogoMsg({
          type: 'success',
          text: 'HU-018: Catálogo original finalizado y BLOQUEADO formalmente. Se impiden modificaciones directas (HU-019).',
        });
        if (selectedObraForCatalogo) fetchCatalogoPorObra(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al bloquear catálogo.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de red al bloquear catálogo.' });
    }
  };

  // HU-019: Intento de desactivar/modificar (validación y rechazo si bloqueado)
  const handleDesactivarConcepto = async (idConcepto: number) => {
    if (!token || !catalogoActual) return;
    if (catalogoActual.estatus_aprobacion === 'BLOQUEADO') {
      setCatalogoMsg({
        type: 'error',
        text: 'HU-019: ACCIÓN DENEGADA. El catálogo original está BLOQUEADO conforme al Art. 59 LOPSRM. Se rechaza cualquier modificación directa.',
      });
      return;
    }
    if (!confirm('¿Desea desactivar este concepto del catálogo original?')) return;
    try {
      const res = await fetch(
        `/api/v1/catalogos/${catalogoActual.id_catalogo}/conceptos/${idConcepto}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setCatalogoMsg({ type: 'success', text: 'Concepto desactivado correctamente.' });
        if (selectedObraForCatalogo) fetchCatalogoPorObra(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al eliminar concepto.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de red al eliminar concepto.' });
    }
  };

  // Helper para insignias de roles
  const getRoleBadge = (roleName?: string | null) => {
    switch (roleName) {
      case 'ADMINISTRADOR':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'RESIDENTE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SUPERINTENDENTE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SUPERVISOR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DIRECTOR':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_EJECUCION':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SUSPENDIDA':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'TERMINADA':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'FINIQUITADA':
        return 'bg-slate-200 text-slate-700 border-slate-400';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  // Anticipo preview calculation
  const calculatedAnticipo =
    typeof presupuestoAutorizado === 'number' && presupuestoAutorizado > 0
      ? (presupuestoAutorizado * porcentajeAnticipo) / 100
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight block">
                SISTEMA DE CONTROL DE OBRA PÚBLICA
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                Plataforma Digital de Control, Seguimiento y Fiscalización de Obra Pública • CDMX
              </span>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <span className="text-sm font-semibold block">{currentUser.nombre_completo}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block border ${getRoleBadge(
                    currentUser.rol?.nombre_rol,
                  )}`}
                >
                  {currentUser.rol?.nombre_rol || 'SIN ROL'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 text-sm"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center text-xs bg-emerald-900/50 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                Backend Activo en Puerto 3000
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!currentUser ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto my-8">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-4 text-sm font-semibold text-center transition ${
                    authMode === 'login'
                      ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-4 text-sm font-semibold text-center transition ${
                    authMode === 'register'
                      ? 'bg-white text-emerald-700 border-b-2 border-emerald-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Registro (US-01)
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {authError && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <strong className="font-semibold block">Aviso del Sistema:</strong>
                      <span>{authError}</span>
                    </div>
                  </div>
                )}

                {authSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <strong className="font-semibold block">Registro Exitoso:</strong>
                      <span>{authSuccess}</span>
                    </div>
                  </div>
                )}

                {authMode === 'login' ? (
                  <div>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          Correo Electrónico
                        </label>
                        <div className="relative">
                          <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@dominio.mx"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                          Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {loading ? <span>Autenticando...</span> : <span>Ingresar al Sistema</span>}
                      </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wider text-center">
                        Accesos de Prueba Rápida
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail('admin@lopsrm.gob.mx');
                            setPassword('AdminLOPSRM2026!');
                          }}
                          className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium text-left transition border border-slate-200"
                        >
                          <div className="font-bold flex items-center text-purple-700">
                            <Shield className="w-3.5 h-3.5 mr-1" /> Admin Maestro
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">admin@lopsrm.gob.mx</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEmail('roberto.valdes@empresa.mx');
                            setPassword('ClaveSuperint2026!');
                          }}
                          className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium text-left transition border border-slate-200"
                        >
                          <div className="font-bold flex items-center text-amber-700">
                            <Award className="w-3.5 h-3.5 mr-1" /> Superintendente
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">roberto.valdes@...</div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                      <strong>⚖️ Normativa LOPSRM (RF-01):</strong> Los nuevos usuarios se crean en estado{' '}
                      <span className="font-bold underline">inactivo</span>. El Administrador validará su cédula y
                      asignará su rol antes de que pueda iniciar sesión.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ing. Laura Torres Vega"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="laura.torres@constructora.mx"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Cédula Profesional (Obligatoria para Terna en Sprint 2)
                      </label>
                      <div className="relative">
                        <Award className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={cedula}
                          onChange={(e) => setCedula(e.target.value)}
                          placeholder="CED-7491023"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Contraseña (mínimo 8 caracteres)
                      </label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
                    >
                      {loading ? 'Registrando...' : 'Solicitar Registro de Cuenta'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : currentUser.rol?.nombre_rol === 'ADMINISTRADOR' ? (
          /* ========================================================================= */
          /* ADMINISTRATOR DASHBOARD (SPRINT 1: RBAC + SPRINT 2: GESTIÓN DE OBRAS)     */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Obras Activas
                  </span>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{obrasList.length}</div>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Usuarios
                  </span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{usersList.length}</div>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pendientes Aprobación
                  </span>
                  <div className="text-2xl font-bold text-amber-600 mt-1">{pendingList.length}</div>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Presupuesto Contratado
                  </span>
                  <div className="text-base font-bold text-slate-900 mt-1 truncate">
                    {formatMoney(
                      obrasList.reduce((acc, o) => acc + Number(o.presupuesto_autorizado), 0),
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Notification Banner */}
            {adminActionMsg && (
              <div
                className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
                  adminActionMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span>{adminActionMsg.text}</span>
                <button
                  onClick={() => setAdminActionMsg(null)}
                  className="text-xs font-semibold hover:underline"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Main Tabs Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAdminTab('obras')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                      adminTab === 'obras'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Gestión de Obras y Contratos</span>
                    {obrasList.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-white text-emerald-800 text-xs flex items-center justify-center font-bold">
                        {obrasList.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setAdminTab('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                      adminTab === 'pending'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Pendientes de Aprobación</span>
                    {pendingList.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                        {pendingList.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setAdminTab('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      adminTab === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos los Usuarios
                  </button>

                  <button
                    onClick={() => setAdminTab('roles')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      adminTab === 'roles'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Catálogo de Roles (LOPSRM)
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  {adminTab === 'obras' && (
                    <button
                      onClick={() => setIsCreateObraModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Registrar Nueva Obra Pública</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      fetchAdminData();
                      fetchObrasData();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    Actualizar
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Tab: Obras Públicas (Sprint 2) */}
                {adminTab === 'obras' && (
                  <div>
                    {obrasList.length === 0 ? (
                      <div className="text-center py-16 text-slate-400">
                        <Building2 className="w-14 h-14 mx-auto text-slate-300 mb-3" />
                        <h4 className="font-bold text-slate-700 text-base">No hay obras registradas aún</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                          Comienza registrando tu primer contrato de obra pública con su presupuesto y fechas
                          contractuales.
                        </p>
                        <button
                          onClick={() => setIsCreateObraModalOpen(true)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition inline-flex items-center space-x-1.5"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Dar de Alta Primera Obra Pública</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {obrasList.map((obra) => {
                          const resAsig = obra.asignaciones?.find((a) => a.rol_en_obra === 'RESIDENTE');
                          const supAsig = obra.asignaciones?.find((a) => a.rol_en_obra === 'SUPERINTENDENTE');
                          const visAsig = obra.asignaciones?.find((a) => a.rol_en_obra === 'SUPERVISOR');

                          return (
                            <div
                              key={obra.id_obra}
                              className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-white transition shadow-sm space-y-4"
                            >
                              {/* Top Bar of Card */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-white font-semibold">
                                      {obra.clave_obra}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">
                                      Contrato: {obra.numero_contrato}
                                    </span>
                                    <span
                                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                                        obra.estatus,
                                      )}`}
                                    >
                                      {obra.estatus}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-900 mt-1">{obra.nombre_obra}</h3>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openCatalogoModal(obra)}
                                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center space-x-1 shadow-sm"
                                    title="Consultar y estructurar el catálogo de conceptos del contrato"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    <span>Catálogo Original (Sprint 3)</span>
                                  </button>

                                  <button
                                    onClick={() => setSelectedObraForCuadrilla(obra)}
                                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center space-x-1 shadow-sm"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Gestionar Cuadrilla (Terna)</span>
                                  </button>

                                  <button
                                    onClick={() => handleToggleObraStatus(obra)}
                                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                      obra.estatus === 'EN_EJECUCION'
                                        ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {obra.estatus === 'EN_EJECUCION' ? 'Suspender Obra' : 'Reanudar Obra'}
                                  </button>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                  <div className="text-slate-400 font-medium uppercase tracking-wider flex items-center">
                                    <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Presupuesto y Anticipo Contractual
                                  </div>
                                  <div className="text-sm font-bold text-slate-900 mt-1">
                                    {formatMoney(Number(obra.presupuesto_autorizado))}
                                  </div>
                                  <div className="text-slate-500 text-[11px] mt-0.5">
                                    Anticipo ({obra.porcentaje_anticipo}%):{' '}
                                    <strong>
                                      {formatMoney(
                                        (Number(obra.presupuesto_autorizado) * Number(obra.porcentaje_anticipo)) / 100,
                                      )}
                                    </strong>
                                  </div>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                  <div className="text-slate-400 font-medium uppercase tracking-wider flex items-center">
                                    <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> Periodo de Ejecución Programado
                                  </div>
                                  <div className="text-sm font-bold text-slate-900 mt-1">
                                    {obra.fecha_inicio_programada} al {obra.fecha_termino_programada}
                                  </div>
                                  <div className="text-slate-500 text-[11px] mt-0.5">
                                    Ejecución programada formalizada
                                  </div>
                                </div>

                                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                  <div className="text-slate-400 font-medium uppercase tracking-wider flex items-center">
                                    <HardHat className="w-3.5 h-3.5 mr-1 text-amber-600" /> Terna Técnica Reglamentaria
                                  </div>
                                  <div className="mt-1 space-y-1 text-[11px]">
                                    <div className="truncate">
                                      <span className="font-semibold text-blue-700">Residente:</span>{' '}
                                      {resAsig?.usuario?.nombre_completo || (
                                        <span className="text-rose-500 italic">Sin asignar</span>
                                      )}
                                    </div>
                                    <div className="truncate">
                                      <span className="font-semibold text-amber-700">Superintendente:</span>{' '}
                                      {supAsig?.usuario?.nombre_completo || (
                                        <span className="text-rose-500 italic">Sin asignar</span>
                                      )}
                                    </div>
                                    <div className="truncate">
                                      <span className="font-semibold text-emerald-700">Supervisor:</span>{' '}
                                      {visAsig?.usuario?.nombre_completo || (
                                        <span className="text-rose-500 italic">Sin asignar</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Pendientes */}
                {adminTab === 'pending' && (
                  <div>
                    {pendingList.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                        <p className="font-medium text-slate-600">No hay usuarios pendientes de validación</p>
                        <p className="text-xs text-slate-400">Todos los usuarios registrados cuentan con rol y estado activo.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {pendingList.map((u) => (
                          <div
                            key={u.id_usuario}
                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-slate-900">{u.nombre_completo}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                                  Sin Rol / Inactivo
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                                <span>Correo: {u.correo_electronico}</span>
                                <span>Cédula: {u.cedula_profesional || 'No provista'}</span>
                                <span>Registro: {new Date(u.fecha_registro).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedUserForRole(u);
                                setSelectedRoleId(3);
                                setActivateOnAssign(true);
                              }}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 self-start sm:self-center shadow-sm"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>Asignar Rol y Habilitar</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Todos los Usuarios */}
                {adminTab === 'all' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                          <th className="pb-3">Nombre</th>
                          <th className="pb-3">Correo</th>
                          <th className="pb-3">Rol Normativo</th>
                          <th className="pb-3">Cédula</th>
                          <th className="pb-3">Estado</th>
                          <th className="pb-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usersList.map((u) => (
                          <tr key={u.id_usuario} className="hover:bg-slate-50/50">
                            <td className="py-3 font-semibold text-slate-900">{u.nombre_completo}</td>
                            <td className="py-3 text-slate-600">{u.correo_electronico}</td>
                            <td className="py-3">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getRoleBadge(
                                  u.rol?.nombre_rol,
                                )}`}
                              >
                                {u.rol?.nombre_rol || 'SIN ROL'}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 text-xs font-mono">
                              {u.cedula_profesional || '—'}
                            </td>
                            <td className="py-3">
                              {u.activo ? (
                                <span className="inline-flex items-center text-xs text-emerald-700 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs text-rose-700 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                                  Inactivo
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUserForRole(u);
                                  setSelectedRoleId(u.rol?.id_rol || 3);
                                  setActivateOnAssign(u.activo);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                              >
                                Modificar Rol
                              </button>
                              {u.id_usuario !== currentUser.id_usuario && (
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  className={`text-xs font-medium hover:underline ${
                                    u.activo
                                      ? 'text-rose-600 hover:text-rose-800'
                                      : 'text-emerald-600 hover:text-emerald-800'
                                  }`}
                                >
                                  {u.activo ? 'Suspender' : 'Reactivar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab: Roles LOPSRM */}
                {adminTab === 'roles' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rolesList.map((r) => (
                      <div
                        key={r.id_rol}
                        className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getRoleBadge(
                              r.nombre_rol,
                            )}`}
                          >
                            {r.nombre_rol}
                          </span>
                          <span className="text-xs font-mono text-slate-400">ID: {r.id_rol}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mt-2">{r.descripcion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal para Crear Nueva Obra Pública */}
            {isCreateObraModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                      <Building2 className="w-5 h-5 text-emerald-600 mr-2" />
                      Registrar Nueva Obra Pública
                    </h3>
                    <button
                      onClick={() => setIsCreateObraModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateObra} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Clave de Obra
                        </label>
                        <input
                          type="text"
                          required
                          value={claveObra}
                          onChange={(e) => setClaveObra(e.target.value)}
                          placeholder="OBRA-2026-ED-001"
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Número de Contrato (Art. 46)
                        </label>
                        <input
                          type="text"
                          required
                          value={numeroContrato}
                          onChange={(e) => setNumeroContrato(e.target.value)}
                          placeholder="DGCOP-LPN-045-2026"
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Nombre Oficial de la Obra
                      </label>
                      <input
                        type="text"
                        required
                        value={nombreObra}
                        onChange={(e) => setNombreObra(e.target.value)}
                        placeholder="Construcción de Edificio de Aulas y Laboratorios..."
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Presupuesto y Anticipo Contractual (Tope 30%) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Presupuesto Autorizado ($ MXN)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={presupuestoAutorizado}
                          onChange={(e) =>
                            setPresupuestoAutorizado(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder="12500000.00"
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Anticipo (% máx. 30.00)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          required
                          value={porcentajeAnticipo}
                          onChange={(e) => setPorcentajeAnticipo(Number(e.target.value))}
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                        />
                        <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                          <span>
                            Monto: <strong>{formatMoney(calculatedAnticipo)}</strong>
                          </span>
                          <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Tope: 30%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fechas Contractuales con Restricción Temporal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Fecha Inicio Programada
                        </label>
                        <input
                          type="date"
                          min={todayStr}
                          required
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          No se admiten fechas pasadas
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Fecha Término Programada
                        </label>
                        <input
                          type="date"
                          min={fechaInicio || todayStr}
                          required
                          value={fechaTermino}
                          onChange={(e) => setFechaTermino(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Posterior a la fecha de inicio
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsCreateObraModalOpen(false)}
                        className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md"
                      >
                        {loading ? 'Guardando...' : 'Guardar Obra Pública'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal para Asignar Cuadrilla / Terna Técnica Reglamentaria */}
            {selectedObraForCuadrilla && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center">
                        <HardHat className="w-5 h-5 text-blue-600 mr-2" />
                        Conformar Terna Técnica Reglamentaria (LOPSRM / RLOPSRM)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedObraForCuadrilla.clave_obra} — {selectedObraForCuadrilla.nombre_obra}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedObraForCuadrilla(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 space-y-5">
                    {/* Residente de Obra */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center">
                          <CheckSquare className="w-4 h-4 mr-1.5 text-blue-600" />
                          1. Residente de Obra (Dependencia Convocante)
                        </span>
                        <span className="text-[11px] text-blue-700 font-medium">Art. 112 RLOPSRM</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Servidor público facultado para autorizar y firmar estimaciones y modificaciones.
                      </p>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          defaultValue={
                            selectedObraForCuadrilla.asignaciones?.find((a) => a.rol_en_obra === 'RESIDENTE')
                              ?.id_usuario || ''
                          }
                          onChange={(e) =>
                            handleAssignCuadrillaMember(
                              selectedObraForCuadrilla.id_obra,
                              Number(e.target.value),
                              'RESIDENTE',
                            )
                          }
                        >
                          <option value="">-- Seleccionar Residente Acreditado --</option>
                          {candidatos.residentes.map((c) => (
                            <option key={c.id_usuario} value={c.id_usuario}>
                              {c.nombre_completo} ({c.cedula_profesional || 'Sin Cédula'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Superintendente de Construcción */}
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center">
                          <CheckSquare className="w-4 h-4 mr-1.5 text-amber-600" />
                          2. Superintendente de Construcción (Empresa Contratista)
                        </span>
                        <span className="text-[11px] text-amber-700 font-medium">Art. 115 RLOPSRM</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Profesional técnico facultado por el contratista para la ejecución y formulación de estimaciones.
                      </p>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                          defaultValue={
                            selectedObraForCuadrilla.asignaciones?.find((a) => a.rol_en_obra === 'SUPERINTENDENTE')
                              ?.id_usuario || ''
                          }
                          onChange={(e) =>
                            handleAssignCuadrillaMember(
                              selectedObraForCuadrilla.id_obra,
                              Number(e.target.value),
                              'SUPERINTENDENTE',
                            )
                          }
                        >
                          <option value="">-- Seleccionar Superintendente Acreditado --</option>
                          {candidatos.superintendentes.map((c) => (
                            <option key={c.id_usuario} value={c.id_usuario}>
                              {c.nombre_completo} ({c.cedula_profesional || 'Sin Cédula'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Supervisor de Obra */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center">
                          <CheckSquare className="w-4 h-4 mr-1.5 text-emerald-600" />
                          3. Supervisor de Obra (Supervisión Técnica de Campo)
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">Supervisión en Sitio</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Técnico responsable del reporte diario, evidencias fotográficas y visto bueno de generadores.
                      </p>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                          defaultValue={
                            selectedObraForCuadrilla.asignaciones?.find((a) => a.rol_en_obra === 'SUPERVISOR')
                              ?.id_usuario || ''
                          }
                          onChange={(e) =>
                            handleAssignCuadrillaMember(
                              selectedObraForCuadrilla.id_obra,
                              Number(e.target.value),
                              'SUPERVISOR',
                            )
                          }
                        >
                          <option value="">-- Seleccionar Supervisor Acreditado --</option>
                          {candidatos.supervisores.map((c) => (
                            <option key={c.id_usuario} value={c.id_usuario}>
                              {c.nombre_completo} ({c.cedula_profesional || 'Sin Cédula'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setSelectedObraForCuadrilla(null)}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                    >
                      Cerrar y Regresar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para Asignar Rol a Usuario */}
            {selectedUserForRole && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                      <Shield className="w-5 h-5 text-emerald-600 mr-2" /> Asignar Rol Normativo
                    </h3>
                    <button
                      onClick={() => setSelectedUserForRole(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="my-4 space-y-3">
                    <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <strong>Usuario:</strong> {selectedUserForRole.nombre_completo}
                      </div>
                      <div>
                        <strong>Correo:</strong> {selectedUserForRole.correo_electronico}
                      </div>
                      <div>
                        <strong>Cédula:</strong> {selectedUserForRole.cedula_profesional || 'No registrada'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Seleccione el Rol Legal (LOPSRM)
                      </label>
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {rolesList.map((r) => (
                          <option key={r.id_rol} value={r.id_rol}>
                            {r.nombre_rol} — {r.descripcion.substring(0, 50)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="activateChk"
                        checked={activateOnAssign}
                        onChange={(e) => setActivateOnAssign(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <label htmlFor="activateChk" className="text-xs text-slate-700 font-medium">
                        Activar cuenta inmediatamente para permitir acceso
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedUserForRole(null)}
                      className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAssignRole}
                      disabled={loading}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                    >
                      {loading ? 'Guardando...' : 'Confirmar y Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* REGULAR USER VIEW (HU-013: CONSULTAR OBRAS ASIGNADAS & ROADMAP)           */
          /* ========================================================================= */
          <div className="max-w-5xl mx-auto space-y-6">
            {/* User Welcome Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl border border-emerald-200">
                    {currentUser.nombre_completo.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{currentUser.nombre_completo}</h2>
                    <p className="text-sm text-slate-500">{currentUser.correo_electronico}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`text-xs px-3 py-0.5 rounded-full font-bold border ${getRoleBadge(
                          currentUser.rol?.nombre_rol,
                        )}`}
                      >
                        {currentUser.rol?.nombre_rol}
                      </span>
                      {currentUser.cedula_profesional && (
                        <span className="text-xs text-slate-500 font-mono">
                          Cédula: {currentUser.cedula_profesional}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle className="w-4 h-4 mr-1 text-emerald-500" />
                    Cuenta Autorizada y Activa
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong>Atribución Legal de su Rol:</strong> {currentUser.rol?.descripcion}
              </div>
            </div>

            {/* Proyectos Asignados y Obras en Ejecución */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center">
                    <Briefcase className="w-5 h-5 text-emerald-600 mr-2" />
                    Proyectos Asignados y Obras en Ejecución
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Contratos y proyectos autorizados para tu consulta y seguimiento conforme a tu atribución normativa
                  </p>
                </div>
                <button
                  onClick={fetchMyWorks}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
                >
                  Actualizar Lista
                </button>
              </div>

              {myWorksList.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Aún no tienes obras asignadas</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    El Administrador debe vincularte a la cuadrilla de un contrato activo con tu rol normativo.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myWorksList.map((obra) => {
                    const myAsig = obra.asignaciones?.find((a) => a.id_usuario === currentUser.id_usuario);
                    const rolDisplay =
                      myAsig?.rol_en_obra ||
                      (currentUser.rol?.nombre_rol === 'DIRECTOR'
                        ? 'Dirección General / Supervisión Ejecutiva'
                        : 'Personal Acreditado');

                    const resAsig = obra.asignaciones?.find((a) => a.rol_en_obra === 'RESIDENTE');
                    const supAsig = obra.asignaciones?.find((a) => a.rol_en_obra === 'SUPERINTENDENTE');
                    const visAsig = obra.asignaciones?.find((a) => a.rol_en_obra === 'SUPERVISOR');

                    return (
                      <div
                        key={obra.id_obra}
                        className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-white font-bold">
                            {obra.clave_obra}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                              obra.estatus,
                            )}`}
                          >
                            {obra.estatus}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{obra.nombre_obra}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Contrato: {obra.numero_contrato}
                          </span>
                        </div>

                        <div className="text-xs space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Presupuesto Autorizado:</span>
                            <span className="font-bold text-slate-800">
                              {formatMoney(Number(obra.presupuesto_autorizado))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tu Función:</span>
                            <span className="font-bold text-emerald-700">{rolDisplay}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Periodo Programado:</span>
                            <span className="text-slate-700">
                              {obra.fecha_inicio_programada} al {obra.fecha_termino_programada}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 text-[11px] space-y-0.5 text-slate-600">
                            <span className="font-semibold text-slate-700 block mb-1">Terna Reglamentaria:</span>
                            <div className="truncate">
                              <span className="text-blue-700 font-medium">Residente:</span>{' '}
                              {resAsig?.usuario?.nombre_completo || (
                                <span className="text-rose-500 italic">Sin asignar</span>
                              )}
                            </div>
                            <div className="truncate">
                              <span className="text-amber-700 font-medium">Superintendente:</span>{' '}
                              {supAsig?.usuario?.nombre_completo || (
                                <span className="text-rose-500 italic">Sin asignar</span>
                              )}
                            </div>
                            <div className="truncate">
                              <span className="text-emerald-700 font-medium">Supervisor:</span>{' '}
                              {visAsig?.usuario?.nombre_completo || (
                                <span className="text-rose-500 italic">Sin asignar</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <button
                              onClick={() => openCatalogoModal(obra)}
                              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Catálogo Original de Conceptos (Sprint 3)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Institucional y Normativo CDMX */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto pt-10 pb-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            {/* Columna 1: Identidad Institucional */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white text-sm block">GOBIERNO DE LA CDMX</span>
                  <span className="text-[11px] text-emerald-400 block font-medium">
                    Secretaría de Obras y Servicios
                  </span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Plataforma oficial para la administración, supervisión técnica, seguimiento de contratos y
                fiscalización de obras públicas y servicios relacionados en la Ciudad de México.
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dirección General de Construcción de Obras Públicas</span>
              </div>
            </div>

            {/* Columna 2: Marco Jurídico */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">
                Marco Normativo Aplicable
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                <li>• Ley de Obras Públicas del D.F. (LOPDF)</li>
                <li>• Reglamento de la Ley de Obras Públicas</li>
                <li>• Ley de Obras Públicas y Serv. Rel. (LOPSRM)</li>
                <li>• Ley de Transparencia y Rendición de Cuentas CDMX</li>
                <li>• Código Fiscal de la Ciudad de México</li>
              </ul>
              <button
                onClick={() => setLegalModalContent('normatividad')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] underline block mt-2"
              >
                Consultar Fundamento Jurídico →
              </button>
            </div>

            {/* Columna 3: Transparencia y Legalidad */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">
                Transparencia y Legalidad
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button
                    onClick={() => setLegalModalContent('terminos')}
                    className="text-slate-400 hover:text-white transition flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3 text-emerald-400 mr-1" />
                    <span>Términos y Condiciones de Uso</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLegalModalContent('privacidad')}
                    className="text-slate-400 hover:text-white transition flex items-center space-x-1"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1" />
                    <span>Aviso de Privacidad Integral (LPDPPSO-CDMX)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLegalModalContent('licencias')}
                    className="text-slate-400 hover:text-white transition flex items-center space-x-1"
                  >
                    <Scale className="w-3 h-3 text-emerald-400 mr-1" />
                    <span>Licencias y Derechos Reservados</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 4: Órgano Interno de Control */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">
                Órgano Interno de Control
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Supervisión administrativa y vigilancia de los recursos públicos a cargo de la Secretaría de la
                Contraloría General de la Ciudad de México.
              </p>
              <button
                onClick={() => setLegalModalContent('contraloria')}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold border border-slate-700 transition"
              >
                <span>Buzón del Órgano Interno de Control</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              © 2026 Gobierno de la Ciudad de México • Plataforma de Obras Públicas • Todos los derechos reservados.
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <button onClick={() => setLegalModalContent('terminos')} className="hover:underline">
                Términos
              </button>
              <span>•</span>
              <button onClick={() => setLegalModalContent('privacidad')} className="hover:underline">
                Privacidad
              </button>
              <span>•</span>
              <button onClick={() => setLegalModalContent('licencias')} className="hover:underline">
                Licencias
              </button>
              <span>•</span>
              <button onClick={() => setLegalModalContent('normatividad')} className="hover:underline">
                Normatividad
              </button>
              <span>•</span>
              <button onClick={() => setLegalModalContent('contraloria')} className="hover:underline">
                OIC / Denuncias
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SPRINT 3: MODALES HU-014, HU-015, HU-016/017, HU-018                       */}
      {/* ========================================================================= */}

      {/* MODAL HU-014: REGISTRAR PARTIDA */}
      {isPartidaModalOpen && catalogoActual && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Layers className="w-5 h-5 text-slate-700 mr-2" /> HU-014: Registrar Partida
              </h3>
              <button onClick={() => setIsPartidaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearPartida} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Código de Partida (Identificador)
                </label>
                <input
                  type="text"
                  required
                  value={codigoPartida}
                  onChange={(e) => setCodigoPartida(e.target.value.toUpperCase())}
                  placeholder="EJ: PREL, CIMENT, ESTR, ALB"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Debe ser único dentro de este catálogo original.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Partida
                </label>
                <input
                  type="text"
                  required
                  value={nombrePartida}
                  onChange={(e) => setNombrePartida(e.target.value)}
                  placeholder="EJ: Trabajos Preliminares"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={descPartida}
                  onChange={(e) => setDescPartida(e.target.value)}
                  placeholder="Alcance general de los trabajos de esta partida..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartidaModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Guardar Partida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HU-015: REGISTRAR SUBPARTIDA */}
      {isSubpartidaModalOpen && catalogoActual && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <PlusCircle className="w-5 h-5 text-blue-600 mr-2" /> HU-015: Registrar Subpartida
              </h3>
              <button onClick={() => setIsSubpartidaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearSubpartida} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Partida Asociada
                </label>
                <select
                  required
                  value={selectedPartidaId}
                  onChange={(e) => setSelectedPartidaId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Seleccione una Partida --</option>
                  {(catalogoActual.partidas || []).map((p) => (
                    <option key={p.id_partida} value={p.id_partida}>
                      {p.codigo_partida} — {p.nombre_partida}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Código de Subpartida
                </label>
                <input
                  type="text"
                  required
                  value={codigoSubpartida}
                  onChange={(e) => setCodigoSubpartida(e.target.value.toUpperCase())}
                  placeholder="EJ: TRAZO, DEMOL, EXCAV"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Subpartida
                </label>
                <input
                  type="text"
                  required
                  value={nombreSubpartida}
                  onChange={(e) => setNombreSubpartida(e.target.value)}
                  placeholder="EJ: Trazo y Nivelación"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={descSubpartida}
                  onChange={(e) => setDescSubpartida(e.target.value)}
                  placeholder="Detalle de trabajos específicos..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubpartidaModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Guardar Subpartida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HU-016 y HU-017: CAPTURAR CONCEPTO CON ID ÚNICO */}
      {isConceptoModalOpen && catalogoActual && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <Hash className="w-5 h-5 text-emerald-600 mr-2" /> HU-016 & HU-017: Capturar Concepto de Obra
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Asignación de ID único y registro de matriz de precios unitarios
                </p>
              </div>
              <button onClick={() => setIsConceptoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearConcepto} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Partida Correspondiente
                  </label>
                  <select
                    value={conceptoPartidaId}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setConceptoPartidaId(val);
                      setConceptoSubpartidaId('');
                      handleSugerirClave(val);
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Sin Partida / General --</option>
                    {(catalogoActual.partidas || []).map((p) => (
                      <option key={p.id_partida} value={p.id_partida}>
                        {p.codigo_partida} — {p.nombre_partida}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subpartida (Opcional)
                  </label>
                  <select
                    value={conceptoSubpartidaId}
                    onChange={(e) => setConceptoSubpartidaId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Sin Subpartida --</option>
                    {(
                      catalogoActual.partidas?.find((p) => p.id_partida === Number(conceptoPartidaId))?.subpartidas || []
                    ).map((s) => (
                      <option key={s.id_subpartida} value={s.id_subpartida}>
                        {s.codigo_subpartida} — {s.nombre_subpartida}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HU-016: Formato de ID y unicidad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    ID Único / Clave del Concepto (HU-016)
                  </label>
                  {conceptoPartidaId && (
                    <button
                      type="button"
                      onClick={() => handleSugerirClave(conceptoPartidaId)}
                      className="text-[11px] text-emerald-700 font-semibold hover:underline"
                    >
                      ⚡ Generar ID Automático
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={claveConcepto}
                  onChange={(e) => setClaveConcepto(e.target.value.toUpperCase())}
                  placeholder="EJ: PREL-001, CIM-ZAP-01"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Identificador irrepetible exigido por norma para control de estimaciones.
                </span>
              </div>

              {/* HU-017: Captura de datos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción Detallada del Concepto
                </label>
                <textarea
                  rows={3}
                  required
                  value={descConcepto}
                  onChange={(e) => setDescConcepto(e.target.value)}
                  placeholder="Excavación a mano para zapatas y zanjas en material tipo II hasta 2.00 m de profundidad, incluye afine de taludes, acarreo libre y herramienta..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="M3">M3 (Metro cúbico)</option>
                    <option value="M2">M2 (Metro cuadrado)</option>
                    <option value="ML">ML (Metro lineal)</option>
                    <option value="PZA">PZA (Pieza)</option>
                    <option value="KG">KG (Kilogramo)</option>
                    <option value="TON">TON (Tonelada)</option>
                    <option value="LOTE">LOTE (Lote)</option>
                    <option value="VIAJE">VIAJE (Viaje)</option>
                    <option value="SALIDA">SALIDA (Salida)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cantidad Proyectada
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={cantidadConcepto}
                    onChange={(e) => setCantidadConcepto(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="150.00"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Costo Directo P.U. ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={punitarioConcepto}
                    onChange={(e) => setPunitarioConcepto(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="345.50"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Previsualización del Importe Calculado */}
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-emerald-900 font-semibold block text-[11px]">
                    Importe Calculado Automáticamente (RF-06):
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {cantidadConcepto || 0} {unidadMedida} × {formatMoney(Number(punitarioConcepto) || 0)}
                  </span>
                </div>
                <div className="text-sm font-bold font-mono text-emerald-800">
                  {formatMoney((Number(cantidadConcepto) || 0) * (Number(punitarioConcepto) || 0))}
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConceptoModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Guardar Concepto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HU-018: BLOQUEAR CATÁLOGO ORIGINAL */}
      {isBloquearModalOpen && catalogoActual && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-800 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-rose-600" /> HU-018: Bloquear Catálogo Original
              </h3>
              <button onClick={() => setIsBloquearModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBloquearCatalogo} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <span className="font-bold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" />
                  ADVERTENCIA DE INMUTABILIDAD LEGAL (LOPSRM)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Una vez bloqueado, el catálogo original <strong>NO PODRÁ SER MODIFICADO DIRECTAMENTE</strong>.
                  Se impedirán altas, bajas y cambios de importes o descripciones (HU-019). Esta acción formaliza la propuesta
                  económica de licitación o contrato.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Motivo u Observaciones de la Formalización
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBloquearModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  Confirmar y Bloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PRINCIPAL: GESTIÓN DE CATÁLOGO ORIGINAL (SPRINT 3: HU-014 A HU-019)  */}
      {/* ========================================================================= */}
      {selectedObraForCatalogo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-600 font-bold">
                    {selectedObraForCatalogo.clave_obra}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    Contrato: {selectedObraForCatalogo.numero_contrato}
                  </span>
                  {catalogoActual && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                        catalogoActual.estatus_aprobacion === 'BLOQUEADO'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {catalogoActual.estatus_aprobacion === 'BLOQUEADO' ? (
                        <>
                          <Lock className="w-3 h-3 mr-1" /> BLOQUEADO E INMUTABLE
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" /> BORRADOR (EN CAPTURA)
                        </>
                      )}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Catálogo Original de Conceptos — {selectedObraForCatalogo.nombre_obra}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedObraForCatalogo(null);
                  setCatalogoActual(null);
                  setCatalogoMsg(null);
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Alert */}
            {catalogoMsg && (
              <div
                className={`px-6 py-3 text-xs border-b flex items-center justify-between ${
                  catalogoMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {catalogoMsg.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{catalogoMsg.text}</span>
                </div>
                <button
                  onClick={() => setCatalogoMsg(null)}
                  className="font-bold text-slate-400 hover:text-slate-700 ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal Body with Scroll */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingCatalogo ? (
                <div className="text-center py-20 text-slate-500">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold">Cargando catálogo original de la obra...</p>
                </div>
              ) : !catalogoActual ? (
                /* Estado: Sin catálogo inicializado */
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 max-w-lg mx-auto p-8">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-base">Catálogo Original No Inicializado</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Esta obra pública no cuenta aún con un Catálogo Original activo. Conforme a las atribuciones del
                    Superintendente (o Administrador), debe inicializar el catálogo en estado BORRADOR para estructurar las
                    partidas y conceptos.
                  </p>
                  <button
                    onClick={handleCrearCatalogoOriginal}
                    className="mt-5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition inline-flex items-center space-x-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Inicializar Catálogo Original (Borrador)</span>
                  </button>
                </div>
              ) : (
                /* Estado: Catálogo Activo */
                <>
                  {/* Banner Normativo de Inmutabilidad o Instrucción */}
                  {catalogoActual.estatus_aprobacion === 'BLOQUEADO' ? (
                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 flex items-start space-x-3 text-xs text-rose-900 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-rose-950 text-xs">
                            HU-019 / Art. 59 LOPSRM: Catálogo Original Inmutable y Bloqueado
                          </span>
                          <span className="font-mono text-[11px] text-rose-700">
                            Bloqueado el: {catalogoActual.fecha_bloqueo ? new Date(catalogoActual.fecha_bloqueo).toLocaleString('es-MX') : 'Fecha no registrada'}
                          </span>
                        </div>
                        <p className="mt-1 leading-relaxed text-rose-800">
                          El catálogo original ha sido finalizado y bloqueado para salvaguardar la propuesta económica
                          original del contrato. Los intentos de modificación directa, adición o eliminación de partidas y
                          conceptos son <strong>estrictamente rechazados por la API y la interfaz</strong>. Cualquier cambio de
                          volúmenes o conceptos nuevos deberá registrarse en un Catálogo Modificado o Extraordinario.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start space-x-3 text-xs text-amber-900 shadow-xs">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold uppercase tracking-wider text-amber-950 block">
                          Sprint 3: Captura y Estructuración del Catálogo Original (Borrador)
                        </span>
                        <p className="mt-1 leading-relaxed text-amber-800">
                          Como Superintendente, registre las <strong>Partidas</strong> (HU-014), <strong>Subpartidas</strong> (HU-015)
                          y capture los <strong>Conceptos de Trabajo</strong> con su ID único y matriz de precios unitarios (HU-016 y HU-017).
                          Al concluir la captura, utilice la opción de <strong>Bloqueo</strong> (HU-018) para formalizar la inmutabilidad legal.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Presupuesto y Métricas */}
                  {(() => {
                    const totalConceptos = catalogoActual.conceptos?.length || 0;
                    const totalPartidas = catalogoActual.partidas?.length || 0;
                    const importeTotal = (catalogoActual.conceptos || []).reduce(
                      (acc, c) => acc + Number(c.importe_costo_directo || c.cantidad * c.costo_directo_unitario || 0),
                      0,
                    );
                    const ptoAutorizado = Number(selectedObraForCatalogo.presupuesto_autorizado);
                    const pctPresupuesto = ptoAutorizado > 0 ? (importeTotal / ptoAutorizado) * 100 : 0;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-medium uppercase tracking-wider block">
                            Partidas Estructuradas
                          </span>
                          <div className="text-xl font-bold text-slate-800 mt-1">{totalPartidas}</div>
                          <span className="text-[11px] text-slate-500">Agrupaciones de obra (HU-014)</span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-medium uppercase tracking-wider block">
                            Conceptos Registrados
                          </span>
                          <div className="text-xl font-bold text-slate-800 mt-1">{totalConceptos}</div>
                          <span className="text-[11px] text-slate-500">Con ID único asignado (HU-016)</span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-medium uppercase tracking-wider block">
                            Importe Total Catálogo ($)
                          </span>
                          <div className="text-base font-bold text-emerald-700 mt-1">
                            {formatMoney(importeTotal)}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {pctPresupuesto.toFixed(2)}% del presupuesto contractual
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-medium uppercase tracking-wider block">
                            Presupuesto Contractual
                          </span>
                          <div className="text-base font-bold text-slate-900 mt-1">
                            {formatMoney(ptoAutorizado)}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Diferencia: {formatMoney(ptoAutorizado - importeTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Barra de Acciones del Catálogo */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setIsPartidaModalOpen(true)}
                        disabled={catalogoActual.estatus_aprobacion === 'BLOQUEADO'}
                        className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          catalogoActual.estatus_aprobacion === 'BLOQUEADO'
                            ? 'Catálogo bloqueado — no se pueden agregar partidas (HU-019)'
                            : 'HU-014: Registrar nueva partida'
                        }
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>+ Registrar Partida (HU-014)</span>
                      </button>

                      <button
                        onClick={() => setIsSubpartidaModalOpen(true)}
                        disabled={
                          catalogoActual.estatus_aprobacion === 'BLOQUEADO' ||
                          !catalogoActual.partidas ||
                          catalogoActual.partidas.length === 0
                        }
                        className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          catalogoActual.estatus_aprobacion === 'BLOQUEADO'
                            ? 'Catálogo bloqueado — no se pueden agregar subpartidas (HU-019)'
                            : !catalogoActual.partidas?.length
                            ? 'Primero registre al menos una partida'
                            : 'HU-015: Registrar subpartida dentro de una partida'
                        }
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Registrar Subpartida (HU-015)</span>
                      </button>

                      <button
                        onClick={() => {
                          if (catalogoActual.partidas && catalogoActual.partidas.length > 0) {
                            setConceptoPartidaId(catalogoActual.partidas[0].id_partida);
                            handleSugerirClave(catalogoActual.partidas[0].id_partida);
                          }
                          setIsConceptoModalOpen(true);
                        }}
                        disabled={
                          catalogoActual.estatus_aprobacion === 'BLOQUEADO' ||
                          !catalogoActual.partidas ||
                          catalogoActual.partidas.length === 0
                        }
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          catalogoActual.estatus_aprobacion === 'BLOQUEADO'
                            ? 'Catálogo bloqueado — no se pueden capturar conceptos (HU-019)'
                            : !catalogoActual.partidas?.length
                            ? 'Primero registre al menos una partida'
                            : 'HU-016 y HU-017: Capturar concepto con ID único'
                        }
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span>+ Capturar Concepto (HU-016/017)</span>
                      </button>
                    </div>

                    <div>
                      {catalogoActual.estatus_aprobacion === 'BORRADOR' && (
                        <button
                          onClick={() => setIsBloquearModalOpen(true)}
                          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                          title="HU-018: Finalizar y bloquear catálogo original"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bloquear Catálogo Original (HU-018)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Árbol y Tabla Jerárquica de Partidas, Subpartidas y Conceptos */}
                  <div className="space-y-4 pt-2">
                    {(!catalogoActual.partidas || catalogoActual.partidas.length === 0) ? (
                      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Sin partidas registradas</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          Comience agregando una partida para estructurar los conceptos de la obra (ej: PRELIMINARES, CIMENTACIÓN).
                        </p>
                      </div>
                    ) : (
                      catalogoActual.partidas.map((partida) => {
                        const conceptosPartida = (catalogoActual.conceptos || []).filter(
                          (c) => c.id_partida === partida.id_partida || c.partida === partida.nombre_partida,
                        );
                        const subpartidasPartida = partida.subpartidas || [];
                        const subtotalPartida = conceptosPartida.reduce(
                          (acc, c) => acc + Number(c.importe_costo_directo || c.cantidad * c.costo_directo_unitario || 0),
                          0,
                        );

                        return (
                          <div
                            key={partida.id_partida}
                            className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                          >
                            {/* Cabecera de la Partida */}
                            <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                                  {partida.codigo_partida}
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm">{partida.nombre_partida}</h4>
                                {partida.descripcion && (
                                  <span className="text-xs text-slate-500 italic hidden md:inline">
                                    — {partida.descripcion}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 text-xs">
                                <span className="text-slate-500">
                                  Subpartidas: <strong>{subpartidasPartida.length}</strong>
                                </span>
                                <span className="text-slate-500">
                                  Conceptos: <strong>{conceptosPartida.length}</strong>
                                </span>
                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                                  Subtotal: {formatMoney(subtotalPartida)}
                                </span>
                              </div>
                            </div>

                            {/* Subpartidas de esta Partida */}
                            {subpartidasPartida.length > 0 && (
                              <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100 flex flex-wrap gap-2 text-xs">
                                <span className="text-slate-400 font-semibold uppercase text-[10px] self-center">
                                  Subpartidas asociadas (HU-015):
                                </span>
                                {subpartidasPartida.map((sub) => (
                                  <span
                                    key={sub.id_subpartida}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px]"
                                  >
                                    <strong className="font-mono text-blue-700 mr-1">{sub.codigo_subpartida}</strong>{' '}
                                    {sub.nombre_subpartida}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Conceptos dentro de la Partida */}
                            {conceptosPartida.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 italic">
                                No hay conceptos capturados para esta partida aún.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                                    <tr>
                                      <th className="py-2.5 px-4 font-semibold">ID / Clave (HU-016)</th>
                                      <th className="py-2.5 px-4 font-semibold">Descripción del Concepto (HU-017)</th>
                                      <th className="py-2.5 px-3 font-semibold text-center">Unidad</th>
                                      <th className="py-2.5 px-3 font-semibold text-right">Cantidad</th>
                                      <th className="py-2.5 px-3 font-semibold text-right">P.U. ($)</th>
                                      <th className="py-2.5 px-4 font-semibold text-right">Importe ($)</th>
                                      {catalogoActual.estatus_aprobacion !== 'BLOQUEADO' && (
                                        <th className="py-2.5 px-3 font-semibold text-center">Acción</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {conceptosPartida.map((conc) => {
                                      const importeCalculado =
                                        Number(conc.importe_costo_directo) ||
                                        Number(conc.cantidad) * Number(conc.costo_directo_unitario);

                                      return (
                                        <tr key={conc.id_concepto} className="hover:bg-slate-50/70 transition">
                                          <td className="py-2.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                                            {conc.clave_concepto}
                                          </td>
                                          <td className="py-2.5 px-4 text-slate-700 max-w-md">
                                            <div>{conc.descripcion}</div>
                                            {conc.subpartida && (
                                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                                Subpartida: {conc.subpartida}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono text-center font-semibold text-slate-600">
                                            {conc.unidad_medida}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono text-right text-slate-800">
                                            {Number(conc.cantidad).toLocaleString('es-MX', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono text-right text-slate-800">
                                            {formatMoney(Number(conc.costo_directo_unitario))}
                                          </td>
                                          <td className="py-2.5 px-4 font-mono font-bold text-right text-emerald-800 whitespace-nowrap">
                                            {formatMoney(importeCalculado)}
                                          </td>
                                          {catalogoActual.estatus_aprobacion !== 'BLOQUEADO' && (
                                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                              <button
                                                onClick={() => handleDesactivarConcepto(conc.id_concepto)}
                                                className="text-rose-600 hover:text-rose-800 font-semibold text-[11px] hover:underline"
                                                title="Desactivar concepto"
                                              >
                                                Eliminar
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Sprint 3 • Catálogo Original de Obra Pública (HU-014 a HU-019 • Art. 59 LOPSRM)
              </span>
              <button
                onClick={() => {
                  setSelectedObraForCatalogo(null);
                  setCatalogoActual(null);
                  setCatalogoMsg(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
              >
                Cerrar Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Información Legal e Institucional CDMX */}
      {legalModalContent && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  {legalModalContent === 'terminos' && <FileText className="w-4 h-4" />}
                  {legalModalContent === 'privacidad' && <ShieldCheck className="w-4 h-4" />}
                  {legalModalContent === 'licencias' && <Scale className="w-4 h-4" />}
                  {legalModalContent === 'normatividad' && <Landmark className="w-4 h-4" />}
                  {legalModalContent === 'contraloria' && <AlertCircle className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {legalModalContent === 'terminos' && 'Términos y Condiciones de Uso del Sistema'}
                  {legalModalContent === 'privacidad' && 'Aviso de Privacidad Integral (LPDPPSO-CDMX)'}
                  {legalModalContent === 'licencias' && 'Licencias de Software y Derechos Reservados'}
                  {legalModalContent === 'normatividad' && 'Marco Jurídico y Normatividad en la CDMX'}
                  {legalModalContent === 'contraloria' && 'Órgano Interno de Control y Buzón de Denuncias'}
                </h3>
              </div>
              <button
                onClick={() => setLegalModalContent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-600 space-y-3.5 leading-relaxed">
              {legalModalContent === 'terminos' && (
                <>
                  <p>
                    <strong>1. Ámbito de Aplicación:</strong> Los presentes Términos y Condiciones regulan el uso
                    del Sistema de Control de Obra Pública para la gestión, fiscalización y seguimiento de contratos
                    adjudicados conforme a la Ley de Obras Públicas del Distrito Federal (LOPDF), la Ley de Obras
                    Públicas y Servicios Relacionados con las Mismas (LOPSRM) y sus respectivos Reglamentos.
                  </p>
                  <p>
                    <strong>2. Perfiles y Responsabilidad Legal:</strong> El acceso está reservado exclusivamente a
                    servidores públicos y profesionales acreditados por dependencias y empresas contratistas:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Residente de Obra:</strong> Servidor público facultado legalmente con cédula profesional
                      (Art. 112 RLOPSRM), responsable de autorizaciones técnicas, suspensiones y liquidaciones.
                    </li>
                    <li>
                      <strong>Superintendente de Construcción:</strong> Profesional técnico facultado por el
                      contratista con poder amplio en el sitio de los trabajos (Art. 115 RLOPSRM).
                    </li>
                    <li>
                      <strong>Supervisor de Obra:</strong> Técnico auxiliar en campo encargado del levantamiento
                      diario de bitácoras, evidencias fotográficas y comprobación volumétrica.
                    </li>
                  </ul>
                  <p>
                    <strong>3. Validez de los Registros:</strong> Todos los datos capturados (reportes diarios,
                    estimaciones, retenciones legales y actas) tienen carácter oficial y quedan sujetos a auditoría
                    por parte de la Secretaría de la Contraloría General de la Ciudad de México y la Auditoría Superior
                    de la CDMX.
                  </p>
                  <p>
                    <strong>4. Confidencialidad y Claves:</strong> Las credenciales de acceso son personales e
                    intransferibles. Cualquier acción realizada bajo una cuenta autenticada se considerará efectuada
                    por su titular.
                  </p>
                </>
              )}

              {legalModalContent === 'privacidad' && (
                <>
                  <p>
                    <strong>Aviso de Privacidad Integral:</strong> En cumplimiento con la Ley de Protección de Datos
                    Personales en Posesión de Sujetos Obligados de la Ciudad de México (LPDPPSO-CDMX) y la Ley de
                    Transparencia, Acceso a la Información Pública y Rendición de Cuentas de la Ciudad de México:
                  </p>
                  <p>
                    <strong>1. Responsable del Tratamiento:</strong> El Gobierno de la Ciudad de México, a través de la
                    Secretaría de Obras y Servicios (SOBSE) y las alcaldías o dependencias ejecutoras de gasto.
                  </p>
                  <p>
                    <strong>2. Datos Personales Recabados:</strong> Para la asignación de la terna técnica se
                    recaban: nombre completo, correo electrónico oficial/empresarial, número de cédula profesional y
                    registros de auditoría de actividad en el sistema.
                  </p>
                  <p>
                    <strong>3. Finalidad del Tratamiento:</strong> Acreditar la idoneidad técnica y profesional de las
                    figuras operativas de obra pública conforme a la normativa, así como garantizar la trazabilidad
                    jurídica en los procesos de fiscalización y rendición de cuentas.
                  </p>
                  <p>
                    <strong>4. Ejercicio de Derechos ARCO:</strong> Los titulares de los datos pueden ejercer sus
                    derechos de Acceso, Rectificación, Cancelación u Oposición a través de la Unidad de Transparencia
                    de la dependencia correspondiente o mediante la Plataforma Nacional de Transparencia (PNT).
                  </p>
                </>
              )}

              {legalModalContent === 'licencias' && (
                <>
                  <p>
                    <strong>1. Propiedad Patrimonial:</strong> El diseño, arquitectura y desarrollos específicos de
                    este software son propiedad institucional del Gobierno de la Ciudad de México para el beneficio
                    público y la fiscalización del erario.
                  </p>
                  <p>
                    <strong>2. Componentes de Código Abierto (Open Source):</strong> Esta plataforma integra librerías
                    y estándares de la industria bajo licencias libres permisivas:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>React 19 & React DOM:</strong> Licencia MIT (Meta Platforms, Inc.).
                    </li>
                    <li>
                      <strong>NestJS & TypeORM:</strong> Licencia MIT (Kamil Mysliwiec / TypeORM contributors).
                    </li>
                    <li>
                      <strong>PostgreSQL 16:</strong> Licencia PostgreSQL (PostgreSQL Global Development Group).
                    </li>
                    <li>
                      <strong>Tailwind CSS v4 & Lucide Icons:</strong> Licencias MIT e ISC.
                    </li>
                  </ul>
                  <p>
                    <strong>3. Integridad y Seguridad:</strong> Queda prohibida la reproducción no autorizada,
                    ingeniería inversa con fines maliciosos o alteración de los registros inmutables de auditoría del
                    sistema.
                  </p>
                </>
              )}

              {legalModalContent === 'normatividad' && (
                <>
                  <p>
                    <strong>Compendio Normativo de la Obra Pública:</strong> Las operaciones ejecutadas en este portal
                    se fundamentan en el marco legal vigente para la Ciudad de México y los fondos federales aplicables:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      <strong>Constitución Política de la CDMX (Art. 60):</strong> Principios de eficiencia, eficacia,
                      economía, transparencia y honradez en el ejercicio de las contrataciones públicas.
                    </li>
                    <li>
                      <strong>Ley de Obras Públicas del Distrito Federal (LOPDF):</strong> Normas para la planeación,
                      programación, presupuestación, adjudicación, ejecución y rescisión de contratos de obra local.
                    </li>
                    <li>
                      <strong>Reglamento de la LOPDF:</strong> Disposiciones para el control de calidad, retenciones
                      legales, formulación de estimaciones y responsabilidades de la supervisión.
                    </li>
                    <li>
                      <strong>Ley de Obras Públicas y Serv. Rel. (LOPSRM) y Reglamento (RLOPSRM):</strong> Aplicable
                      a contratos financiados total o parcialmente con recursos federales o convenios de coordinación.
                    </li>
                    <li>
                      <strong>Lineamientos de Anticipos (Art. 50 LOPSRM / Art. 52 LOPDF):</strong> El porcentaje de
                      anticipo otorgado a contratistas no excederá en ningún caso del 30% del monto total del contrato.
                    </li>
                  </ul>
                </>
              )}

              {legalModalContent === 'contraloria' && (
                <>
                  <p>
                    <strong>Secretaría de la Contraloría General de la Ciudad de México:</strong> Como órgano fiscalizador,
                    recibe y da trámite a denuncias ciudadanas y quejas sobre irregularidades en obras públicas.
                  </p>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <p>
                      <strong>Canales Oficiales de Denuncia:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        <strong>Plataforma Digital:</strong> Sistema de Denuncia Ciudadana (SIDEC-CDMX).
                      </li>
                      <li>
                        <strong>Línea Telefónica Anticorrupción:</strong> Locatel *0311 / Contraloría CDMX.
                      </li>
                      <li>
                        <strong>Órgano Interno de Control en SOBSE:</strong> Dirección de Auditoría de Obra Pública.
                      </li>
                    </ul>
                  </div>
                  <p>
                    Las denuncias pueden presentarse de forma anónima garantizando la protección del denunciante conforme
                    a la Ley General de Responsabilidades Administrativas.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setLegalModalContent(null)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm"
              >
                Entendido y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
