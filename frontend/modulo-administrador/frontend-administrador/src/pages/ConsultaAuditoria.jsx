import { useEffect, useMemo, useState } from 'react';

export default function ConsultaAuditoria({
  casos,
  auditoria,
  isBackendOnline = false,
  onBuscarFullText,
  onGestionarCaso,
}) {
  const [fullTextQuery, setFullTextQuery] = useState('');
  const [apiSearchResult, setApiSearchResult] = useState(null);

  const trimmedQuery = fullTextQuery.trim();

  useEffect(() => {
    if (!isBackendOnline || !trimmedQuery || !onBuscarFullText) {
      return undefined;
    }

    let isCancelled = false;
    const debounceId = window.setTimeout(async () => {
      const results = await onBuscarFullText(trimmedQuery);
      if (!isCancelled) {
        setApiSearchResult({ query: trimmedQuery, items: results });
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounceId);
    };
  }, [isBackendOnline, onBuscarFullText, trimmedQuery]);

  const localResultados = useMemo(() => {
    if (!trimmedQuery) {
      return casos;
    }
    const normalized = trimmedQuery.toLowerCase();
    return casos.filter(
      (caso) =>
        caso.numero_caso.toLowerCase().includes(normalized) ||
        caso.titulo.toLowerCase().includes(normalized) ||
        caso.descripcion.toLowerCase().includes(normalized) ||
        (caso.entidad_afectada || '').toLowerCase().includes(normalized) ||
        caso.categoria_delito.toLowerCase().includes(normalized) ||
        (caso.direccion_ip || '').toLowerCase().includes(normalized) ||
        (caso.correo_relacionado || '').toLowerCase().includes(normalized)
    );
  }, [casos, trimmedQuery]);

  const fullTextResultados =
    isBackendOnline && trimmedQuery && apiSearchResult?.query === trimmedQuery
      ? apiSearchResult.items
      : localResultados;

  return (
    <section className="space-y-5 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-5">
      {/* Motor de Consulta Full-Text */}
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-100 sm:text-base">
            CONSULTA MOTOR CENTRAL FULL-TEXT
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Búsqueda reactiva instantánea por folio, palabras clave,
            descriptores o categorías técnicas.
          </p>
        </div>

        <input
          id="fulltext-search"
          type="text"
          aria-label="Consulta motor central full-text"
          value={fullTextQuery}
          onChange={(event) => setFullTextQuery(event.target.value)}
          placeholder="Escriba folio (ej. UDINT-2026-0001), texto o patrón IP sospechoso..."
          className="w-full rounded-md border border-slate-800 bg-slate-900 px-3.5 py-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none sm:text-sm"
        />
      </div>

      {/* Cuadrícula de resultados de expedientes */}
      {fullTextResultados.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fullTextResultados.map((caso) => (
            <button
              key={caso.id_caso}
              type="button"
              onClick={() => onGestionarCaso(caso.id_caso)}
              className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/75 p-4 text-left transition-colors hover:border-cyan-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {caso.numero_caso}
                  </span>
                  <span className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300">
                    Evidencias Eq.04:{' '}
                    <span className="font-semibold text-cyan-400">
                      {caso.evidencias_count}
                    </span>
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold leading-snug text-slate-100">
                  {caso.titulo}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {caso.descripcion}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
          No se encontraron expedientes que coincidan con{' '}
          <span className="font-mono text-slate-200">{fullTextQuery}</span>.
        </div>
      )}

      {/* Bitácora de Auditoría Inmutable */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 sm:text-sm">
            BITÁCORA DE AUDITORÍA INMUTABLE (HISTORIAL DE CAMBIOS)
          </h3>
          <span className="font-mono text-xs text-slate-400">
            ID Sesión Segura
          </span>
        </div>

        <div className="max-h-72 divide-y divide-slate-800/80 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/80">
          {auditoria.map((evento) => (
            <article key={evento.id_auditoria} className="space-y-2.5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400">
                    [ {evento.fecha_evento} ]
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="font-semibold text-cyan-400">
                    {evento.numero_caso}
                  </span>
                </div>
                <span className="text-slate-400">{evento.codigo_bitacora}</span>
              </div>

              <p className="text-xs font-semibold text-slate-100 sm:text-sm">
                {evento.accion}
              </p>

              <div className="rounded-md border border-slate-800 bg-slate-900/90 px-3.5 py-2.5">
                <p className="font-mono text-xs italic text-slate-300">
                  Justificación oficial: &ldquo;{evento.justificacion}&rdquo;
                </p>
              </div>

              <p className="text-right font-mono text-[11px] text-slate-400">
                Usuario responsable: {evento.usuario_responsable}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
