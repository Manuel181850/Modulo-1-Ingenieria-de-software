import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { NAVIGATION_TABS } from './data/mockUdintData';
import { useUdintAdmin } from './hooks/useUdintAdmin';
import AltaEdicionEstados from './pages/AltaEdicionEstados';
import AltaUsuarios from './pages/AltaUsuarios';
import ConsultaAuditoria from './pages/ConsultaAuditoria';
import GestionPersonal from './pages/GestionPersonal';
import PanelCasos from './pages/PanelCasos';

export function App() {
  const [activeTab, setActiveTab] = useState('panel-casos');
  const {
    apiBaseUrl,
    isBackendOnline,
    isSubmitting,
    casos,
    usuarios,
    auditoria,
    usuariosMap,
    investigadores,
    capturistas,
    selectedCaso,
    isNuevoExpediente,
    nextConsecutiveFolio,
    kpiStats,
    feedbackMessage,
    setFeedbackMessage,
    handleSelectCaso,
    handleGenerarConsecutivo,
    handleGuardarExpediente,
    handleActualizarResponsables,
    handleCrearUsuario,
    buscarCasosFullText,
  } = useUdintAdmin();

  function handleGestionarCaso(idCaso) {
    handleSelectCaso(idCaso);
    setActiveTab('alta-edicion');
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* Encabezado del Módulo (sin duplicar Sidebar ni Navbar globales) */}
        <header className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-base font-bold uppercase tracking-wide text-slate-100 sm:text-lg lg:text-xl">
                MÓDULO ADMINISTRADOR UDINT — CONTROL CENTRAL
              </h1>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Unidad de Delitos Informáticos y Tecnológicos • Prototipo
                Oficial Homologado
              </p>
            </div>
          </div>

          <div
            data-api-mode={isBackendOnline ? 'connected' : 'fallback'}
            title={
              isBackendOnline
                ? `Conectado a backend FastAPI (${apiBaseUrl})`
                : `Backend no disponible (${apiBaseUrl}) — operando con fallback en memoria`
            }
            className="shrink-0 self-start rounded-md border border-slate-800 bg-slate-950 px-4 py-2 text-right sm:self-center"
          >
            <p className="font-mono text-xs font-medium text-cyan-400">
              Entorno Operativo:
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
              OSINT DARK
            </p>
          </div>
        </header>

        {/* Panel superior con 4 tarjetas indicadoras (KPIs) */}
        <section
          aria-label="Indicadores principales de expedientes"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <article className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              TOTAL EXPEDIENTES
            </p>
            <p className="mt-2.5 text-2xl font-bold text-slate-100">
              {kpiStats.totalExpedientes}
            </p>
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              PRIORIDAD CRÍTICA
            </p>
            <p className="mt-2.5 text-2xl font-bold text-rose-400">
              {kpiStats.prioridadCritica}
            </p>
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              EN INVESTIGACIÓN
            </p>
            <p className="mt-2.5 text-2xl font-bold text-sky-400">
              {kpiStats.enInvestigacion}
            </p>
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              EVIDENCIAS TOTALES
            </p>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">
                {kpiStats.evidenciasTotales}
              </span>
              <span className="text-xs text-slate-400">ítems</span>
            </div>
          </article>
        </section>

        {/* Barra de navegación horizontal por pestañas */}
        <nav
          aria-label="Secciones del Módulo Administrador UDINT"
          className="rounded-lg border border-slate-800 bg-slate-900 p-2"
        >
          <div role="tablist" className="flex flex-wrap items-center gap-1">
            {NAVIGATION_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setFeedbackMessage('');
                  }}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:text-sm ${
                    isActive
                      ? 'bg-cyan-600 text-slate-100 hover:bg-cyan-500'
                      : 'font-medium text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Banner de confirmación operativa */}
        {feedbackMessage && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-lg border border-cyan-500/30 bg-cyan-600/10 px-4 py-3 text-sm text-cyan-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage('')}
              className="text-xs font-medium text-slate-400 hover:text-slate-100"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Área de contenido principal conectando las 5 pantallas */}
        <main role="tabpanel">
          {activeTab === 'panel-casos' && (
            <PanelCasos
              casos={casos}
              investigadores={investigadores}
              usuariosMap={usuariosMap}
              onGestionarCaso={handleGestionarCaso}
            />
          )}

          {activeTab === 'alta-edicion' && (
            <AltaEdicionEstados
              key={isNuevoExpediente ? 'nuevo' : selectedCaso?.id_caso}
              casos={casos}
              selectedCaso={selectedCaso}
              isNuevoExpediente={isNuevoExpediente}
              nextConsecutiveFolio={nextConsecutiveFolio}
              isSubmitting={isSubmitting}
              onSelectCaso={handleSelectCaso}
              onGenerarConsecutivo={handleGenerarConsecutivo}
              onGuardarExpediente={handleGuardarExpediente}
              onRegresarPanel={() => {
                setActiveTab('panel-casos');
                setFeedbackMessage('');
              }}
            />
          )}

          {activeTab === 'gestion-personal' && (
            <GestionPersonal
              key={selectedCaso?.id_caso}
              casos={casos}
              selectedCaso={selectedCaso}
              investigadores={investigadores}
              capturistas={capturistas}
              isSubmitting={isSubmitting}
              onSelectCaso={handleSelectCaso}
              onActualizarResponsables={handleActualizarResponsables}
            />
          )}

          {activeTab === 'consulta-auditoria' && (
            <ConsultaAuditoria
              casos={casos}
              auditoria={auditoria}
              isBackendOnline={isBackendOnline}
              onBuscarFullText={buscarCasosFullText}
              onGestionarCaso={handleGestionarCaso}
            />
          )}

          {activeTab === 'alta-usuarios' && (
            <AltaUsuarios
              usuarios={usuarios}
              onCrearUsuario={handleCrearUsuario}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
