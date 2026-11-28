import { useState } from 'react';
import SelectField from '../components/SelectField';
import { formatEmailDomainTag } from '../data/mockUdintData';

export default function GestionPersonal({
  casos,
  selectedCaso,
  investigadores,
  capturistas,
  isSubmitting = false,
  onSelectCaso,
  onActualizarResponsables,
}) {
  const [personalInvestigadorId, setPersonalInvestigadorId] = useState(() => {
    const activeInv = selectedCaso?.asignaciones.find(
      (asig) => asig.activo && asig.rol_en_caso === 'INVESTIGADOR'
    );
    return activeInv ? String(activeInv.id_usuario) : '';
  });

  const [personalCapturistaId, setPersonalCapturistaId] = useState(() => {
    const activeCap = selectedCaso?.asignaciones.find(
      (asig) => asig.activo && asig.rol_en_caso === 'CAPTURISTA'
    );
    return activeCap ? String(activeCap.id_usuario) : '';
  });

  const folioOptions = casos.map((caso) => ({
    value: String(caso.id_caso),
    label: `${caso.numero_caso} — ${caso.titulo}`,
  }));

  const investigadorOptions = [
    { value: '', label: 'Sin asignar' },
    ...investigadores.map((usuario) => ({
      value: String(usuario.id_usuario),
      label: `${usuario.nombre_completo} (${formatEmailDomainTag(usuario.correo)})`,
    })),
  ];

  const capturistaOptions = [
    { value: '', label: 'Sin asignar' },
    ...capturistas.map((usuario) => ({
      value: String(usuario.id_usuario),
      label: `${usuario.nombre_completo} (${formatEmailDomainTag(usuario.correo)})`,
    })),
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    await onActualizarResponsables({
      investigadorId: personalInvestigadorId,
      capturistaId: personalCapturistaId,
    });
  }

  return (
    <section className="space-y-5 rounded-lg border border-slate-800 bg-slate-900 p-5 sm:p-6">
      {/* Encabezado de Gestión de Personal */}
      <div>
        <h2 className="text-base font-bold uppercase tracking-wide text-slate-100 sm:text-lg">
          GESTIÓN OPERATIVA DE PERSONAL ASIGNADO
        </h2>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Asigne investigadores de rango y capturistas autorizados a cada folio
          activo.
        </p>
      </div>

      {/* Formulario de asignación */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 sm:p-6"
      >
        <SelectField
          id="selector-folio-personal"
          label="Seleccionar Folio de Caso"
          value={String(selectedCaso?.id_caso || '')}
          options={folioOptions}
          buttonClassName="border-cyan-500/30 bg-slate-900/90"
          valueClassName="font-mono text-xs font-semibold text-cyan-400 sm:text-sm"
          chevronClassName="text-cyan-400"
          optionClassName="font-mono text-xs sm:text-sm"
          onChange={(event) => onSelectCaso(Number(event.target.value))}
        />

        <SelectField
          id="investigador-cargo"
          label="Investigador a Cargo (Firma Institucional)"
          value={personalInvestigadorId}
          options={investigadorOptions}
          onChange={(event) => setPersonalInvestigadorId(event.target.value)}
        />

        <SelectField
          id="capturista-auxiliar"
          label="Capturista Auxiliar Autorizado"
          value={personalCapturistaId}
          options={capturistaOptions}
          onChange={(event) => setPersonalCapturistaId(event.target.value)}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? 'Actualizando...'
            : 'Actualizar Responsables del Expediente'}
        </button>
      </form>

      {/* Resumen de Personal Activo */}
      <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3.5">
        <h3 className="text-xs font-bold text-slate-100">
          Personal Activo Actualmente en el Sistema:
        </h3>
        <ul className="space-y-1.5 text-xs text-slate-400">
          {investigadores.map((usuario) => (
            <li key={usuario.id_usuario}>
              • {usuario.nombre_completo} — {usuario.area}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
