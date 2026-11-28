import { useState } from 'react';
import SelectField from '../components/SelectField';
import {
  ESTATUS_STATE_MACHINE_OPTIONS,
  PRIORIDADES,
} from '../data/mockUdintData';

export default function AltaEdicionEstados({
  casos,
  selectedCaso,
  isNuevoExpediente,
  nextConsecutiveFolio,
  isSubmitting = false,
  onSelectCaso,
  onGenerarConsecutivo,
  onGuardarExpediente,
  onRegresarPanel,
}) {
  const [formCategoria, setFormCategoria] = useState(() =>
    isNuevoExpediente ? '' : selectedCaso?.categoria_delito || ''
  );
  const [formEstatus, setFormEstatus] = useState(() =>
    isNuevoExpediente ? 'ABIERTO' : selectedCaso?.estatus || 'ABIERTO'
  );
  const [formPrioridad, setFormPrioridad] = useState(() =>
    isNuevoExpediente ? 'MEDIA' : selectedCaso?.prioridad || 'MEDIA'
  );
  const [formTitulo, setFormTitulo] = useState(() =>
    isNuevoExpediente ? '' : selectedCaso?.titulo || ''
  );
  const [formDescripcion, setFormDescripcion] = useState(() =>
    isNuevoExpediente ? '' : selectedCaso?.descripcion || ''
  );
  const [formJustificacion, setFormJustificacion] = useState('');

  const expedienteOptions = [
    ...(isNuevoExpediente
      ? [
          {
            value: 'NUEVO',
            label: `${nextConsecutiveFolio} - [Nuevo Expediente]`,
          },
        ]
      : []),
    ...casos.map((caso) => ({
      value: String(caso.id_caso),
      label: `${caso.numero_caso} - ${caso.titulo}`,
    })),
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    const saved = await onGuardarExpediente({
      categoria: formCategoria,
      estatus: formEstatus,
      prioridad: formPrioridad,
      titulo: formTitulo,
      descripcion: formDescripcion,
      justificacion: formJustificacion,
    });
    if (saved) {
      setFormJustificacion('');
    }
  }

  return (
    <section className="space-y-5 rounded-lg border border-slate-800 bg-slate-900 p-5 sm:p-6">
      {/* Encabezado de Máquina de Estados */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wide text-slate-100 sm:text-lg">
            MÁQUINA DE ESTADOS E INTEGRACIÓN DE EXPEDIENTE
          </h2>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            La justificación quedará registrada de forma irrevocable en la
            auditoría.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerarConsecutivo}
          className="shrink-0 self-start rounded-md border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-cyan-400 transition-colors hover:border-cyan-500/50 hover:bg-slate-800 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:self-center sm:text-sm"
        >
          + Generar Consecutivo
        </button>
      </div>

      {/* Formulario unificado */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-slate-800 bg-slate-950/70 p-4 sm:p-6"
      >
        {/* Fila 1: Seleccionar Expediente Activo + Categoría Operativa */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            id="selector-expediente-activo"
            label="Seleccionar Expediente Activo"
            value={
              isNuevoExpediente ? 'NUEVO' : String(selectedCaso?.id_caso || '')
            }
            options={expedienteOptions}
            buttonClassName="border-cyan-500/30 bg-slate-900/90"
            valueClassName="font-mono text-xs font-semibold text-cyan-400 sm:text-sm"
            chevronClassName="text-cyan-400"
            optionClassName="font-mono text-xs sm:text-sm"
            onChange={(event) => {
              if (event.target.value === 'NUEVO') {
                onGenerarConsecutivo();
                return;
              }
              onSelectCaso(Number(event.target.value));
            }}
          />

          <div>
            <label
              htmlFor="categoria-operativa"
              className="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Categoría Operativa
            </label>
            <input
              id="categoria-operativa"
              type="text"
              required
              value={formCategoria}
              onChange={(event) => setFormCategoria(event.target.value)}
              placeholder="Ej. Extorsión / Phishing, Fuga de Información..."
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Fila 2: Estado de la Investigación + Nivel de Prioridad Asignada */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            id="estado-maquina"
            label="Estado de la Investigación (Máquina de Estados)"
            value={formEstatus}
            options={ESTATUS_STATE_MACHINE_OPTIONS}
            valueClassName="font-mono text-xs sm:text-sm"
            optionClassName="font-mono text-xs sm:text-sm"
            onChange={(event) => setFormEstatus(event.target.value)}
          />

          <SelectField
            id="nivel-prioridad-asignada"
            label="Nivel de Prioridad Asignada"
            value={formPrioridad}
            options={PRIORIDADES}
            valueClassName="font-semibold uppercase"
            optionClassName="font-semibold uppercase"
            onChange={(event) => setFormPrioridad(event.target.value)}
          />
        </div>

        {/* Fila 3: Título Descriptivo del Caso */}
        <div>
          <label
            htmlFor="titulo-descriptivo-caso"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Título Descriptivo del Caso
          </label>
          <input
            id="titulo-descriptivo-caso"
            type="text"
            required
            value={formTitulo}
            onChange={(event) => setFormTitulo(event.target.value)}
            placeholder="Ej. Campaña masiva de Phishing dirigida a directivos"
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Fila 4: Descripción Detallada / Hallazgos Técnicos */}
        <div>
          <label
            htmlFor="descripcion-hallazgos"
            className="mb-1.5 block text-xs font-medium text-slate-400"
          >
            Descripción Detallada / Hallazgos Técnicos
          </label>
          <textarea
            id="descripcion-hallazgos"
            rows={3}
            required
            value={formDescripcion}
            onChange={(event) => setFormDescripcion(event.target.value)}
            placeholder="Describa los hallazgos técnicos, vectores identificados y alcance del incidente..."
            className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Fila 5: Justificación Obligatoria del Cambio o Registro */}
        <div className="space-y-2.5 rounded-lg border border-cyan-500/30 bg-sky-950/20 p-4">
          <label
            htmlFor="justificacion-obligatoria"
            className="block text-xs font-bold uppercase tracking-wider text-cyan-400"
          >
            * JUSTIFICACIÓN OBLIGATORIA DEL CAMBIO O REGISTRO
          </label>
          <p className="text-xs text-slate-400">
            Fundamente la alteración del estado de fuerza u orden de prioridad
            para la bitácora institucional:
          </p>
          <input
            id="justificacion-obligatoria"
            type="text"
            required
            value={formJustificacion}
            onChange={(event) => setFormJustificacion(event.target.value)}
            placeholder="Ej. Se encontraron nuevos elementos probatorios en el log Eq.04 de la IP institucional."
            className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Fila 6: Botones de acción */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onRegresarPanel}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-slate-100 sm:text-sm"
          >
            Regresar al Panel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-cyan-600 px-5 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            {isSubmitting ? 'Guardando...' : 'Registrar en Bitácora y Guardar'}
          </button>
        </div>
      </form>
    </section>
  );
}
