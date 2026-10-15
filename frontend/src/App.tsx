import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  Users,
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
  const [adminTab, setAdminTab] = useState<'pending' | 'all' | 'roles'>('pending');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [pendingList, setPendingList] = useState<UserProfile[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserProfile | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(3);
  const [activateOnAssign, setActivateOnAssign] = useState<boolean>(true);
  const [adminActionMsg, setAdminActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch initial profile if token exists
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Fetch admin data when admin logs in or switches tabs
  useEffect(() => {
    if (token && currentUser?.rol?.nombre_rol === 'ADMINISTRADOR') {
      fetchAdminData();
    }
  }, [token, currentUser]);

  const fetchProfile = async () => {
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
    } catch (e) {
      console.error('Error al obtener perfil:', e);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [usersRes, pendingRes, rolesRes] = await Promise.all([
        fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/users/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/users/roles', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) setUsersList(await usersRes.json());
      if (pendingRes.ok) setPendingList(await pendingRes.json());
      if (rolesRes.ok) setRolesList(await rolesRes.json());
    } catch (e) {
      console.error('Error al cargar datos administrativos:', e);
    }
  };

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
    } catch (err) {
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
    } catch (err) {
      setAuthError('Error de comunicación con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('lopsrm_token');
    localStorage.removeItem('lopsrm_user');
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
      }
    } catch (err) {
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const testRbacUnauthorized = async () => {
    try {
      const res = await fetch('/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Barrera RBAC Funcionando Correctamente (${res.status}):\n${data.message}`);
      } else {
        alert('Respuesta inesperada: Acceso permitido');
      }
    } catch (e) {
      alert('Error en petición');
    }
  };

  // Color badges helper
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
              <span className="text-xs text-slate-400 font-mono block">
                Marco Normativo: LOPSRM / RLOPSRM • Sprint 1
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
              {/* Tabs */}
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
                {/* Alerts */}
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
                  /* Login Form */
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

                    {/* Demo Shortcuts */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wider text-center">
                        Accesos de Prueba Rápida (Sprint 1)
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
                  /* Register Form */
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
                        Cédula Profesional (Opcional)
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
          /* ADMINISTRATOR DASHBOARD (US-02: CENTRAL ROLE & PERMISSION MANAGEMENT)     */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    Pendientes de Aprobación
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
                    Roles LOPSRM
                  </span>
                  <div className="text-2xl font-bold text-purple-600 mt-1">{rolesList.length || 5}</div>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
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
                <div className="flex space-x-2">
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

                <button
                  onClick={fetchAdminData}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Actualizar Datos
                </button>
              </div>

              <div className="p-6">
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

            {/* Modal for Role Assignment */}
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
          /* REGULAR USER VIEW (SUPERINTENDENTE, SUPERVISOR, RESIDENTE, DIRECTOR)      */
          /* ========================================================================= */
          <div className="max-w-4xl mx-auto space-y-6">
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

            {/* Upcoming Sprints Roadmap */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                Módulos del Sistema en Desarrollo (Roadmap LOPSRM)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Sprint 2</span>
                  <div className="font-bold text-slate-800 text-sm">Obras y Cuadrillas</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Asignación formal de la terna: Residente, Superintendente y Supervisor.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Sprint 3 & 4</span>
                  <div className="font-bold text-slate-800 text-sm">Catálogos y APU</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Catálogo original, extraordinario y cálculo automático de importes.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Sprint 9 & 10</span>
                  <div className="font-bold text-slate-800 text-sm">Estimaciones & Semáforo</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Flujo de aprobación quincenal (15 días) y cálculo de retención 5 al millar.
                  </p>
                </div>
              </div>
            </div>

            {/* RBAC Security Test Card */}
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-purple-900 text-sm flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2 text-purple-700" />
                  Prueba de Barrera de Seguridad (RBAC)
                </h4>
                <p className="text-xs text-purple-700 mt-1 max-w-lg">
                  Como tu usuario no es Administrador, haz clic para verificar que el backend deniega el acceso con
                  un código 403 Forbidden como exige la especificación.
                </p>
              </div>

              <button
                onClick={testRbacUnauthorized}
                className="px-4 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap self-start sm:self-center"
              >
                Probar Intento No Autorizado
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Proyecto: Sistema de Información para el Control de Obra Pública (LOPSRM) • Análisis y Diseño de Sistemas •
        2026
      </footer>
    </div>
  );
}
