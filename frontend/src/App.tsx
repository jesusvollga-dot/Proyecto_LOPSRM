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
  History,
  Sparkles,
  ArrowRightLeft,
  FileCheck,
  Sun,
  CloudRain,
  Truck,
  ClipboardList,
  Eye,
  Search,
  UploadCloud,
  File,
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
  es_extraordinario?: boolean;
  id_concepto_origen?: number | null;
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
  id_catalogo_origen?: number | null;
  catalogo_origen?: CatalogoItem | null;
  id_convenio?: number | null;
  descripcion?: string | null;
  fecha_creacion: string;
  activo: boolean;
  partidas?: PartidaItem[];
  conceptos?: ConceptoItem[];
}

// ============================================================================
// Sprint 5: Convenios y Auditoría (HU-027 a HU-033)
// ============================================================================
interface ConvenioItem {
  id_convenio: number;
  id_obra: number;
  id_catalogo?: number | null;
  numero_convenio: string;
  tipo_convenio: 'MODIFICATORIO_VOLUMEN' | 'CONCEPTO_EXTRAORDINARIO' | 'PLAZO' | 'MIXTO';
  descripcion: string;
  fecha_firma: string;
  monto_adicional: number;
  porcentaje_variacion: number;
  dias_ampliacion: number;
  id_usuario_registro: number;
  usuario_registro?: UserProfile;
  catalogo?: CatalogoItem;
  estatus: 'BORRADOR' | 'AUTORIZADO' | 'CANCELADO';
  fecha_creacion: string;
  activo: boolean;
}

interface HistorialItem {
  id_historial: number;
  id_concepto: number;
  concepto?: ConceptoItem;
  id_catalogo?: number | null;
  catalogo?: CatalogoItem;
  id_usuario_modifica: number;
  usuario?: UserProfile;
  fecha_modificacion: string;
  campo_modificado: string;
  valor_anterior?: string | null;
  valor_nuevo?: string | null;
  justificacion: string;
  evento: string;
}

// ============================================================================
// Sprint 6: Reporte Diario de Supervisión y Bitácora (HU-034 a HU-040)
// ============================================================================
interface PersonalCuadrillaItem {
  categoria: string;
  cantidad: number;
  descripcion?: string;
}

interface MaquinariaSitioItem {
  tipo: string;
  cantidad: number;
  horas_uso?: number;
  estatus?: string;
  descripcion?: string;
}

export const CATALOGO_CATEGORIAS_PERSONAL: string[] = [
  'Cabos de Oficios / Sobrestantes',
  'Albañiles / Oficiales de Albañilería',
  'Fierreros / Habilitadores de Acero',
  'Carpinteros de Obra Negra / Cimbreros',
  'Peones / Ayudantes Generales',
  'Electricistas / Oficiales Eléctricos',
  'Plomeros / Instaladores Hidrosanitarios',
  'Soldadores / Paileros',
  'Operadores de Maquinaria Pesada',
  'Topógrafos / Cadeneros',
  'Pintores / Acabados',
  'Yeseros / Tablarroqueros',
  'Mecánicos de Equipo / Mantenimiento',
  'Bodegueros / Almacenistas de Material',
  'Rescatistas / Paramédicos de Sitio',
  'Personal de Limpieza y Vialidad',
  'Personal de Seguridad y Vigilancia',
  'Otro (especificar)',
];

export const CATALOGO_MAQUINARIA_EQUIPO: string[] = [
  'Retroexcavadora (ej. CAT 416 / 420)',
  'Excavadora de Orugas (ej. CAT 320 / Komatsu PC200)',
  'Camión de Volteo 14 m³',
  'Camión de Volteo 7 m³',
  'Camión Mezclador / Revolvedora (Trompo)',
  'Motoconformadora / Niveladora (ej. CAT 120 / 140)',
  'Vibrocompactador / Rodillo Liso',
  'Compactador Pata de Cabra',
  'Grúa Telescópica Móvil',
  'Grúa Torre',
  'Bomba de Concreto Hidráulica (Pluma / Estacionaria)',
  'Minicargador (Bobcat)',
  'Tractor de Orugas / Bulldozer (ej. CAT D6)',
  'Pipa de Agua (10,000 / 20,000 L)',
  'Planta Generadora de Luz (50 - 150 kVA)',
  'Compresor Neumático de Aire',
  'Torre de Iluminación Móvil',
  'Revolvedora de 1 a 2 sacos (Equipo menor)',
  'Bailarina / Compactador tipo pisón',
  'Cortadora de Concreto / Disco Diamantado',
  'Soldadora de Combustión',
  'Andamio Colgante / Eléctrico',
  'Camión Hiab con Brazo Articulado',
  'Otro (especificar)',
];

interface FotoReporteItem {
  id_foto?: number;
  numero_foto: number;
  url_archivo: string;
  descripcion_foto?: string;
  nombre_archivo?: string;
  tipo_archivo?: 'image' | 'pdf' | 'doc';
}

const getTipoArchivoFromUrl = (url: string): 'image' | 'pdf' | 'doc' => {
  const u = (url || '').toLowerCase();
  if (u.endsWith('.pdf') || u.includes('.pdf?')) return 'pdf';
  if (u.endsWith('.docx') || u.endsWith('.doc') || u.includes('.docx?') || u.includes('.doc?')) return 'doc';
  return 'image';
};

interface IncidenciaReporteItem {
  id_incidencia?: number;
  tipo: string;
  descripcion: string;
  acciones_a_seguir: string;
  estatus?: string;
  fecha_solucion?: string;
}

interface ReporteDiarioItem {
  id_reporte: number;
  id_obra: number;
  obra?: Obra;
  id_supervisor: number;
  supervisor?: UserProfile;
  fecha_reporte: string;
  clima: string;
  temperatura_celsius?: number | null;
  observaciones_clima?: string | null;
  senalamiento_preventivo: boolean;
  equipo_proteccion_epp: boolean;
  suministro_material: boolean;
  estatus_personal: string;
  condiciones_seguridad?: string | null;
  checklist_seguridad?: Record<string, boolean> | null;
  observaciones_seguridad?: string | null;
  checklist_epp?: Record<string, boolean> | null;
  observaciones_epp?: string | null;
  resumen_cuadrilla?: PersonalCuadrillaItem[] | null;
  maquinaria_sitio?: MaquinariaSitioItem[] | null;
  actividades_realizadas?: string | null;
  avance_fisico_acumulado: number;
  fecha_estimada_fin?: string | null;
  fecha_creacion: string;
  activo: boolean;
  fotos?: FotoReporteItem[];
  incidencias?: IncidenciaReporteItem[];
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

  // Sprint 5: Catálogos Modificados, Extraordinarios, Convenios y Auditoría (HU-027 a HU-033)
  const [catalogosLista, setCatalogosLista] = useState<CatalogoItem[]>([]);
  const [catalogoModalTab, setCatalogoModalTab] = useState<'CATALOGOS' | 'CONVENIOS' | 'AUDITORIA'>('CATALOGOS');
  const [conveniosLista, setConveniosLista] = useState<ConvenioItem[]>([]);
  const [loadingConvenios, setLoadingConvenios] = useState(false);
  const [historialLista, setHistorialLista] = useState<HistorialItem[]>([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);

  // Modales Sprint 3
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [isSubpartidaModalOpen, setIsSubpartidaModalOpen] = useState(false);
  const [isConceptoModalOpen, setIsConceptoModalOpen] = useState(false);
  const [isBloquearModalOpen, setIsBloquearModalOpen] = useState(false);

  // Modales Sprint 5
  const [isCatalogoModificadoModalOpen, setIsCatalogoModificadoModalOpen] = useState(false);
  const [isExtraordinarioModalOpen, setIsExtraordinarioModalOpen] = useState(false);
  const [isConvenioModalOpen, setIsConvenioModalOpen] = useState(false);
  const [isModificarVolumenModalOpen, setIsModificarVolumenModalOpen] = useState(false);

  // Formulario Catálogo Modificado (HU-027)
  const [descModificado, setDescModificado] = useState('');
  const [convenioModificadoId, setConvenioModificadoId] = useState<number | ''>('');

  // Formulario Concepto Extraordinario (HU-028)
  const [claveExtra, setClaveExtra] = useState('');
  const [descExtra, setDescExtra] = useState('');
  const [unidadExtra, setUnidadExtra] = useState('M3');
  const [cantidadExtra, setCantidadExtra] = useState<number | ''>('');
  const [puExtra, setPuExtra] = useState<number | ''>('');
  const [partidaExtra, setPartidaExtra] = useState('TRABAJOS EXTRAORDINARIOS');
  const [justificacionExtra, setJustificacionExtra] = useState('');

  // Formulario Convenio (HU-029)
  const [numConvenio, setNumConvenio] = useState('');
  const [tipoConvenio, setTipoConvenio] = useState<'MODIFICATORIO_VOLUMEN' | 'CONCEPTO_EXTRAORDINARIO' | 'PLAZO' | 'MIXTO'>('MODIFICATORIO_VOLUMEN');
  const [descConvenio, setDescConvenio] = useState('');
  const [fechaFirmaConvenio, setFechaFirmaConvenio] = useState(new Date().toISOString().split('T')[0]);
  const [montoConvenio, setMontoConvenio] = useState<number | ''>('');
  const [pctConvenio, setPctConvenio] = useState<number | ''>('');
  const [diasConvenio, setDiasConvenio] = useState<number | ''>(0);
  const [catalogoAsociadoConvenioId, setCatalogoAsociadoConvenioId] = useState<number | ''>('');

  // Formulario Modificación de Volumen (HU-030/HU-031/HU-033)
  const [conceptoParaModificar, setConceptoParaModificar] = useState<ConceptoItem | null>(null);
  const [nuevaCantidadVolumen, setNuevaCantidadVolumen] = useState<number | ''>('');
  const [justificacionVolumen, setJustificacionVolumen] = useState('');

  // Filtros Auditoría (HU-032)
  const [filtroAuditoriaTexto, setFiltroAuditoriaTexto] = useState('');
  const [filtroAuditoriaEvento, setFiltroAuditoriaEvento] = useState('');

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

  // =========================================================================
  // Sprint 6: Bitácora y Reportes Diarios de Supervisión (HU-034 a HU-040)
  // =========================================================================
  const [isBitacoraModalOpen, setIsBitacoraModalOpen] = useState(false);
  const [selectedObraForBitacora, setSelectedObraForBitacora] = useState<Obra | null>(null);
  const [reportesLista, setReportesLista] = useState<ReporteDiarioItem[]>([]);
  const [loadingBitacora, setLoadingBitacora] = useState(false);
  const [bitacoraMsg, setBitacoraMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtros Bitácora (HU-040)
  const [filtroBitacoraFechaInicio, setFiltroBitacoraFechaInicio] = useState('');
  const [filtroBitacoraFechaFin, setFiltroBitacoraFechaFin] = useState('');
  const [filtroBitacoraClima, setFiltroBitacoraClima] = useState('');
  const [filtroBitacoraObraId, setFiltroBitacoraObraId] = useState<number | ''>('');

  // Modal Detalle de Reporte (HU-040)
  const [reporteSeleccionadoDetalle, setReporteSeleccionadoDetalle] = useState<ReporteDiarioItem | null>(null);

  // Modal Nuevo Reporte Diario (HU-034 a HU-039)
  const [isNuevoReporteModalOpen, setIsNuevoReporteModalOpen] = useState(false);
  const [reporteObraId, setReporteObraId] = useState<number | ''>('');
  const [reporteFecha, setReporteFecha] = useState(todayStr);
  const [reporteActividades, setReporteActividades] = useState('');
  const [reporteAvanceFisico, setReporteAvanceFisico] = useState<number | ''>('');
  const [ultimoAvanceObra, setUltimoAvanceObra] = useState<number>(0);

  // Clima (HU-035)
  const [reporteClima, setReporteClima] = useState('Soleado');
  const [reporteTemperatura, setReporteTemperatura] = useState<number | ''>('');
  const [reporteObservacionesClima, setReporteObservacionesClima] = useState('');

  // Seguridad (HU-036)
  const [reporteSenalamiento, setReporteSenalamiento] = useState(true);
  const [reporteCondicionesSeguridad, setReporteCondicionesSeguridad] = useState('');
  const [reporteChecklistSeguridad, setReporteChecklistSeguridad] = useState<Record<string, boolean>>({
    senalizacion: true,
    extintores: true,
    botiquin: true,
    orden_limpieza: true,
  });
  const [reporteObservacionesSeguridad, setReporteObservacionesSeguridad] = useState('');

  // EPP (HU-037)
  const [reporteCumplimientoEPP, setReporteCumplimientoEPP] = useState(true);
  const [reporteChecklistEPP, setReporteChecklistEPP] = useState<Record<string, boolean>>({
    casco: true,
    chaleco: true,
    botas: true,
    guantes: true,
    lentes: true,
    arnes: false,
  });
  const [reporteObservacionesEPP, setReporteObservacionesEPP] = useState('');

  // Personal / Cuadrilla (HU-038)
  const [reporteEstatusPersonal, setReporteEstatusPersonal] = useState('Suficiente');
  const [reporteCuadrilla, setReporteCuadrilla] = useState<PersonalCuadrillaItem[]>([
    { categoria: 'Cabos de Oficios / Sobrestantes', cantidad: 1, descripcion: 'Control y trazo' },
    { categoria: 'Albañiles / Oficiales de Albañilería', cantidad: 4, descripcion: 'Pegado de block y colado' },
    { categoria: 'Peones / Ayudantes Generales', cantidad: 6, descripcion: 'Acarreo de materiales' },
  ]);
  const [categoriaPersonalSeleccionada, setCategoriaPersonalSeleccionada] = useState('');
  const [categoriaPersonalOtro, setCategoriaPersonalOtro] = useState('');
  const [nuevaCategoriaPersonal, setNuevaCategoriaPersonal] = useState('');
  const [nuevaCantidadPersonal, setNuevaCantidadPersonal] = useState<number | ''>('');
  const [nuevaDescripcionPersonal, setNuevaDescripcionPersonal] = useState('');

  // Maquinaria (HU-039)
  const [reporteMaquinaria, setReporteMaquinaria] = useState<MaquinariaSitioItem[]>([
    { tipo: 'Retroexcavadora (ej. CAT 416 / 420)', cantidad: 1, horas_uso: 7, estatus: 'Operativa', descripcion: 'Excavación para cimentación' },
  ]);
  const [tipoMaquinariaSeleccionada, setTipoMaquinariaSeleccionada] = useState('');
  const [tipoMaquinariaOtro, setTipoMaquinariaOtro] = useState('');
  const [nuevoTipoMaquinaria, setNuevoTipoMaquinaria] = useState('');
  const [nuevaCantidadMaquinaria, setNuevaCantidadMaquinaria] = useState<number | ''>('');
  const [nuevasHorasMaquinaria, setNuevasHorasMaquinaria] = useState<number | ''>('');
  const [nuevoEstatusMaquinaria, setNuevoEstatusMaquinaria] = useState('Operativa');
  const [nuevaActividadMaquinaria, setNuevaActividadMaquinaria] = useState('');

  // Fotos y Evidencias Documentales (RF-13)
  const [reporteFotos, setReporteFotos] = useState<FotoReporteItem[]>([]);
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState('');
  const [nuevaFotoDesc, setNuevaFotoDesc] = useState('');
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [modoUrlManual, setModoUrlManual] = useState(false);

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
      if (res.ok) {
        const data = await res.json();
        setMyWorksList(Array.isArray(data) ? data : []);
      }
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

  // Sprint 5: Cargar todos los catálogos de la obra (Original, Modificados, Extraordinarios)
  const fetchTodosCatalogos = useCallback(async (idObra: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/catalogos/obra/${idObra}/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCatalogosLista(data);
      }
    } catch {
      console.error('Error al cargar lista de catálogos');
    }
  }, [token]);

  // Sprint 5: Cargar convenios modificatorios de volumen de la obra (HU-029)
  const fetchConvenios = useCallback(async (idObra: number) => {
    if (!token) return;
    setLoadingConvenios(true);
    try {
      const res = await fetch(`/api/v1/catalogos/obra/${idObra}/convenios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConveniosLista(data);
      }
    } catch {
      console.error('Error al cargar convenios de la obra');
    } finally {
      setLoadingConvenios(false);
    }
  }, [token]);

  // Sprint 5: Cargar historial de modificaciones y auditoría consolidada (HU-032, HU-033)
  const fetchAuditoria = useCallback(async (idObra: number) => {
    if (!token) return;
    setLoadingAuditoria(true);
    try {
      const res = await fetch(`/api/v1/catalogos/obra/${idObra}/auditoria`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistorialLista(data);
      }
    } catch {
      console.error('Error al cargar auditoría');
    } finally {
      setLoadingAuditoria(false);
    }
  }, [token]);

  // Sprint 5: Seleccionar un catálogo específico por ID (Original, Modificado o Extraordinario)
  const seleccionarCatalogoPorId = async (idCatalogo: number) => {
    if (!token) return;
    setLoadingCatalogo(true);
    setCatalogoMsg(null);
    try {
      const res = await fetch(`/api/v1/catalogos/${idCatalogo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCatalogoActual(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al cambiar de catálogo.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de red al consultar el catálogo seleccionado.' });
    } finally {
      setLoadingCatalogo(false);
    }
  };

  const openCatalogoModal = (obra: Obra) => {
    setSelectedObraForCatalogo(obra);
    setCatalogoMsg(null);
    setCatalogoModalTab('CATALOGOS');
    fetchCatalogoPorObra(obra.id_obra);
    fetchTodosCatalogos(obra.id_obra);
    fetchConvenios(obra.id_obra);
    fetchAuditoria(obra.id_obra);
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

  // =========================================================================
  // Sprint 5: Handlers HU-027 a HU-033
  // =========================================================================

  // HU-027: Crear catálogo modificado a partir del original
  const handleCrearCatalogoModificado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedObraForCatalogo) return;
    setLoadingCatalogo(true);
    try {
      const payload: any = {
        descripcion: descModificado.trim() || undefined,
      };
      if (convenioModificadoId) payload.id_convenio = Number(convenioModificadoId);

      const res = await fetch(`/api/v1/catalogos/obra/${selectedObraForCatalogo.id_obra}/modificado`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const nuevoCat = await res.json();
        setCatalogoActual(nuevoCat);
        setIsCatalogoModificadoModalOpen(false);
        setDescModificado('');
        setConvenioModificadoId('');
        setCatalogoMsg({
          type: 'success',
          text: `HU-027: Catálogo modificado Versión ${nuevoCat.version} creado exitosamente clonando la estructura base sin alterar el original.`,
        });
        fetchTodosCatalogos(selectedObraForCatalogo.id_obra);
        fetchAuditoria(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al crear catálogo modificado.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de conexión al crear catálogo modificado.' });
    } finally {
      setLoadingCatalogo(false);
    }
  };

  // HU-028: Registrar concepto extraordinario
  const handleCrearExtraordinario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedObraForCatalogo) return;
    try {
      const payload = {
        clave_concepto: claveExtra.trim().toUpperCase(),
        descripcion: descExtra.trim(),
        unidad_medida: unidadExtra.trim().toUpperCase(),
        cantidad: Number(cantidadExtra),
        costo_directo_unitario: Number(puExtra),
        partida: partidaExtra.trim() || 'TRABAJOS EXTRAORDINARIOS',
        justificacion: justificacionExtra.trim() || undefined,
      };

      const res = await fetch(`/api/v1/catalogos/obra/${selectedObraForCatalogo.id_obra}/extraordinarios`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const nuevoConc = await res.json();
        setIsExtraordinarioModalOpen(false);
        setClaveExtra('');
        setDescExtra('');
        setCantidadExtra('');
        setPuExtra('');
        setJustificacionExtra('');
        setCatalogoMsg({
          type: 'success',
          text: `HU-028: Concepto extraordinario '${nuevoConc.clave_concepto}' registrado formalmente con importe calculado.`,
        });
        fetchTodosCatalogos(selectedObraForCatalogo.id_obra);
        // Si estamos viendo el catálogo extraordinario, refrescarlo
        if (catalogoActual?.id_catalogo === nuevoConc.id_catalogo) {
          seleccionarCatalogoPorId(nuevoConc.id_catalogo);
        } else {
          seleccionarCatalogoPorId(nuevoConc.id_catalogo);
        }
        fetchAuditoria(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al registrar concepto extraordinario.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de conexión al registrar concepto extraordinario.' });
    }
  };

  // HU-029: Registrar convenio relacionado con volumen
  const handleCrearConvenio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedObraForCatalogo) return;
    try {
      const payload: any = {
        numero_convenio: numConvenio.trim().toUpperCase(),
        tipo_convenio: tipoConvenio,
        descripcion: descConvenio.trim(),
        fecha_firma: fechaFirmaConvenio,
        monto_adicional: Number(montoConvenio) || 0,
        porcentaje_variacion: Number(pctConvenio) || 0,
        dias_ampliacion: Number(diasConvenio) || 0,
      };
      if (catalogoAsociadoConvenioId) {
        payload.id_catalogo = Number(catalogoAsociadoConvenioId);
      }

      const res = await fetch(`/api/v1/catalogos/obra/${selectedObraForCatalogo.id_obra}/convenios`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const nuevoConv = await res.json();
        setIsConvenioModalOpen(false);
        setNumConvenio('');
        setDescConvenio('');
        setMontoConvenio('');
        setPctConvenio('');
        setDiasConvenio(0);
        setCatalogoAsociadoConvenioId('');
        setCatalogoMsg({
          type: 'success',
          text: `HU-029: Convenio de volumen '${nuevoConv.numero_convenio}' registrado exitosamente y relacionado con la obra.`,
        });
        fetchConvenios(selectedObraForCatalogo.id_obra);
        fetchTodosCatalogos(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al registrar convenio.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de red al registrar convenio.' });
    }
  };

  // HU-030 / HU-031 / HU-033: Modificar cantidad de volumen con auditoría
  const handleModificarCantidadVolumen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !catalogoActual || !conceptoParaModificar) return;
    try {
      const res = await fetch(
        `/api/v1/catalogos/${catalogoActual.id_catalogo}/conceptos/${conceptoParaModificar.id_concepto}/cantidad`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cantidad_nueva: Number(nuevaCantidadVolumen),
            justificacion: justificacionVolumen.trim(),
          }),
        },
      );

      if (res.ok) {
        const concActualizado = await res.json();
        setIsModificarVolumenModalOpen(false);
        setConceptoParaModificar(null);
        setNuevaCantidadVolumen('');
        setJustificacionVolumen('');
        setCatalogoMsg({
          type: 'success',
          text: `HU-030/031: Volumen de '${concActualizado.clave_concepto}' modificado a ${concActualizado.cantidad}. Modificación registrada con auditoría y timestamp pericial.`,
        });
        seleccionarCatalogoPorId(catalogoActual.id_catalogo);
        if (selectedObraForCatalogo) fetchAuditoria(selectedObraForCatalogo.id_obra);
      } else {
        const err = await res.json().catch(() => ({}));
        setCatalogoMsg({ type: 'error', text: err.message || 'Error al modificar volumen del concepto.' });
      }
    } catch {
      setCatalogoMsg({ type: 'error', text: 'Error de conexión al modificar volumen.' });
    }
  };

  // =========================================================================
  // Sprint 6: Handlers de Bitácora y Reportes Diarios (HU-034 a HU-040)
  // =========================================================================

  // Consultar bitácora diaria con filtros (HU-040)
  const fetchBitacora = useCallback(
    async (idObra?: number, fechaInicio?: string, fechaFin?: string, clima?: string) => {
      if (!token) return;
      setLoadingBitacora(true);
      try {
        const params = new URLSearchParams();
        if (idObra) params.append('id_obra', String(idObra));
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);
        if (clima) params.append('clima', clima);

        const url = `/api/v1/reportes?${params.toString()}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReportesLista(Array.isArray(data) ? data : []);
        } else {
          setReportesLista([]);
        }
      } catch (err) {
        console.error('Error al consultar bitácora diaria:', err);
        setReportesLista([]);
      } finally {
        setLoadingBitacora(false);
      }
    },
    [token],
  );

  // Abrir modal de bitácora
  const openBitacoraModal = async (obra?: Obra) => {
    setSelectedObraForBitacora(obra || null);
    setFiltroBitacoraObraId(obra ? obra.id_obra : '');
    setFiltroBitacoraFechaInicio('');
    setFiltroBitacoraFechaFin('');
    setFiltroBitacoraClima('');
    setBitacoraMsg(null);
    setIsBitacoraModalOpen(true);
    await fetchBitacora(obra ? obra.id_obra : undefined);
  };

  // Abrir modal para nuevo reporte
  const openNuevoReporteModal = async (obra?: Obra) => {
    const targetObra = obra || selectedObraForBitacora;
    const availableObras = obrasList.length > 0 ? obrasList : myWorksList;
    const obraId = targetObra ? targetObra.id_obra : (availableObras[0]?.id_obra || '');
    setReporteObraId(obraId);
    setReporteFecha(todayStr);
    setReporteActividades('');
    setReporteClima('Soleado');
    setReporteTemperatura('');
    setReporteObservacionesClima('');
    setReporteSenalamiento(true);
    setReporteCondicionesSeguridad('Condiciones de obra adecuadas, señalización perimetral y pasillos despejados.');
    setReporteChecklistSeguridad({
      senalizacion: true,
      extintores: true,
      botiquin: true,
      orden_limpieza: true,
    });
    setReporteObservacionesSeguridad('');
    setReporteCumplimientoEPP(true);
    setReporteChecklistEPP({
      casco: true,
      chaleco: true,
      botas: true,
      guantes: true,
      lentes: true,
      arnes: false,
    });
    setReporteObservacionesEPP('Personal con equipo de protección personal reglamentario.');
    setReporteEstatusPersonal('Suficiente');
    setReporteCuadrilla([
      { categoria: 'Cabos de Oficios / Sobrestantes', cantidad: 1, descripcion: 'Control general y trazo' },
      { categoria: 'Albañiles / Oficiales de Albañilería', cantidad: 4, descripcion: 'Pegado de block y colado' },
      { categoria: 'Peones / Ayudantes Generales', cantidad: 6, descripcion: 'Acarreo de materiales y limpieza' },
    ]);
    setCategoriaPersonalSeleccionada('');
    setCategoriaPersonalOtro('');
    setNuevaCategoriaPersonal('');
    setNuevaCantidadPersonal('');
    setNuevaDescripcionPersonal('');
    setReporteMaquinaria([
      { tipo: 'Retroexcavadora (ej. CAT 416 / 420)', cantidad: 1, horas_uso: 7, estatus: 'Operativa', descripcion: 'Excavación para cimentación' },
    ]);
    setTipoMaquinariaSeleccionada('');
    setTipoMaquinariaOtro('');
    setNuevoTipoMaquinaria('');
    setNuevaCantidadMaquinaria('');
    setNuevasHorasMaquinaria('');
    setNuevoEstatusMaquinaria('Operativa');
    setNuevaActividadMaquinaria('');
    setReporteFotos([]);
    setNuevaFotoUrl('');
    setNuevaFotoDesc('');

    // Consultar último avance para sugerir
    if (obraId) {
      try {
        const res = await fetch(`/api/v1/reportes/obra/${obraId}/ultimo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const ultimo = await res.json();
          if (ultimo && ultimo.avance_fisico_acumulado) {
            setUltimoAvanceObra(Number(ultimo.avance_fisico_acumulado));
            setReporteAvanceFisico(Number(ultimo.avance_fisico_acumulado));
          } else {
            setUltimoAvanceObra(0);
            setReporteAvanceFisico(0);
          }
        }
      } catch {
        setUltimoAvanceObra(0);
        setReporteAvanceFisico(0);
      }
    } else {
      setUltimoAvanceObra(0);
      setReporteAvanceFisico(0);
    }

    setIsNuevoReporteModalOpen(true);
  };

  // Guardar reporte diario (HU-034 a HU-039)
  const handleGuardarReporteDiario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reporteObraId) return;

    if (!reporteActividades.trim()) {
      setBitacoraMsg({ type: 'error', text: 'HU-034: La descripción de actividades realizadas es obligatoria.' });
      return;
    }

    if (reporteAvanceFisico !== '' && Number(reporteAvanceFisico) < ultimoAvanceObra) {
      setBitacoraMsg({
        type: 'error',
        text: `El avance físico (${reporteAvanceFisico}%) no puede ser inferior al último registrado (${ultimoAvanceObra}%).`,
      });
      return;
    }

    const payload = {
      id_obra: Number(reporteObraId),
      fecha_reporte: reporteFecha,
      clima: reporteClima,
      temperatura_celsius: reporteTemperatura !== '' ? Number(reporteTemperatura) : undefined,
      observaciones_clima: reporteObservacionesClima.trim() || undefined,
      senalamiento_preventivo: reporteSenalamiento,
      condiciones_seguridad: reporteCondicionesSeguridad.trim() || undefined,
      checklist_seguridad: reporteChecklistSeguridad,
      observaciones_seguridad: reporteObservacionesSeguridad.trim() || undefined,
      equipo_proteccion_epp: reporteCumplimientoEPP,
      checklist_epp: reporteChecklistEPP,
      observaciones_epp: reporteObservacionesEPP.trim() || undefined,
      estatus_personal: reporteEstatusPersonal,
      resumen_cuadrilla: reporteCuadrilla,
      maquinaria_sitio: reporteMaquinaria,
      actividades_realizadas: reporteActividades.trim(),
      avance_fisico_acumulado: Number(reporteAvanceFisico) || 0,
      fotos: reporteFotos.length > 0 ? reporteFotos : undefined,
    };

    try {
      const res = await fetch('/api/v1/reportes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const nuevoReporte = await res.json();
        setIsNuevoReporteModalOpen(false);
        setBitacoraMsg({
          type: 'success',
          text: `HU-034 a HU-039: Reporte diario del día ${nuevoReporte.fecha_reporte} registrado exitosamente en la bitácora de supervisión.`,
        });
        fetchBitacora(selectedObraForBitacora ? selectedObraForBitacora.id_obra : undefined);
      } else {
        const err = await res.json().catch(() => ({}));
        setBitacoraMsg({ type: 'error', text: err.message || 'Error al guardar el reporte diario.' });
      }
    } catch {
      setBitacoraMsg({ type: 'error', text: 'Error de red al guardar el reporte diario.' });
    }
  };

  // Manejadores para cuadrillas de personal (HU-038)
  const handleAgregarPersonalCuadrilla = () => {
    let catFinal = '';
    if (categoriaPersonalSeleccionada === 'Otro (especificar)') {
      catFinal = categoriaPersonalOtro.trim();
    } else if (categoriaPersonalSeleccionada.trim()) {
      catFinal = categoriaPersonalSeleccionada.trim();
    } else if (nuevaCategoriaPersonal.trim()) {
      catFinal = nuevaCategoriaPersonal.trim();
    }

    if (!catFinal || nuevaCantidadPersonal === '' || Number(nuevaCantidadPersonal) <= 0) return;
    setReporteCuadrilla((prev) => [
      ...prev,
      {
        categoria: catFinal,
        cantidad: Number(nuevaCantidadPersonal),
        descripcion: nuevaDescripcionPersonal.trim() || undefined,
      },
    ]);
    setCategoriaPersonalSeleccionada('');
    setCategoriaPersonalOtro('');
    setNuevaCategoriaPersonal('');
    setNuevaCantidadPersonal('');
    setNuevaDescripcionPersonal('');
  };

  const handleEliminarPersonalCuadrilla = (index: number) => {
    setReporteCuadrilla((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Manejadores para maquinaria en sitio (HU-039)
  const handleAgregarMaquinaria = () => {
    let tipoFinal = '';
    if (tipoMaquinariaSeleccionada === 'Otro (especificar)') {
      tipoFinal = tipoMaquinariaOtro.trim();
    } else if (tipoMaquinariaSeleccionada.trim()) {
      tipoFinal = tipoMaquinariaSeleccionada.trim();
    } else if (nuevoTipoMaquinaria.trim()) {
      tipoFinal = nuevoTipoMaquinaria.trim();
    }

    if (!tipoFinal || nuevaCantidadMaquinaria === '' || Number(nuevaCantidadMaquinaria) <= 0) return;
    setReporteMaquinaria((prev) => [
      ...prev,
      {
        tipo: tipoFinal,
        cantidad: Number(nuevaCantidadMaquinaria),
        horas_uso: nuevasHorasMaquinaria !== '' ? Number(nuevasHorasMaquinaria) : 8,
        estatus: nuevoEstatusMaquinaria || 'Operativa',
        descripcion: nuevaActividadMaquinaria.trim() || undefined,
      },
    ]);
    setTipoMaquinariaSeleccionada('');
    setTipoMaquinariaOtro('');
    setNuevoTipoMaquinaria('');
    setNuevaCantidadMaquinaria('');
    setNuevasHorasMaquinaria('');
    setNuevoEstatusMaquinaria('Operativa');
    setNuevaActividadMaquinaria('');
  };

  const handleEliminarMaquinaria = (index: number) => {
    setReporteMaquinaria((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Manejadores de fotografías y evidencias documentales (RF-13)
  const handleSubirArchivoEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    if (reporteFotos.length + files.length > 6) {
      setBitacoraMsg({
        type: 'error',
        text: `Normativa RF-13: Se permite un máximo de 6 evidencias por reporte diario. Actualmente tiene ${reporteFotos.length} y seleccionó ${files.length}.`,
      });
      return;
    }

    setSubiendoArchivo(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('archivo', file);

        const res = await fetch('/api/v1/reportes/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setReporteFotos((prev) => {
            if (prev.length >= 6) return prev;
            return [
              ...prev,
              {
                numero_foto: prev.length + 1,
                url_archivo: data.url_archivo,
                descripcion_foto: file.name.replace(/\.[^/.]+$/, ''),
                nombre_archivo: file.name,
                tipo_archivo: data.tipo_archivo || getTipoArchivoFromUrl(data.url_archivo),
              },
            ];
          });
        } else {
          const err = await res.json().catch(() => ({}));
          setBitacoraMsg({
            type: 'error',
            text: err.message || `Error al subir el archivo ${file.name}.`,
          });
        }
      }
    } catch {
      setBitacoraMsg({
        type: 'error',
        text: 'Error de conexión al cargar la evidencia al servidor.',
      });
    } finally {
      setSubiendoArchivo(false);
      e.target.value = '';
    }
  };

  const handleAgregarFoto = () => {
    if (!nuevaFotoUrl.trim() || reporteFotos.length >= 6) return;
    const tipo = getTipoArchivoFromUrl(nuevaFotoUrl.trim());
    setReporteFotos((prev) => [
      ...prev,
      {
        numero_foto: prev.length + 1,
        url_archivo: nuevaFotoUrl.trim(),
        descripcion_foto: nuevaFotoDesc.trim() || `Evidencia fotográfica ${prev.length + 1}`,
        tipo_archivo: tipo,
      },
    ]);
    setNuevaFotoUrl('');
    setNuevaFotoDesc('');
  };

  const handleEliminarFoto = (index: number) => {
    setReporteFotos((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((foto, idx) => ({ ...foto, numero_foto: idx + 1 })),
    );
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => openBitacoraModal()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition border border-indigo-500"
                title="HU-040: Consultar Bitácora Diaria y Reportes de Supervisión"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bitácora Diaria</span>
              </button>

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
                        Cédula Profesional (Obligatoria para Terna Técnica)
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
                                    <span>Catálogo de Conceptos</span>
                                  </button>

                                  <button
                                    onClick={() => openBitacoraModal(obra)}
                                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center space-x-1 shadow-sm"
                                    title="Consultar bitácora diaria y reportes de supervisión"
                                  >
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    <span>Bitácora Diaria</span>
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

                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <button
                              onClick={() => openCatalogoModal(obra)}
                              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Catálogo de Conceptos</span>
                            </button>
                            <button
                              onClick={() => openBitacoraModal(obra)}
                              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              <span>Bitácora Diaria de Supervisión</span>
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
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70]"
          style={{ zIndex: 70 }}
        >
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
      {/* SPRINT 5: SUB-MODALES HU-027, HU-028, HU-029, HU-030/031 (Z-INDEX 70)        */}
      {/* ========================================================================= */}

      {/* MODAL HU-027: CREAR CATÁLOGO MODIFICADO A PARTIR DEL ORIGINAL */}
      {isCatalogoModificadoModalOpen && selectedObraForCatalogo && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70]"
          style={{ zIndex: 70 }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-blue-900 flex items-center">
                <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-600" /> HU-027: Crear Catálogo Modificado
              </h3>
              <button onClick={() => setIsCatalogoModificadoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearCatalogoModificado} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                <span className="font-bold flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-blue-600" />
                  Preservación del Catálogo Original (Art. 59 LOPSRM)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Se clonará la estructura completa de partidas, subpartidas y conceptos del catálogo base. El catálogo original{' '}
                  <strong>permanecerá 100% inalterado</strong> para garantizar la trazabilidad de la auditoría.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción u Objeto de la Modificación
                </label>
                <textarea
                  rows={3}
                  required
                  value={descModificado}
                  onChange={(e) => setDescModificado(e.target.value)}
                  placeholder="Justifique los motivos de los ajustes de volumen o variaciones técnicas..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Convenio Modificatorio Asociado (Opcional)
                </label>
                <select
                  value={convenioModificadoId}
                  onChange={(e) => setConvenioModificadoId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Sin convenio previo / Generar catálogo independiente --</option>
                  {conveniosLista.map((c) => (
                    <option key={c.id_convenio} value={c.id_convenio}>
                      {c.numero_convenio} — {c.descripcion.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatalogoModificadoModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Crear Versión Modificada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HU-028: REGISTRAR CONCEPTO EXTRAORDINARIO */}
      {isExtraordinarioModalOpen && selectedObraForCatalogo && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70]"
          style={{ zIndex: 70 }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-purple-900 flex items-center">
                  <Sparkles className="w-5 h-5 text-purple-600 mr-2" /> HU-028: Registrar Concepto Extraordinario
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Incorporación de trabajos no contemplados en el catálogo original
                </p>
              </div>
              <button onClick={() => setIsExtraordinarioModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearExtraordinario} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Identificador / Clave Única (HU-028)
                  </label>
                  <input
                    type="text"
                    required
                    value={claveExtra}
                    onChange={(e) => setClaveExtra(e.target.value.toUpperCase())}
                    placeholder="EXT-001"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Agrupación / Partida
                  </label>
                  <input
                    type="text"
                    value={partidaExtra}
                    onChange={(e) => setPartidaExtra(e.target.value)}
                    placeholder="TRABAJOS EXTRAORDINARIOS"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción Técnica del Concepto Extraordinario
                </label>
                <textarea
                  rows={3}
                  required
                  value={descExtra}
                  onChange={(e) => setDescExtra(e.target.value)}
                  placeholder="Detalle de las actividades, equipo, materiales y mano de obra requeridos..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unidad
                  </label>
                  <select
                    value={unidadExtra}
                    onChange={(e) => setUnidadExtra(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    <option value="M3">M3</option>
                    <option value="M2">M2</option>
                    <option value="ML">ML</option>
                    <option value="PZA">PZA</option>
                    <option value="KG">KG</option>
                    <option value="TON">TON</option>
                    <option value="LOTE">LOTE</option>
                    <option value="VIAJE">VIAJE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cantidad Autorizada
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={cantidadExtra}
                    onChange={(e) => setCantidadExtra(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50.00"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    P.U. Analizado ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={puExtra}
                    onChange={(e) => setPuExtra(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="450.00"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Justificación Técnica / Dictamen de Residencia
                </label>
                <input
                  type="text"
                  value={justificacionExtra}
                  onChange={(e) => setJustificacionExtra(e.target.value)}
                  placeholder="Motivo que originó la no previsión en el proyecto ejecutivo..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Previsualización del Importe */}
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-purple-900 font-semibold block text-[11px]">
                    Importe Extraordinario Calculado:
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {cantidadExtra || 0} {unidadExtra} × {formatMoney(Number(puExtra) || 0)}
                  </span>
                </div>
                <div className="text-sm font-bold font-mono text-purple-900">
                  {formatMoney((Number(cantidadExtra) || 0) * (Number(puExtra) || 0))}
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExtraordinarioModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Guardar Extraordinario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HU-029: REGISTRAR CONVENIO DE VOLUMEN */}
      {isConvenioModalOpen && selectedObraForCatalogo && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70]"
          style={{ zIndex: 70 }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <FileCheck className="w-5 h-5 mr-2 text-emerald-600" /> HU-029: Registrar Convenio de Volumen
              </h3>
              <button onClick={() => setIsConvenioModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearConvenio} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Número de Convenio
                  </label>
                  <input
                    type="text"
                    required
                    value={numConvenio}
                    onChange={(e) => setNumConvenio(e.target.value.toUpperCase())}
                    placeholder="CONV-VOL-01/2026"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Convenio
                  </label>
                  <select
                    value={tipoConvenio}
                    onChange={(e) => setTipoConvenio(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="MODIFICATORIO_VOLUMEN">Modificatorio de Volumen</option>
                    <option value="CONCEPTO_EXTRAORDINARIO">Conceptos Extraordinarios</option>
                    <option value="PLAZO">Ampliación de Plazo</option>
                    <option value="MIXTO">Mixto (Monto, Volumen y Plazo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Objeto y Descripción del Convenio
                </label>
                <textarea
                  rows={3}
                  required
                  value={descConvenio}
                  onChange={(e) => setDescConvenio(e.target.value)}
                  placeholder="Describa el alcance de las variaciones volumétricas y justificación legal..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha de Firma
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaFirmaConvenio}
                    onChange={(e) => setFechaFirmaConvenio(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Monto Adicional ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoConvenio}
                    onChange={(e) => setMontoConvenio(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    % Variación
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="25"
                    value={pctConvenio}
                    onChange={(e) => setPctConvenio(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Max 25%"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Días de Ampliación de Plazo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={diasConvenio}
                    onChange={(e) => setDiasConvenio(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Catálogo Modificado Asociado
                  </label>
                  <select
                    value={catalogoAsociadoConvenioId}
                    onChange={(e) => setCatalogoAsociadoConvenioId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Opcional / Seleccionar Catálogo --</option>
                    {catalogosLista.map((c) => (
                      <option key={c.id_catalogo} value={c.id_catalogo}>
                        {c.tipo_catalogo} v{c.version}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConvenioModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Guardar Convenio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HU-030/031/033: MODIFICAR CANTIDAD DE CONCEPTO CON AUDITORÍA PERICIAL */}
      {isModificarVolumenModalOpen && conceptoParaModificar && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70]"
          style={{ zIndex: 70 }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-600" /> HU-030/031: Modificar Volumen
                </h3>
                <span className="font-mono text-xs font-bold text-blue-700">
                  {conceptoParaModificar.clave_concepto}
                </span>
              </div>
              <button onClick={() => setIsModificarVolumenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModificarCantidadVolumen} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                <span className="font-bold block mb-1">Concepto:</span>
                <p className="line-clamp-2 text-[11px] text-slate-600 leading-snug">
                  {conceptoParaModificar.descripcion}
                </p>
                <div className="mt-2 flex justify-between font-mono text-[11px] pt-2 border-t border-slate-200">
                  <span>
                    Volumen Actual: <strong>{conceptoParaModificar.cantidad} {conceptoParaModificar.unidad_medida}</strong>
                  </span>
                  <span>
                    P.U.: <strong>{formatMoney(Number(conceptoParaModificar.costo_directo_unitario))}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nueva Cantidad / Volumen Autorizado
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={nuevaCantidadVolumen}
                  onChange={(e) => setNuevaCantidadVolumen(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Nueva cantidad autorizada..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-base font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Justificación Técnica de la Modificación (Obligatoria para Auditoría HU-033)
                </label>
                <textarea
                  rows={3}
                  required
                  value={justificacionVolumen}
                  onChange={(e) => setJustificacionVolumen(e.target.value)}
                  placeholder="Detalle el convenio, bitácora o dictamen que sustenta la variación del volumen..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Se registrará automáticamente su usuario ({currentUser?.nombre_completo}) y timestamp oficial.
                </span>
              </div>

              {/* Previsualización del Nuevo Importe */}
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-blue-900 font-semibold block text-[11px]">
                    Nuevo Importe Calculado:
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {nuevaCantidadVolumen || 0} {conceptoParaModificar.unidad_medida} ×{' '}
                    {formatMoney(Number(conceptoParaModificar.costo_directo_unitario))}
                  </span>
                </div>
                <div className="text-sm font-bold font-mono text-blue-900">
                  {formatMoney(
                    (Number(nuevaCantidadVolumen) || 0) * Number(conceptoParaModificar.costo_directo_unitario),
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModificarVolumenModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Confirmar Modificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPRINT 6 - MODAL 1 (HU-040): CONSULTAR BITÁCORA DIARIA DE SUPERVISIÓN     */}
      {/* ========================================================================= */}
      {isBitacoraModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-[60]"
          style={{ zIndex: 60 }}
        >
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh] flex flex-col">
            {/* Cabecera del Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                      Bitácora Diaria y Reportes de Supervisión
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedObraForBitacora
                        ? `Obra: ${selectedObraForBitacora.clave_obra} — ${selectedObraForBitacora.nombre_obra}`
                        : 'Consulta general de reportes diarios de supervisión de obras públicas'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                {(currentUser?.rol?.nombre_rol === 'SUPERVISOR' ||
                  currentUser?.rol?.nombre_rol === 'ADMINISTRADOR') && (
                  <button
                    onClick={() => openNuevoReporteModal(selectedObraForBitacora || undefined)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Registrar Reporte Diario (HU-034)</span>
                  </button>
                )}
                <button
                  onClick={() => setIsBitacoraModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mensajes de Alerta */}
            {bitacoraMsg && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs border flex items-center justify-between ${
                  bitacoraMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span>{bitacoraMsg.text}</span>
                <button
                  onClick={() => setBitacoraMsg(null)}
                  className="font-bold hover:underline ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Barra de Filtros Periciales (HU-040) */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {!selectedObraForBitacora && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Filtrar por Obra
                  </label>
                  <select
                    value={filtroBitacoraObraId}
                    onChange={(e) =>
                      setFiltroBitacoraObraId(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  >
                    <option value="">-- Todas las obras --</option>
                    {(obrasList.length > 0 ? obrasList : myWorksList).map((o) => (
                      <option key={o.id_obra} value={o.id_obra}>
                        {o.clave_obra} - {o.nombre_obra.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtroBitacoraFechaInicio}
                  onChange={(e) => setFiltroBitacoraFechaInicio(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtroBitacoraFechaFin}
                  onChange={(e) => setFiltroBitacoraFechaFin(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Condición Climática (HU-035)
                </label>
                <select
                  value={filtroBitacoraClima}
                  onChange={(e) => setFiltroBitacoraClima(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="">-- Todo tipo de clima --</option>
                  <option value="Soleado">Soleado</option>
                  <option value="Parcialmente Nublado">Parcialmente Nublado</option>
                  <option value="Nublado">Nublado</option>
                  <option value="Lluvia Ligera">Lluvia Ligera</option>
                  <option value="Lluvia Fuerte">Lluvia Fuerte</option>
                  <option value="Tormenta">Tormenta</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-4 flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFiltroBitacoraFechaInicio('');
                    setFiltroBitacoraFechaFin('');
                    setFiltroBitacoraClima('');
                    if (!selectedObraForBitacora) setFiltroBitacoraObraId('');
                    fetchBitacora(selectedObraForBitacora ? selectedObraForBitacora.id_obra : undefined);
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Limpiar Filtros
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fetchBitacora(
                      filtroBitacoraObraId ? Number(filtroBitacoraObraId) : selectedObraForBitacora?.id_obra,
                      filtroBitacoraFechaInicio || undefined,
                      filtroBitacoraFechaFin || undefined,
                      filtroBitacoraClima || undefined,
                    )
                  }
                  className="px-4 py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold flex items-center space-x-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Aplicar Filtros (HU-040)</span>
                </button>
              </div>
            </div>

            {/* Listado de Reportes Diarios */}
            <div className="mt-4 flex-1">
              {loadingBitacora ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs">Consultando bitácora diaria de supervisión...</p>
                </div>
              ) : reportesLista.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8">
                  <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">Sin reportes diarios registrados</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    No se encontraron reportes diarios con los filtros seleccionados. Como Supervisor, utilice el botón superior para capturar la jornada de obra.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Tarjetas de Reportes */}
                  {reportesLista.map((rep) => {
                    const totalPersonal = rep.resumen_cuadrilla
                      ? rep.resumen_cuadrilla.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0)
                      : 0;
                    const totalMaquinaria = rep.maquinaria_sitio
                      ? rep.maquinaria_sitio.reduce((acc, m) => acc + (Number(m.cantidad) || 0), 0)
                      : 0;

                    return (
                      <div
                        key={rep.id_reporte}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                              📅 {rep.fecha_reporte}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {rep.obra?.clave_obra || `Obra #${rep.id_obra}`}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Clima badge (HU-035) */}
                            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              {rep.clima.includes('Lluvia') || rep.clima.includes('Tormenta') ? (
                                <CloudRain className="w-3.5 h-3.5 mr-1 text-blue-600" />
                              ) : (
                                <Sun className="w-3.5 h-3.5 mr-1 text-amber-500" />
                              )}
                              {rep.clima} {rep.temperatura_celsius ? `(${rep.temperatura_celsius}°C)` : ''}
                            </span>

                            {/* Seguridad / EPP badges (HU-036, HU-037) */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                rep.equipo_proteccion_epp
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              EPP: {rep.equipo_proteccion_epp ? '100% CUMPLE' : 'INCOMPLETO'}
                            </span>

                            <button
                              onClick={() => setReporteSeleccionadoDetalle(rep)}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Detalle</span>
                            </button>
                          </div>
                        </div>

                        {/* Actividades realizadas (HU-034) */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Actividades de la Jornada (HU-034):
                          </span>
                          <p className="text-xs text-slate-700 mt-0.5 font-medium line-clamp-2">
                            {rep.actividades_realizadas || 'Sin descripción capturada.'}
                          </p>
                        </div>

                        {/* Métricas clave: Personal, Maquinaria, Avance acumulado */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Personal Presente (HU-038):</span>
                            <strong className="text-slate-800 font-semibold flex items-center">
                              <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                              {totalPersonal} personas ({rep.estatus_personal})
                            </strong>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Maquinaria en Sitio (HU-039):</span>
                            <strong className="text-slate-800 font-semibold flex items-center">
                              <Truck className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              {totalMaquinaria} equipos operados
                            </strong>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Avance Físico Acumulado:</span>
                            <strong className="text-emerald-700 font-bold font-mono">
                              {rep.avance_fisico_acumulado}%
                            </strong>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Supervisor Responsable:</span>
                            <span className="text-slate-700 font-medium truncate block">
                              {rep.supervisor?.nombre_completo || 'Supervisor'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPRINT 6 - MODAL 2 (HU-034 A HU-039): FORMULARIO NUEVO REPORTE DIARIO     */}
      {/* ========================================================================= */}
      {isNuevoReporteModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-[70]"
          style={{ zIndex: 70 }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" />
                  HU-034 a HU-039: Captura de Reporte Diario de Supervisión
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documentación formal de actividades, clima, seguridad, EPP, personal y maquinaria en sitio
                </p>
              </div>
              <button
                onClick={() => setIsNuevoReporteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarReporteDiario} className="mt-4 space-y-6 text-xs">
              {/* SECCIÓN 1: DATOS GENERALES Y ACTIVIDADES (HU-034) */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-indigo-600" />
                  1. Datos Generales de la Jornada y Actividades Realizadas (HU-034)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Obra Pública
                    </label>
                    <select
                      value={reporteObraId}
                      onChange={(e) => setReporteObraId(Number(e.target.value))}
                      required
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Seleccionar Obra --</option>
                      {(obrasList.length > 0 ? obrasList : myWorksList).map((o) => (
                        <option key={o.id_obra} value={o.id_obra}>
                          {o.clave_obra} - {o.nombre_obra.substring(0, 30)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Fecha de la Jornada
                    </label>
                    <input
                      type="date"
                      required
                      value={reporteFecha}
                      onChange={(e) => setReporteFecha(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Avance Físico Acumulado (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={ultimoAvanceObra}
                      max="100"
                      value={reporteAvanceFisico}
                      onChange={(e) =>
                        setReporteAvanceFisico(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder={`Mínimo ${ultimoAvanceObra}%`}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Último avance registrado: {ultimoAvanceObra}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Actividades Realizadas Durante la Jornada (HU-034) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reporteActividades}
                    onChange={(e) => setReporteActividades(e.target.value)}
                    placeholder="Documente en detalle los frentes de trabajo atendidos, colados, excavaciones, habilitado de acero, etc."
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: CONDICIONES METEOROLÓGICAS (HU-035) */}
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-3">
                <h4 className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center">
                  <Sun className="w-4 h-4 mr-1.5 text-amber-600" />
                  2. Condiciones Meteorológicas (HU-035)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Estado del Tiempo
                    </label>
                    <select
                      value={reporteClima}
                      onChange={(e) => setReporteClima(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      <option value="Soleado">☀️ Soleado</option>
                      <option value="Parcialmente Nublado">⛅ Parcialmente Nublado</option>
                      <option value="Nublado">☁️ Nublado</option>
                      <option value="Lluvia Ligera">🌦️ Lluvia Ligera</option>
                      <option value="Lluvia Fuerte">🌧️ Lluvia Fuerte</option>
                      <option value="Tormenta">⛈️ Tormenta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Temperatura Estimada (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={reporteTemperatura}
                      onChange={(e) =>
                        setReporteTemperatura(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="Ej. 24.5"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Observaciones de Clima
                    </label>
                    <input
                      type="text"
                      value={reporteObservacionesClima}
                      onChange={(e) => setReporteObservacionesClima(e.target.value)}
                      placeholder="Viento moderado, sin suspensión"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: CONDICIONES DE SEGURIDAD (HU-036) */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-950 uppercase tracking-wider text-[11px] flex items-center">
                    <Shield className="w-4 h-4 mr-1.5 text-blue-600" />
                    3. Condiciones de Seguridad de la Obra (HU-036)
                  </h4>
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={reporteSenalamiento}
                      onChange={(e) => setReporteSenalamiento(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Señalamiento Preventivo Activo</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistSeguridad.senalizacion}
                      onChange={(e) =>
                        setReporteChecklistSeguridad({
                          ...reporteChecklistSeguridad,
                          senalizacion: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span>Señalización vial/perimetral</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistSeguridad.extintores}
                      onChange={(e) =>
                        setReporteChecklistSeguridad({
                          ...reporteChecklistSeguridad,
                          extintores: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span>Extintores vigentes</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistSeguridad.botiquin}
                      onChange={(e) =>
                        setReporteChecklistSeguridad({
                          ...reporteChecklistSeguridad,
                          botiquin: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span>Botiquín de emergencias</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistSeguridad.orden_limpieza}
                      onChange={(e) =>
                        setReporteChecklistSeguridad({
                          ...reporteChecklistSeguridad,
                          orden_limpieza: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span>Orden y limpieza de pasillos</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Observaciones de Medidas Preventivas e Incidencias (HU-036)
                  </label>
                  <input
                    type="text"
                    value={reporteCondicionesSeguridad}
                    onChange={(e) => setReporteCondicionesSeguridad(e.target.value)}
                    placeholder="Área de obra segura sin riesgos inminentes detectados."
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* SECCIÓN 4: CUMPLIMIENTO DEL EPP (HU-037) */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center">
                    <HardHat className="w-4 h-4 mr-1.5 text-emerald-600" />
                    4. Cumplimiento de Equipo de Protección Personal - EPP (HU-037)
                  </h4>
                  <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={reporteCumplimientoEPP}
                      onChange={(e) => setReporteCumplimientoEPP(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Cumplimiento General del EPP</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistEPP.casco}
                      onChange={(e) =>
                        setReporteChecklistEPP({ ...reporteChecklistEPP, casco: e.target.checked })
                      }
                      className="rounded text-emerald-600 w-3.5 h-3.5"
                    />
                    <span>Casco rígido</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistEPP.chaleco}
                      onChange={(e) =>
                        setReporteChecklistEPP({ ...reporteChecklistEPP, chaleco: e.target.checked })
                      }
                      className="rounded text-emerald-600 w-3.5 h-3.5"
                    />
                    <span>Chaleco reflejante</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistEPP.botas}
                      onChange={(e) =>
                        setReporteChecklistEPP({ ...reporteChecklistEPP, botas: e.target.checked })
                      }
                      className="rounded text-emerald-600 w-3.5 h-3.5"
                    />
                    <span>Botas con casquillo</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistEPP.guantes}
                      onChange={(e) =>
                        setReporteChecklistEPP({ ...reporteChecklistEPP, guantes: e.target.checked })
                      }
                      className="rounded text-emerald-600 w-3.5 h-3.5"
                    />
                    <span>Guantes de trabajo</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistEPP.lentes}
                      onChange={(e) =>
                        setReporteChecklistEPP({ ...reporteChecklistEPP, lentes: e.target.checked })
                      }
                      className="rounded text-emerald-600 w-3.5 h-3.5"
                    />
                    <span>Lentes de seguridad</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reporteChecklistEPP.arnes}
                      onChange={(e) =>
                        setReporteChecklistEPP({ ...reporteChecklistEPP, arnes: e.target.checked })
                      }
                      className="rounded text-emerald-600 w-3.5 h-3.5"
                    />
                    <span>Arnés contra caídas</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Observaciones sobre Cumplimiento del EPP (HU-037)
                  </label>
                  <input
                    type="text"
                    value={reporteObservacionesEPP}
                    onChange={(e) => setReporteObservacionesEPP(e.target.value)}
                    placeholder="Todo el personal cuenta con equipo reglamentario en buenas condiciones."
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* SECCIÓN 5: PERSONAL PRESENTE / CUADRILLAS (HU-038) */}
              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-purple-950 uppercase tracking-wider text-[11px] flex items-center">
                    <Users className="w-4 h-4 mr-1.5 text-purple-600" />
                    5. Personal Presente en Obra y Cuadrillas (HU-038)
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Total en Sitio:</span>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {reporteCuadrilla.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0)} operarios
                    </span>
                    <select
                      value={reporteEstatusPersonal}
                      onChange={(e) => setReporteEstatusPersonal(e.target.value)}
                      className="p-1 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700"
                    >
                      <option value="Suficiente">Suficiente</option>
                      <option value="Insuficiente">Insuficiente</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Cuadrillas Actuales */}
                <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {reporteCuadrilla.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800">{item.categoria}</strong>
                        {item.descripcion && (
                          <span className="text-slate-500 ml-2 italic text-[11px]">— {item.descripcion}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {item.cantidad} trabajadores
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEliminarPersonalCuadrilla(idx)}
                          className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agregar Nuevo Personal a Cuadrilla con Catálogo */}
                <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className={categoriaPersonalSeleccionada === 'Otro (especificar)' ? 'sm:col-span-4' : 'sm:col-span-8'}>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Catálogo de Especialidades / Oficios
                      </label>
                      <select
                        value={categoriaPersonalSeleccionada}
                        onChange={(e) => setCategoriaPersonalSeleccionada(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                      >
                        <option value="">-- Seleccionar Categoría de Personal --</option>
                        {CATALOGO_CATEGORIAS_PERSONAL.map((cat, i) => (
                          <option key={i} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {categoriaPersonalSeleccionada === 'Otro (especificar)' && (
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Especificar Puesto / Especialidad</label>
                        <input
                          type="text"
                          value={categoriaPersonalOtro}
                          onChange={(e) => setCategoriaPersonalOtro(e.target.value)}
                          placeholder="Nombre del oficio o puesto"
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={nuevaCantidadPersonal}
                        onChange={(e) =>
                          setNuevaCantidadPersonal(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Cant."
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAgregarPersonalCuadrilla}
                        className="w-full p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition flex items-center justify-center shadow-xs"
                      >
                        + Agregar Personal
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Descripción de la actividad / Frente asignado
                    </label>
                    <input
                      type="text"
                      value={nuevaDescripcionPersonal}
                      onChange={(e) => setNuevaDescripcionPersonal(e.target.value)}
                      placeholder="Ej. Armado de acero en columnas eje 3 a 5, colado de firmes y cimbrado"
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: MAQUINARIA UTILIZADA (HU-039) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center">
                    <Truck className="w-4 h-4 mr-1.5 text-amber-600" />
                    6. Maquinaria y Equipo Utilizado en Sitio (HU-039)
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {reporteMaquinaria.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0)} máquinas en sitio
                  </span>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {reporteMaquinaria.map((maq, idx) => (
                    <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <strong className="text-slate-800">{maq.tipo}</strong>
                        <span className="text-slate-500 ml-2 font-medium">({maq.estatus || 'Operativa'})</span>
                        {maq.descripcion && (
                          <span className="text-slate-500 ml-2 italic text-[11px] block sm:inline">— {maq.descripcion}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {maq.cantidad} unid. ({maq.horas_uso || 0} hrs)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEliminarMaquinaria(idx)}
                          className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agregar Nueva Maquinaria con Catálogo y Actividad */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className={tipoMaquinariaSeleccionada === 'Otro (especificar)' ? 'sm:col-span-4' : 'sm:col-span-5'}>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Catálogo de Maquinaria y Equipo
                      </label>
                      <select
                        value={tipoMaquinariaSeleccionada}
                        onChange={(e) => setTipoMaquinariaSeleccionada(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-500 text-xs"
                      >
                        <option value="">-- Seleccionar Maquinaria / Equipo --</option>
                        {CATALOGO_MAQUINARIA_EQUIPO.map((m, i) => (
                          <option key={i} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {tipoMaquinariaSeleccionada === 'Otro (especificar)' && (
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Especificar Equipo</label>
                        <input
                          type="text"
                          value={tipoMaquinariaOtro}
                          onChange={(e) => setTipoMaquinariaOtro(e.target.value)}
                          placeholder="Marca o modelo"
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-500 text-xs"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={nuevaCantidadMaquinaria}
                        onChange={(e) =>
                          setNuevaCantidadMaquinaria(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Cant. maq."
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Horas Prog./Uso</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={nuevasHorasMaquinaria}
                        onChange={(e) =>
                          setNuevasHorasMaquinaria(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Horas"
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Estatus Operativo</label>
                      <select
                        value={nuevoEstatusMaquinaria}
                        onChange={(e) => setNuevoEstatusMaquinaria(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-500 text-xs"
                      >
                        <option value="Operativa">Operativa</option>
                        <option value="En Mantenimiento">En Mantenimiento</option>
                        <option value="Stand-by">Stand-by</option>
                        <option value="Fuera de Servicio">Fuera de Servicio</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-9">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Actividad específica / Frente en que se ocupa
                      </label>
                      <input
                        type="text"
                        value={nuevaActividadMaquinaria}
                        onChange={(e) => setNuevaActividadMaquinaria(e.target.value)}
                        placeholder="Ej. Carga y acarreo de material producto de excavación, compactación de base hidráulica"
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-slate-500 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAgregarMaquinaria}
                        className="w-full p-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center shadow-xs"
                      >
                        + Agregar Maquinaria
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 7: EVIDENCIA FOTOGRÁFICA Y DOCUMENTAL (RF-13 - MÁXIMO 6 ARCHIVOS) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      7. Evidencia Fotográfica y Documental (Máx. 6 Archivos)
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {reporteFotos.length} / 6 evidencias
                    </span>
                    <button
                      type="button"
                      onClick={() => setModoUrlManual(!modoUrlManual)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                    >
                      {modoUrlManual ? 'Subir Archivo Local' : 'Ingresar URL Manual'}
                    </button>
                  </div>
                </div>

                {/* Lista de Evidencias Cargadas */}
                {reporteFotos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    {reporteFotos.map((foto, idx) => {
                      const tipo = foto.tipo_archivo || getTipoArchivoFromUrl(foto.url_archivo);
                      return (
                        <div
                          key={idx}
                          className="relative group p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2 text-xs"
                        >
                          <div className="flex items-start space-x-2">
                            {tipo === 'image' ? (
                              <div className="w-14 h-14 rounded-md overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 flex items-center justify-center">
                                <img
                                  src={foto.url_archivo}
                                  alt={foto.descripcion_foto || `Evidencia ${foto.numero_foto}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : tipo === 'pdf' ? (
                              <div className="w-14 h-14 rounded-md bg-rose-50 border border-rose-200 flex-shrink-0 flex flex-col items-center justify-center text-rose-600">
                                <FileText className="w-6 h-6" />
                                <span className="text-[9px] font-bold font-mono uppercase mt-0.5">PDF</span>
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-md bg-blue-50 border border-blue-200 flex-shrink-0 flex flex-col items-center justify-center text-blue-600">
                                <File className="w-6 h-6" />
                                <span className="text-[9px] font-bold font-mono uppercase mt-0.5">DOCX</span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-800 text-[11px] block truncate">
                                #{foto.numero_foto}: {foto.nombre_archivo || `Archivo ${foto.numero_foto}`}
                              </span>
                              <input
                                type="text"
                                value={foto.descripcion_foto || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReporteFotos((prev) =>
                                    prev.map((f, i) =>
                                      i === idx ? { ...f, descripcion_foto: val } : f,
                                    ),
                                  );
                                }}
                                placeholder="Pie de evidencia / descripción"
                                className="w-full mt-1 p-1 text-[11px] rounded border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <a
                              href={foto.url_archivo}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold inline-flex items-center space-x-1"
                            >
                              <span>Ver Archivo</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleEliminarFoto(idx)}
                              className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Zona de Carga de Archivos */}
                {reporteFotos.length < 6 && (
                  <div>
                    {!modoUrlManual ? (
                      <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition rounded-xl p-4 text-center cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.docx,.doc"
                          onChange={handleSubirArchivoEvidencia}
                          disabled={subiendoArchivo}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <UploadCloud className="w-7 h-7 text-indigo-500" />
                          <span className="font-bold text-slate-800 text-xs">
                            {subiendoArchivo ? 'Subiendo archivo al servidor...' : 'Haz clic o arrastra tus archivos aquí'}
                          </span>
                          <p className="text-[10px] text-slate-500 max-w-md">
                            Soporta <strong>Imágenes (JPG, PNG, WEBP, GIF)</strong>, <strong>Documentos PDF</strong> y <strong>Archivos Word (.docx, .doc)</strong> hasta 30MB.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-slate-200">
                        <input
                          type="text"
                          value={nuevaFotoUrl}
                          onChange={(e) => setNuevaFotoUrl(e.target.value)}
                          placeholder="URL directa de la evidencia (ej. https://...)"
                          className="flex-1 p-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={nuevaFotoDesc}
                          onChange={(e) => setNuevaFotoDesc(e.target.value)}
                          placeholder="Descripción / pie de foto"
                          className="sm:w-56 p-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleAgregarFoto}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                        >
                          + Agregar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNuevoReporteModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Guardar Reporte Diario en Bitácora (HU-034)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPRINT 6 - MODAL 3 (HU-040): DETALLE COMPLETO DE REPORTE DIARIO           */}
      {/* ========================================================================= */}
      {reporteSeleccionadoDetalle && (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-[70]"
          style={{ zIndex: 70 }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                  Reporte Diario #{reporteSeleccionadoDetalle.id_reporte} — {reporteSeleccionadoDetalle.fecha_reporte}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {reporteSeleccionadoDetalle.obra?.nombre_obra || `Obra #${reporteSeleccionadoDetalle.id_obra}`}
                </h3>
              </div>
              <button
                onClick={() => setReporteSeleccionadoDetalle(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha Técnica */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block">Supervisor:</span>
                <strong className="text-slate-800">
                  {reporteSeleccionadoDetalle.supervisor?.nombre_completo || 'Supervisor'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Clima (HU-035):</span>
                <strong className="text-amber-800 font-semibold">
                  {reporteSeleccionadoDetalle.clima}{' '}
                  {reporteSeleccionadoDetalle.temperatura_celsius
                    ? `(${reporteSeleccionadoDetalle.temperatura_celsius}°C)`
                    : ''}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Seguridad (HU-036):</span>
                <strong
                  className={
                    reporteSeleccionadoDetalle.senalamiento_preventivo
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }
                >
                  {reporteSeleccionadoDetalle.senalamiento_preventivo ? 'Con Señalamiento' : 'Sin Señalamiento'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Avance Acumulado:</span>
                <strong className="text-indigo-700 font-mono text-sm">
                  {reporteSeleccionadoDetalle.avance_fisico_acumulado}%
                </strong>
              </div>
            </div>

            {/* Actividades realizadas (HU-034) */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                Actividades Realizadas (HU-034):
              </span>
              <p className="text-slate-700 leading-relaxed">
                {reporteSeleccionadoDetalle.actividades_realizadas}
              </p>
            </div>

            {/* EPP y Seguridad (HU-036, HU-037) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                <span className="font-bold text-blue-900 block text-[11px]">
                  🛡️ Medidas de Seguridad (HU-036)
                </span>
                <p className="text-slate-600 text-[11px]">
                  {reporteSeleccionadoDetalle.condiciones_seguridad || 'Medidas estándar de seguridad aplicadas.'}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block text-[11px]">
                  👷 Cumplimiento de EPP (HU-037)
                </span>
                <p className="text-slate-600 text-[11px]">
                  {reporteSeleccionadoDetalle.observaciones_epp ||
                    (reporteSeleccionadoDetalle.equipo_proteccion_epp
                      ? 'Personal con equipo de protección reglamentario al 100%.'
                      : 'Incumplimiento parcial de equipo de protección reportado.')}
                </p>
              </div>
            </div>

            {/* Cuadrillas de Personal (HU-038) */}
            {reporteSeleccionadoDetalle.resumen_cuadrilla &&
              reporteSeleccionadoDetalle.resumen_cuadrilla.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                    Personal y Cuadrillas en Sitio (HU-038):
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {reporteSeleccionadoDetalle.resumen_cuadrilla.map((c, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-800 font-bold text-xs">{c.categoria}</span>
                          <strong className="text-purple-700 font-mono text-xs bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {c.cantidad} trabajadores
                          </strong>
                        </div>
                        {c.descripcion && (
                          <p className="text-slate-500 text-[11px] italic">
                            Actividad: {c.descripcion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Maquinaria Utilizada (HU-039) */}
            {reporteSeleccionadoDetalle.maquinaria_sitio &&
              reporteSeleccionadoDetalle.maquinaria_sitio.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                    Maquinaria y Equipo Empleado (HU-039):
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {reporteSeleccionadoDetalle.maquinaria_sitio.map((m, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-800 font-bold text-xs truncate max-w-[180px]">{m.tipo}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {m.estatus || 'Operativa'}
                          </span>
                        </div>
                        <div className="text-slate-600 font-mono text-[11px]">
                          {m.cantidad} unid. ({m.horas_uso || 0} hrs prog.)
                        </div>
                        {m.descripcion && (
                          <p className="text-slate-500 text-[11px] italic">
                            Actividad: {m.descripcion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Evidencia Fotográfica y Documental (RF-13) */}
            {reporteSeleccionadoDetalle.fotos &&
              reporteSeleccionadoDetalle.fotos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                    Evidencia Fotográfica y Documental ({reporteSeleccionadoDetalle.fotos.length} archivos):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {reporteSeleccionadoDetalle.fotos.map((f, idx) => {
                      const tipo = f.tipo_archivo || getTipoArchivoFromUrl(f.url_archivo);
                      return (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2 text-xs shadow-2xs"
                        >
                          <div className="flex items-center space-x-2">
                            {tipo === 'image' ? (
                              <a
                                href={f.url_archivo}
                                target="_blank"
                                rel="noreferrer"
                                className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 block"
                              >
                                <img
                                  src={f.url_archivo}
                                  alt={f.descripcion_foto || `Foto ${f.numero_foto}`}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ) : tipo === 'pdf' ? (
                              <a
                                href={f.url_archivo}
                                target="_blank"
                                rel="noreferrer"
                                className="w-12 h-12 rounded bg-rose-50 border border-rose-200 flex-shrink-0 flex flex-col items-center justify-center text-rose-600 hover:bg-rose-100 transition"
                              >
                                <FileText className="w-5 h-5" />
                                <span className="text-[8px] font-bold uppercase mt-0.5 font-mono">PDF</span>
                              </a>
                            ) : (
                              <a
                                href={f.url_archivo}
                                target="_blank"
                                rel="noreferrer"
                                className="w-12 h-12 rounded bg-blue-50 border border-blue-200 flex-shrink-0 flex flex-col items-center justify-center text-blue-600 hover:bg-blue-100 transition"
                              >
                                <File className="w-5 h-5" />
                                <span className="text-[8px] font-bold uppercase mt-0.5 font-mono">DOC</span>
                              </a>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-800 text-[11px] block truncate">
                                Evidencia #{f.numero_foto}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {f.descripcion_foto || 'Sin descripción'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={f.url_archivo}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-600 hover:underline font-semibold block text-center pt-1 border-t border-slate-100"
                          >
                            Abrir / Descargar
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setReporteSeleccionadoDetalle(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
              >
                Cerrar Detalle
              </button>
            </div>
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
                        catalogoActual.tipo_catalogo === 'MODIFICADO'
                          ? 'bg-blue-500 text-white'
                          : catalogoActual.tipo_catalogo === 'EXTRAORDINARIO'
                          ? 'bg-purple-600 text-white'
                          : catalogoActual.estatus_aprobacion === 'BLOQUEADO'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {catalogoActual.tipo_catalogo === 'MODIFICADO' ? (
                        <>
                          <ArrowRightLeft className="w-3 h-3 mr-1" /> MODIFICADO (v{catalogoActual.version})
                        </>
                      ) : catalogoActual.tipo_catalogo === 'EXTRAORDINARIO' ? (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" /> EXTRAORDINARIO
                        </>
                      ) : catalogoActual.estatus_aprobacion === 'BLOQUEADO' ? (
                        <>
                          <Lock className="w-3 h-3 mr-1" /> ORIGINAL (v1) • BLOQUEADO E INMUTABLE
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" /> ORIGINAL (v1) • BORRADOR (EN CAPTURA)
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

            {/* Pestañas de Navegación del Modal (Sprint 3 y Sprint 5) */}
            <div className="bg-slate-800 px-6 pt-2 border-b border-slate-700 flex items-center space-x-2 text-xs">
              <button
                onClick={() => setCatalogoModalTab('CATALOGOS')}
                className={`px-4 py-2 font-semibold border-b-2 transition flex items-center space-x-2 ${
                  catalogoModalTab === 'CATALOGOS'
                    ? 'border-emerald-400 text-emerald-400 bg-slate-900/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Catálogos de Conceptos</span>
              </button>
              <button
                onClick={() => setCatalogoModalTab('CONVENIOS')}
                className={`px-4 py-2 font-semibold border-b-2 transition flex items-center space-x-2 ${
                  catalogoModalTab === 'CONVENIOS'
                    ? 'border-emerald-400 text-emerald-400 bg-slate-900/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Convenios de Volumen (HU-029)</span>
                {conveniosLista.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px]">
                    {conveniosLista.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCatalogoModalTab('AUDITORIA')}
                className={`px-4 py-2 font-semibold border-b-2 transition flex items-center space-x-2 ${
                  catalogoModalTab === 'AUDITORIA'
                    ? 'border-emerald-400 text-emerald-400 bg-slate-900/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Auditoría e Historial (HU-030 a HU-033)</span>
                {historialLista.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded-full text-[10px]">
                    {historialLista.length}
                  </span>
                )}
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
              {/* VISTA 1: CATÁLOGOS DE CONCEPTOS (ORIGINAL, MODIFICADO, EXTRAORDINARIO) */}
              {catalogoModalTab === 'CATALOGOS' && (
                <>
                  {/* Selector de Catálogos Existentes de la Obra (Sprint 5: HU-027 a HU-033) */}
                  {catalogosLista && catalogosLista.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                      <span className="text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center mr-2">
                        <Layers className="w-3.5 h-3.5 mr-1 text-slate-700" /> Catálogos de la Obra:
                      </span>
                      {catalogosLista.map((cat) => {
                        const isSelected = catalogoActual?.id_catalogo === cat.id_catalogo;
                        const badgeColor =
                          cat.tipo_catalogo === 'ORIGINAL'
                            ? cat.estatus_aprobacion === 'BLOQUEADO'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                            : cat.tipo_catalogo === 'MODIFICADO'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-purple-100 text-purple-800 border-purple-300';
                        return (
                          <button
                            key={cat.id_catalogo}
                            type="button"
                            onClick={() => seleccionarCatalogoPorId(cat.id_catalogo)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center space-x-1.5 ${
                              isSelected
                                ? 'ring-2 ring-emerald-500 shadow-xs bg-white font-bold'
                                : 'bg-white/70 hover:bg-white text-slate-700'
                            }`}
                          >
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                              {cat.tipo_catalogo} v{cat.version}
                            </span>
                            <span>
                              {cat.tipo_catalogo === 'ORIGINAL'
                                ? 'Original Contractual'
                                : cat.tipo_catalogo === 'MODIFICADO'
                                ? `Modificado v${cat.version}`
                                : 'Extraordinarios'}
                            </span>
                            {cat.estatus_aprobacion === 'BLOQUEADO' && <Lock className="w-3 h-3 text-rose-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {loadingCatalogo ? (
                    <div className="text-center py-20 text-slate-500">
                      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm font-semibold">Cargando catálogo de la obra...</p>
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
                      {/* Banner Informativo según Tipo de Catálogo */}
                      {catalogoActual.tipo_catalogo === 'MODIFICADO' ? (
                        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/80 flex items-start space-x-3 text-xs text-blue-900 shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ArrowRightLeft className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold uppercase tracking-wider text-blue-950 text-xs">
                                HU-027: Catálogo Modificado Versión {catalogoActual.version}
                              </span>
                              <span className="font-mono text-[11px] text-blue-700">
                                Derivado del Catálogo Original (Inalterado)
                              </span>
                            </div>
                            <p className="mt-1 leading-relaxed text-blue-800">
                              {catalogoActual.descripcion ||
                                'Catálogo modificado para registrar cambios de cantidades autorizados para la obra conforme al marco legal LOPSRM.'}
                              {' '}Cada ajuste de volumen queda registrado con usuario responsable (HU-030) y timestamp automático (HU-031).
                            </p>
                          </div>
                        </div>
                      ) : catalogoActual.tipo_catalogo === 'EXTRAORDINARIO' ? (
                        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/80 flex items-start space-x-3 text-xs text-purple-900 shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <span className="font-bold uppercase tracking-wider text-purple-950 text-xs block">
                              HU-028: Catálogo de Conceptos Extraordinarios
                            </span>
                            <p className="mt-1 leading-relaxed text-purple-800">
                              Concentrado formal de trabajos no contemplados en el catálogo original del contrato.
                              Permite incorporar conceptos con clave única, unidad y costo directo unitario autorizado.
                            </p>
                          </div>
                        </div>
                      ) : catalogoActual.estatus_aprobacion === 'BLOQUEADO' ? (
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
                              original del contrato. Los intentos de modificación directa son rechazados. Para realizar ajustes de volúmenes, utilice el botón <strong>Crear Catálogo Modificado (HU-027)</strong>.
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
                              Captura y Estructuración del Catálogo de Conceptos (Borrador)
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

                      {/* HU-028: Registrar concepto extraordinario */}
                      <button
                        onClick={() => {
                          const totalExtras = (catalogoActual.conceptos || []).filter((c) => c.es_extraordinario).length;
                          setClaveExtra(`EXT-${String(totalExtras + 1).padStart(3, '0')}`);
                          setIsExtraordinarioModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                        title="HU-028: Registrar conceptos extraordinarios para incorporar trabajos no contemplados en el original"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+ Concepto Extraordinario (HU-028)</span>
                      </button>

                      {/* HU-027: Crear catálogo modificado a partir del original */}
                      {catalogoActual.tipo_catalogo === 'ORIGINAL' && catalogoActual.estatus_aprobacion === 'BLOQUEADO' && (
                        <button
                          onClick={() => {
                            setDescModificado(
                              `Catálogo modificado derivado de convenio de volumen para la obra ${selectedObraForCatalogo.clave_obra}`,
                            );
                            setIsCatalogoModificadoModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                          title="HU-027: Crear catálogo modificado a partir del original para registrar cambios de cantidades autorizados"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>+ Crear Catálogo Modificado (HU-027)</span>
                        </button>
                      )}
                    </div>

                    <div>
                      {catalogoActual.estatus_aprobacion === 'BORRADOR' && catalogoActual.tipo_catalogo === 'ORIGINAL' && (
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
                                      <th className="py-2.5 px-3 font-semibold text-center">Acciones</th>
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
                                            <div className="flex items-center space-x-1.5">
                                              <span>{conc.clave_concepto}</span>
                                              {conc.es_extraordinario && (
                                                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 border border-purple-300 rounded text-[9px] font-bold">
                                                  EXTRAORDINARIO
                                                </span>
                                              )}
                                            </div>
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
                                          <td className="py-2.5 px-3 font-mono text-right text-slate-800 font-bold">
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
                                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center space-x-1.5">
                                              {/* HU-030/031: Modificar volumen permitido en Catálogos Modificados o Extraordinarios */}
                                              {(catalogoActual.tipo_catalogo === 'MODIFICADO' ||
                                                catalogoActual.tipo_catalogo === 'EXTRAORDINARIO' ||
                                                catalogoActual.estatus_aprobacion !== 'BLOQUEADO') && (
                                                <button
                                                  onClick={() => {
                                                    setConceptoParaModificar(conc);
                                                    setNuevaCantidadVolumen(conc.cantidad);
                                                    setJustificacionVolumen('');
                                                    setIsModificarVolumenModalOpen(true);
                                                  }}
                                                  className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-[10px] transition inline-flex items-center space-x-1 shadow-xs"
                                                  title="Modificar volumen autorizado (HU-030/031)"
                                                >
                                                  <ArrowRightLeft className="w-3 h-3" />
                                                  <span>Modificar Volumen</span>
                                                </button>
                                              )}

                                              {/* Eliminación solo permitida en borradores no bloqueados */}
                                              {catalogoActual.estatus_aprobacion !== 'BLOQUEADO' && (
                                                <button
                                                  onClick={() => handleDesactivarConcepto(conc.id_concepto)}
                                                  className="text-rose-600 hover:text-rose-800 font-semibold text-[11px] hover:underline"
                                                  title="Desactivar concepto"
                                                >
                                                  Eliminar
                                                </button>
                                              )}
                                            </div>
                                          </td>
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
            </>
          )}

          {/* VISTA 2: CONVENIOS RELACIONADOS CON VOLUMEN (HU-029) */}
              {catalogoModalTab === 'CONVENIOS' && (
                <div className="space-y-6">
                  {/* Cabecera y botón de alta de convenio */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center">
                        <FileCheck className="w-4 h-4 text-emerald-600 mr-2" />
                        Convenios Modificatorios de Volumen y Plazo (Art. 59 LOPSRM / HU-029)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Registro formal de convenios para mantener actualizada la información legal y técnica de la obra.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const nextNum = `CONV-VOL-0${conveniosLista.length + 1}/${new Date().getFullYear()}`;
                        setNumConvenio(nextNum);
                        setDescConvenio('');
                        setMontoConvenio('');
                        setPctConvenio('');
                        setDiasConvenio(0);
                        setIsConvenioModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm whitespace-nowrap self-start sm:self-auto"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Registrar Convenio de Volumen (HU-029)</span>
                    </button>
                  </div>

                  {/* Listado de Convenios */}
                  {loadingConvenios ? (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs">Cargando convenios relacionados...</p>
                    </div>
                  ) : conveniosLista.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Sin convenios de volumen registrados</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Utilice el botón superior para registrar convenios modificatorios relacionados con variaciones de volumen o conceptos extraordinarios.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {conveniosLista.map((conv) => (
                        <div
                          key={conv.id_convenio}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-white">
                              {conv.numero_convenio}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {conv.estatus}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {conv.tipo_convenio}
                            </span>
                            <p className="text-xs text-slate-800 font-medium mt-0.5 leading-snug">
                              {conv.descripcion}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Fecha Firma:</span>
                              <strong className="text-slate-700">{conv.fecha_firma}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Monto Adic.:</span>
                              <strong className="text-emerald-700 font-mono">
                                {formatMoney(Number(conv.monto_adicional))}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Variación:</span>
                              <strong className="text-blue-700">{conv.porcentaje_variacion}%</strong>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              Registrado por:{' '}
                              <strong>
                                {conv.usuario_registro?.nombre_completo || 'Usuario'}
                              </strong>
                            </span>
                            {conv.dias_ampliacion > 0 && (
                              <span className="font-medium text-amber-700">
                                +{conv.dias_ampliacion} días naturales
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 3: AUDITORÍA E HISTORIAL DE MODIFICACIONES (HU-030 A HU-033) */}
              {catalogoModalTab === 'AUDITORIA' && (
                <div className="space-y-4">
                  {/* Banner de Preservación de Trazabilidad Histórica (HU-033) */}
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/70 flex items-start space-x-3 text-xs text-purple-900 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-purple-950 text-xs">
                          HU-030 a HU-033: Trazabilidad Pericial e Historial Inmutable de Modificaciones
                        </span>
                        <span className="font-mono text-[11px] text-purple-700">
                          {historialLista.length} eventos registrados
                        </span>
                      </div>
                      <p className="mt-1 leading-relaxed text-purple-800">
                        Cada modificación realizada en los conceptos de obra registra de forma obligatoria el{' '}
                        <strong>usuario responsable (HU-030)</strong>, el <strong>timestamp automático del servidor (HU-031)</strong>{' '}
                        y conserva su <strong>trazabilidad histórica inalterable (HU-033)</strong> para fines de fiscalización y rendición de cuentas.
                      </p>
                    </div>
                  </div>

                  {/* Barra de Filtros Periciales (HU-032) */}
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={filtroAuditoriaTexto}
                        onChange={(e) => setFiltroAuditoriaTexto(e.target.value)}
                        placeholder="Buscar por concepto, clave o justificación..."
                        className="w-full p-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div className="w-48">
                      <select
                        value={filtroAuditoriaEvento}
                        onChange={(e) => setFiltroAuditoriaEvento(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Todos los eventos</option>
                        <option value="MODIFICACION_CANTIDAD">Modificaciones de Volumen</option>
                        <option value="CONCEPTO_EXTRAORDINARIO">Conceptos Extraordinarios</option>
                        <option value="CREACION_CATALOGO_MODIFICADO">Creación Catálogo Modificado</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setFiltroAuditoriaTexto('');
                        setFiltroAuditoriaEvento('');
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Tabla de Auditoría */}
                  {loadingAuditoria ? (
                    <div className="text-center py-12 text-slate-400">
                      <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs">Consultando bitácora de auditoría...</p>
                    </div>
                  ) : historialLista.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Sin modificaciones registradas</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        Las modificaciones de volumen autorizadas o altas de conceptos extraordinarios aparecerán en esta bitácora inmutable.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Fecha y Hora (HU-031)</th>
                              <th className="py-2.5 px-4 font-semibold">Usuario Responsable (HU-030)</th>
                              <th className="py-2.5 px-3 font-semibold">Concepto / Clave</th>
                              <th className="py-2.5 px-3 font-semibold">Evento / Campo</th>
                              <th className="py-2.5 px-4 font-semibold">Valor Anterior → Nuevo</th>
                              <th className="py-2.5 px-4 font-semibold">Justificación Técnica (HU-033)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {historialLista
                              .filter((item) => {
                                if (filtroAuditoriaEvento && item.evento !== filtroAuditoriaEvento) return false;
                                if (!filtroAuditoriaTexto) return true;
                                const txt = filtroAuditoriaTexto.toLowerCase();
                                return (
                                  item.justificacion.toLowerCase().includes(txt) ||
                                  item.campo_modificado.toLowerCase().includes(txt) ||
                                  item.concepto?.clave_concepto.toLowerCase().includes(txt) ||
                                  item.usuario?.nombre_completo.toLowerCase().includes(txt)
                                );
                              })
                              .map((item) => (
                                <tr key={item.id_historial} className="hover:bg-slate-50/80 transition">
                                  <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                                    <div className="flex items-center space-x-1.5">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>
                                        {new Date(item.fecha_modificacion).toLocaleString('es-MX', {
                                          dateStyle: 'short',
                                          timeStyle: 'medium',
                                        })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <div className="font-semibold text-slate-900">
                                      {item.usuario?.nombre_completo || `Usuario #${item.id_usuario_modifica}`}
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {item.usuario?.rol?.nombre_rol || 'OPERATIVO'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                                    {item.concepto?.clave_concepto || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {item.evento}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-xs">
                                    <div className="flex items-center space-x-1">
                                      <span className="line-through text-rose-500 bg-rose-50 px-1 rounded">
                                        {item.valor_anterior ?? 'Nulo'}
                                      </span>
                                      <span className="text-slate-400">→</span>
                                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                        {item.valor_nuevo ?? '—'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-700 max-w-xs text-[11px] leading-snug">
                                    {item.justificacion}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Catálogo de Obra Pública • Art. 59 LOPSRM
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
