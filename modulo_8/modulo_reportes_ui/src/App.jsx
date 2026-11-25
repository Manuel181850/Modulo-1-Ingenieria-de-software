import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api/v1/reportes';

export default function App() {
  const [dashboard, setDashboard] = useState({
    abiertos: 0,
    en_proceso: 0,
    cerrados: 0,
    tiempo_promedio_atencion_dias: 0,
  });
  const [casos, setCasos] = useState([]);
  const [evidencias, setEvidencias] = useState({
    total_evidencias: 0,
    por_tipo_entidad: [],
    por_capturista: [],
  });
  const [herramientas, setHerramientas] = useState([]);
  const [canales, setCanales] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [tabActiva, setTabActiva] = useState('casos');

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [idCapturista, setIdCapturista] = useState('');
  const [idUsuarioAudit, setIdUsuarioAudit] = useState('');

  const canvasCasosRef = useRef(null);
  const canvasEvidenciasRef = useRef(null);
  const chartCasosInstance = useRef(null);
  const chartEvidenciasInstance = useRef(null);

  const construirQuery = (incluirAudit = false) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    if (!incluirAudit) {
      if (prioridad) params.append('prioridad', prioridad);
      if (idCapturista) params.append('id_capturista', idCapturista);
    } else if (idUsuarioAudit) {
      params.append('id_usuario', idUsuarioAudit);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const cargarDatos = async () => {
    try {
      const qsCasos = construirQuery(false);
      const qsAudit = construirQuery(true);

      const [resDash, resCasos, resEvid, resHerr, resCan, resAudit] =
        await Promise.all([
          fetch(`${API_BASE}/dashboard${qsCasos}`),
          fetch(`${API_BASE}/casos${qsCasos}`),
          fetch(`${API_BASE}/estadisticas/evidencias`),
          fetch(`${API_BASE}/herramientas`),
          fetch(`${API_BASE}/canales`),
          fetch(`${API_BASE}/auditoria${qsAudit}`),
        ]);

      const [dataDash, dataCasos, dataEvid, dataHerr, dataCan, dataAudit] =
        await Promise.all([
          resDash.json(),
          resCasos.json(),
          resEvid.json(),
          resHerr.json(),
          resCan.json(),
          resAudit.json(),
        ]);

      if (dataDash.ok) setDashboard(dataDash.data.casos);
      if (dataCasos.ok) setCasos(dataCasos.data);
      if (dataEvid.ok) setEvidencias(dataEvid.data);
      if (dataHerr.ok) setHerramientas(dataHerr.data);
      if (dataCan.ok) setCanales(dataCan.data);
      if (dataAudit.ok) setAuditoria(dataAudit.data);
    } catch (error) {
      console.error('Error conectando con FastAPI:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!window.Chart) return;

    if (chartCasosInstance.current) chartCasosInstance.current.destroy();
    if (canvasCasosRef.current) {
      chartCasosInstance.current = new window.Chart(canvasCasosRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Abiertos', 'En Proceso', 'Cerrados'],
          datasets: [
            {
              data: [
                dashboard.abiertos,
                dashboard.en_proceso,
                dashboard.cerrados,
              ],
              backgroundColor: ['#10b981', '#0ea5e9', '#64748b'],
              borderColor: '#0f172a',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } },
          },
        },
      });
    }

    if (chartEvidenciasInstance.current) chartEvidenciasInstance.current.destroy();
    if (canvasEvidenciasRef.current && evidencias.por_tipo_entidad.length > 0) {
      chartEvidenciasInstance.current = new window.Chart(
        canvasEvidenciasRef.current,
        {
          type: 'bar',
          data: {
            labels: evidencias.por_tipo_entidad.map((e) => e.tipo),
            datasets: [
              {
                label: 'Cantidad de Evidencias',
                data: evidencias.por_tipo_entidad.map((e) => e.cantidad),
                backgroundColor: ['#0891b2', '#6366f1', '#14b8a6'],
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
              y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8' },
                grid: { color: '#1e293b' },
              },
            },
          },
        }
      );
    }
  }, [dashboard, evidencias]);

  const descargarArchivo = (formato) => {
    const qs = construirQuery(false);
    window.open(`${API_BASE}/exportar/${formato}${qs}`, '_blank');
  };

  const badgePrioridad = (p) => {
    const map = {
      BAJA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      MEDIA: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      ALTA: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      CRITICA: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
      map[p] || map.BAJA
    }`;
  };

  const badgeEstatus = (e) => {
    const map = {
      ABIERTO: 'bg-emerald-500/10 text-emerald-400',
      'EN INVESTIGACION': 'bg-sky-500/10 text-sky-400',
      'EN PAUSA': 'bg-amber-500/10 text-amber-400',
      CERRADO: 'bg-slate-700/40 text-slate-300',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      map[e] || map.ABIERTO
    }`;
  };

  const tabs = [
    { id: 'casos', label: `Casos (${casos.length})` },
    { id: 'captura', label: 'Captura' },
    { id: 'herramientas', label: 'Herramientas OSINT' },
    { id: 'canales', label: 'Canales' },
    { id: 'auditoria', label: `Auditoría (${auditoria.length})` },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16v-4m4 4V8m4 8v-6m4 6V5" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                Reportes y Analítica OSINT
              </h1>
              <p className="text-xs text-slate-400">
                Consolidación estadística, auditoría y exportación oficial
              </p>
            </div>
          </div>
          <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-md">
            Consulta Solo Lectura
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Casos Abiertos</div>
              <div className="text-3xl font-bold text-emerald-400 mt-1">
                {dashboard.abiertos}
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Casos en Proceso</div>
              <div className="text-3xl font-bold text-sky-400 mt-1">
                {dashboard.en_proceso}
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Casos Cerrados</div>
              <div className="text-3xl font-bold text-slate-300 mt-1">
                {dashboard.cerrados}
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
          </div>
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">
                Tiempo Promedio Atención
              </div>
              <div className="text-3xl font-bold text-cyan-400 mt-1">
                {dashboard.tiempo_promedio_atencion_dias} días
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {tabActiva === 'auditoria' ? (
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  ID Usuario (Auditoría)
                </label>
                <input
                  type="number"
                  placeholder="Todos los usuarios (Ej. 1)"
                  value={idUsuarioAudit}
                  onChange={(e) => setIdUsuarioAudit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Todas</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Capturista
                  </label>
                  <select
                    value={idCapturista}
                    onChange={(e) => setIdCapturista(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Todos</option>
                    <option value="2">Investigador ID 2</option>
                    <option value="3">Investigador ID 3</option>
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-4 flex flex-wrap justify-start md:justify-end gap-2">
              <button
                onClick={cargarDatos}
                className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={() => descargarArchivo('pdf')}
                className="inline-flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
              >
                Descargar PDF
              </button>
              <button
                onClick={() => descargarArchivo('excel')}
                className="inline-flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
              >
                Descargar Excel
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 bg-slate-900 rounded-lg border border-slate-800 p-4">
            <h6 className="text-sm font-semibold text-center text-slate-200 mb-3">
              Distribución de Casos por Estatus
            </h6>
            <div className="h-56 flex justify-center">
              <canvas ref={canvasCasosRef}></canvas>
            </div>
          </div>
          <div className="md:col-span-7 bg-slate-900 rounded-lg border border-slate-800 p-4">
            <h6 className="text-sm font-semibold text-center text-slate-200 mb-3">
              Evidencias Recolectadas por Tipo de Entidad (Total:{' '}
              {evidencias.total_evidencias})
            </h6>
            <div className="h-56">
              <canvas ref={canvasEvidenciasRef}></canvas>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h6 className="text-sm font-semibold text-slate-200">
              Vista Previa del Reporte
            </h6>
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTabActiva(t.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    tabActiva === t.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {tabActiva === 'casos' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5 px-3">Número de Caso</th>
                    <th className="py-2.5 px-3">Título de Investigación</th>
                    <th className="py-2.5 px-3">Prioridad</th>
                    <th className="py-2.5 px-3">Estatus</th>
                    <th className="py-2.5 px-3">Investigador</th>
                    <th className="py-2.5 px-3">Fecha Creación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {casos.map((c) => (
                    <tr key={c.id_caso} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-400">
                        {c.numero_caso}
                      </td>
                      <td className="py-2.5 px-3 text-slate-100">{c.titulo}</td>
                      <td className="py-2.5 px-3">
                        <span className={badgePrioridad(c.prioridad)}>
                          {c.prioridad}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={badgeEstatus(c.estatus)}>
                          {c.estatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {c.id_capturista
                          ? `Investigador #${c.id_capturista}`
                          : 'Sin asignar'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-400">
                        {String(c.fecha_apertura).slice(0, 16)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tabActiva === 'captura' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5 px-3">ID Capturista</th>
                    <th className="py-2.5 px-3">Investigador</th>
                    <th className="py-2.5 px-3">Total Capturas</th>
                    <th className="py-2.5 px-3">Archivos con Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {evidencias.por_capturista.map((cap) => (
                    <tr key={cap.id_capturista} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-cyan-400">
                        #{cap.id_capturista}
                      </td>
                      <td className="py-2.5 px-3">{cap.nombre}</td>
                      <td className="py-2.5 px-3">{cap.capturas}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-300">
                        {cap.archivos_sha256}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tabActiva === 'herramientas' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5 px-3">Herramienta OSINT</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Frecuencia de Uso</th>
                    <th className="py-2.5 px-3">Última Ejecución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {herramientas.map((h) => (
                    <tr key={h.id_herramienta} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-cyan-400">
                        {h.nombre}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{h.categoria}</td>
                      <td className="py-2.5 px-3">{h.consultas} consultas</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-400">
                        {h.ultima_ejecucion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tabActiva === 'canales' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5 px-3">Canal Externo</th>
                    <th className="py-2.5 px-3">Consultas Totales</th>
                    <th className="py-2.5 px-3">Usuarios Vinculados</th>
                    <th className="py-2.5 px-3">Latencia Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {canales.map((can, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-cyan-400">
                        {can.canal}
                      </td>
                      <td className="py-2.5 px-3">{can.consultas_totales}</td>
                      <td className="py-2.5 px-3">{can.usuarios_vinculados}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-300">
                        {can.tiempo_respuesta_ms} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tabActiva === 'auditoria' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-xs uppercase">
                    <th className="py-2.5 px-3">Fecha / Hora</th>
                    <th className="py-2.5 px-3">Usuario ID</th>
                    <th className="py-2.5 px-3">Módulo</th>
                    <th className="py-2.5 px-3">Acción</th>
                    <th className="py-2.5 px-3">Entidad</th>
                    <th className="py-2.5 px-3">IP Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditoria.map((log) => (
                    <tr key={log.id_bitacora} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-400">
                        {String(log.fecha_evento).slice(0, 19)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        Usuario #{log.id_usuario ?? 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-slate-800 text-cyan-400 px-2 py-0.5 rounded text-xs font-mono">
                          {log.modulo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">{log.accion}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {log.entidad || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-400">
                        {log.ip_origen || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}