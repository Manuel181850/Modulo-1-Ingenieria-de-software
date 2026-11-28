import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Search,
  Shield,
  Users,
} from 'lucide-react';

// Datos simulados basados en el contrato preliminar de API (Equipo 03)
// GET /api/v1/casos?estatus=EN%20INVESTIGACION
export const mockCasosResponse = {
  total: 2,
  page: 1,
  limit: 20,
  data: [
    {
      id_caso: 1,
      numero_caso: 'UDINT-2026-0001',
      titulo: 'Suplantación de portal institucional mediante phishing',
      descripcion:
        'Se detectó dominio apócrifo solicitando credenciales académicas.',
      entidad_afectada: 'Comunidad Universitaria Ficticia',
      categoria_delito: 'Phishing',
      prioridad: 'ALTA',
      estatus: 'EN INVESTIGACION',
      fecha_apertura: '2026-11-10T14:30:00Z',
      fecha_cierre: null,
      id_usuario_creador: 2,
      fecha_ultima_modificacion: '2026-11-12T09:15:00Z',
      asignados: [
        { id_usuario: 14, rol_en_caso: 'INVESTIGADOR' },
        { id_usuario: 19, rol_en_caso: 'CAPTURISTA' },
      ],
    },
    {
      id_caso: 4,
      numero_caso: 'UDINT-2026-0004',
      titulo: 'Filtración de base de datos simulada en foro público',
      descripcion:
        'Publicación de credenciales y registros institucionales en foro externo.',
      entidad_afectada: 'Base de Datos Académica',
      categoria_delito: 'Fuga de Información',
      prioridad: 'CRITICA',
      estatus: 'EN INVESTIGACION',
      fecha_apertura: '2026-11-11T18:05:00Z',
      fecha_cierre: null,
      id_usuario_creador: 2,
      fecha_ultima_modificacion: '2026-11-12T11:40:00Z',
      asignados: [{ id_usuario: 14, rol_en_caso: 'INVESTIGADOR' }],
    },
  ],
};

const defaultEvidenciasTotales = 4;

const priorityBadgeStyles = {
  BAJA: 'border bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  MEDIA: 'border bg-amber-500/10 text-amber-400 border-amber-500/30',
  ALTA: 'border bg-orange-500/10 text-orange-400 border-orange-500/30',
  CRITICA: 'border bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const statusBadgeStyles = {
  ABIERTO: 'bg-emerald-500/10 text-emerald-400',
  'EN INVESTIGACION': 'bg-sky-500/10 text-sky-400',
  'EN PAUSA': 'bg-amber-500/10 text-amber-400',
  CERRADO: 'bg-slate-700/40 text-slate-300',
};

const navigationTabs = [
  {
    id: 'panel-general',
    label: 'Panel General',
    icon: LayoutDashboard,
  },
  {
    id: 'detalle-caso',
    label: 'Detalle de Caso',
    icon: ClipboardList,
  },
  {
    id: 'asignaciones',
    label: 'Asignaciones',
    icon: Users,
  },
  {
    id: 'evidencias',
    label: 'Evidencias',
    icon: FileText,
  },
  {
    id: 'busqueda',
    label: 'Búsqueda General',
    icon: Search,
  },
];

function formatFechaIso(isoDate) {
  if (!isoDate) {
    return 'Sin registro';
  }
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate;
  }
  return parsedDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function PriorityBadge({ prioridad }) {
  const badgeClasses =
    priorityBadgeStyles[prioridad] ||
    'border bg-slate-700/40 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide ${badgeClasses}`}
    >
      {prioridad}
    </span>
  );
}

function StatusBadge({ estatus }) {
  const badgeClasses =
    statusBadgeStyles[estatus] || 'bg-slate-700/40 text-slate-300';

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${badgeClasses}`}
    >
      {estatus}
    </span>
  );
}

function KpiCard({ label, value, valueColorClass, subtitle, icon: Icon }) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-400 sm:text-sm">{label}</p>
        <Icon className={`h-4 w-4 shrink-0 ${valueColorClass}`} />
      </div>
      <p
        className={`mt-2 font-mono text-2xl font-bold tracking-tight sm:text-3xl ${valueColorClass}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      )}
    </article>
  );
}

export function UdintLayout({
  casosResponse = mockCasosResponse,
  evidenciasTotales = defaultEvidenciasTotales,
  activeTab: controlledActiveTab,
  onTabChange,
  children,
}) {
  const [internalActiveTab, setInternalActiveTab] = useState('panel-general');
  const [selectedNumeroCaso, setSelectedNumeroCaso] = useState(
    casosResponse?.data?.[0]?.numero_caso || 'UDINT-2026-0001'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = controlledActiveTab ?? internalActiveTab;
  const casosList = casosResponse?.data ?? [];

  const selectedCaso = useMemo(
    () =>
      casosList.find((caso) => caso.numero_caso === selectedNumeroCaso) ||
      casosList[0] ||
      null,
    [casosList, selectedNumeroCaso]
  );

  const kpiItems = useMemo(() => {
    const totalExpedientes = casosResponse?.total ?? casosList.length;
    const prioridadCritica = casosList.filter(
      (caso) => caso.prioridad === 'CRITICA'
    ).length;
    const enInvestigacion = casosList.filter(
      (caso) => caso.estatus === 'EN INVESTIGACION'
    ).length;

    return [
      {
        id: 'total-expedientes',
        label: 'Total Expedientes',
        value: totalExpedientes,
        valueColorClass: 'text-cyan-400',
        subtitle: 'Registros consultados',
        icon: FolderOpen,
      },
      {
        id: 'prioridad-critica',
        label: 'Prioridad Crítica',
        value: prioridadCritica,
        valueColorClass: 'text-rose-400',
        subtitle: 'Atención prioritaria',
        icon: AlertTriangle,
      },
      {
        id: 'en-investigacion',
        label: 'En Investigación',
        value: enInvestigacion,
        valueColorClass: 'text-sky-400',
        subtitle: 'Expedientes activos',
        icon: Search,
      },
      {
        id: 'evidencias-totales',
        label: 'Evidencias Totales',
        value: evidenciasTotales,
        valueColorClass: 'text-emerald-400',
        subtitle: 'Elementos vinculados',
        icon: FileText,
      },
    ];
  }, [casosList, casosResponse?.total, evidenciasTotales]);

  const filteredCasos = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return casosList;
    }
    return casosList.filter(
      (caso) =>
        caso.numero_caso.toLowerCase().includes(normalizedQuery) ||
        caso.titulo.toLowerCase().includes(normalizedQuery) ||
        caso.categoria_delito.toLowerCase().includes(normalizedQuery)
    );
  }, [casosList, searchQuery]);

  function handleTabSelect(tabId) {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  }

  function renderDefaultTabContent() {
    if (activeTab === 'detalle-caso') {
      if (!selectedCaso) {
        return (
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
            No hay ningún expediente seleccionado para mostrar su detalle.
          </section>
        );
      }
      return (
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <p className="font-mono text-sm font-semibold text-cyan-400">
                {selectedCaso.numero_caso}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-100">
                {selectedCaso.titulo}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge prioridad={selectedCaso.prioridad} />
              <StatusBadge estatus={selectedCaso.estatus} />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            {selectedCaso.descripcion || 'Sin descripción registrada.'}
          </p>

          <dl className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
              <dt className="text-xs text-slate-400">Entidad Afectada</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">
                {selectedCaso.entidad_afectada || 'No especificada'}
              </dd>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
              <dt className="text-xs text-slate-400">Categoría de Delito</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">
                {selectedCaso.categoria_delito}
              </dd>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
              <dt className="text-xs text-slate-400">Fecha de Apertura</dt>
              <dd className="mt-1 font-mono text-sm text-slate-100">
                {formatFechaIso(selectedCaso.fecha_apertura)}
              </dd>
            </div>
          </dl>
        </section>
      );
    }

    if (activeTab === 'asignaciones') {
      const asignados = selectedCaso?.asignados ?? [];
      return (
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-100">
              Personal Asignado
              {selectedCaso && (
                <>
                  {' — '}
                  <span className="font-mono text-cyan-400">
                    {selectedCaso.numero_caso}
                  </span>
                </>
              )}
            </h2>
            <span className="text-xs text-slate-400">
              {asignados.length} integrante(s)
            </span>
          </div>

          {asignados.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {asignados.map((asignacion) => (
                <div
                  key={`${asignacion.id_usuario}-${asignacion.rol_en_caso}`}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-slate-100">
                      Usuario #{asignacion.id_usuario}
                    </p>
                    <p className="text-xs text-slate-400">
                      Tabla asignaciones_caso
                    </p>
                  </div>
                  <span className="rounded-md bg-cyan-600/15 px-2.5 py-1 text-xs font-medium text-cyan-400">
                    {asignacion.rol_en_caso}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No hay usuarios asignados a este expediente.
            </p>
          )}
        </section>
      );
    }

    if (activeTab === 'evidencias') {
      return (
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-slate-100">
              Repositorio de Evidencias
              {selectedCaso && (
                <>
                  {' — '}
                  <span className="font-mono text-cyan-400">
                    {selectedCaso.numero_caso}
                  </span>
                </>
              )}
            </h2>
            <span className="font-mono text-xs text-emerald-400">
              {evidenciasTotales} elementos totales
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Vista preparada para integrar los artefactos OSINT vinculados al
            expediente activo desde el módulo de evidencias.
          </p>
        </section>
      );
    }

    if (activeTab === 'busqueda') {
      return (
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <label
              htmlFor="udint-busqueda-general"
              className="block text-xs font-medium text-slate-400"
            >
              Buscar por Folio, Título o Categoría
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="udint-busqueda-general"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ej. UDINT-2026-0001 o Phishing"
                className="w-full rounded-md border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Resultados Filtrados ({filteredCasos.length})
            </p>
            {filteredCasos.map((caso) => (
              <div
                key={caso.id_caso}
                className="flex flex-col justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-cyan-400">
                    {caso.numero_caso}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-100">{caso.titulo}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Categoría: {caso.categoria_delito}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge prioridad={caso.prioridad} />
                  <StatusBadge estatus={caso.estatus} />
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-400">
            Expedientes En Investigación ({casosList.length})
          </h2>
          <span className="font-mono text-xs text-slate-400">
            GET /api/v1/casos?estatus=EN%20INVESTIGACION
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {casosList.map((caso) => {
            const isSelected = selectedCaso?.numero_caso === caso.numero_caso;
            return (
              <button
                key={caso.id_caso}
                type="button"
                onClick={() => setSelectedNumeroCaso(caso.numero_caso)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-cyan-500/70 bg-slate-900 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-cyan-400">
                    {caso.numero_caso}
                  </span>
                  <PriorityBadge prioridad={caso.prioridad} />
                </div>

                <h3 className="mt-2 text-sm font-medium text-slate-100">
                  {caso.titulo}
                </h3>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="text-xs text-slate-400">
                    Delito:{' '}
                    <strong className="font-medium text-slate-200">
                      {caso.categoria_delito}
                    </strong>
                  </span>
                  <StatusBadge estatus={caso.estatus} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Clock className="h-4 w-4 text-slate-500" />
                    {formatFechaIso(caso.fecha_apertura)}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 font-medium text-cyan-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Seleccionado
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header del módulo (sin duplicar Sidebar ni Navbar globales) */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-cyan-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
                Módulo Administrador UDINT
              </h1>
              <p className="text-xs text-slate-400 sm:text-sm">
                Unidad de Investigación e Inteligencia OSINT
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCaso && (
              <div className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
                Caso Activo:{' '}
                <span className="font-mono font-semibold text-cyan-400">
                  {selectedCaso.numero_caso}
                </span>
              </div>
            )}
            <span className="rounded-md border border-cyan-500/30 bg-cyan-600/15 px-2.5 py-1.5 font-mono text-xs font-semibold text-cyan-400">
              OSINT-STD
            </span>
          </div>
        </header>

        {/* Panel superior con 4 tarjetas indicadoras (KPIs) */}
        <section
          aria-label="Indicadores principales de expedientes"
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {kpiItems.map((kpi) => (
            <KpiCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              valueColorClass={kpi.valueColorClass}
              subtitle={kpi.subtitle}
              icon={kpi.icon}
            />
          ))}
        </section>

        {/* Menú de navegación horizontal por pestañas */}
        <nav
          aria-label="Secciones del Módulo Administrador UDINT"
          className="rounded-lg border border-slate-800 bg-slate-900 p-1.5"
        >
          <div
            role="tablist"
            className="flex items-center gap-1 overflow-x-auto"
          >
            {navigationTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-slate-100 hover:bg-cyan-500'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`}
                >
                  <TabIcon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Área de contenido principal del módulo */}
        <main role="tabpanel">{children ?? renderDefaultTabContent()}</main>
      </div>
    </div>
  );
}

export default UdintLayout;
