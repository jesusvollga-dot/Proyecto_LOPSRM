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
