import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_AUDITORIA,
  INITIAL_CASOS,
  INITIAL_USUARIOS,
  PRIORITY_LABELS,
  ROLE_DEFAULT_AREAS,
  formatCurrentTimestamp,
  getShortUserName,
} from '../data/mockUdintData';
import {
  API_BASE_URL,
  ApiError,
  actualizarEstatusCaso,
  asignarUsuarioCaso,
  checkBackendHealth,
  consultaGeneral,
  crearCaso,
  desasignarUsuarioCaso,
  listarCasos,
  normalizeBackendCaso,
  normalizeBackendTimelineEvent,
  obtenerCasoPorFolio,
  obtenerIndicadores,
  obtenerTimeline,
} from '../services/udintApi';

export function useUdintAdmin() {
  const [casos, setCasos] = useState(INITIAL_CASOS);
  const [usuarios, setUsuarios] = useState(INITIAL_USUARIOS);
  const [auditoria, setAuditoria] = useState(INITIAL_AUDITORIA);
  const [indicadoresApi, setIndicadoresApi] = useState(null);
  const [selectedCasoId, setSelectedCasoId] = useState(
    INITIAL_CASOS[0].id_caso
  );
  const [isNuevoExpediente, setIsNuevoExpediente] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usuariosMap = useMemo(() => {
    const map = new Map();
    usuarios.forEach((usuario) => {
      map.set(usuario.id_usuario, usuario);
    });
    return map;
  }, [usuarios]);

  const investigadores = useMemo(
    () =>
      usuarios.filter(
        (usuario) => usuario.rol === 'INVESTIGADOR' && usuario.activo
      ),
    [usuarios]
  );

  const capturistas = useMemo(
    () =>
      usuarios.filter(
        (usuario) => usuario.rol === 'CAPTURISTA' && usuario.activo
      ),
    [usuarios]
  );

  const selectedCaso = useMemo(
    () => casos.find((caso) => caso.id_caso === selectedCasoId) || casos[0],
    [casos, selectedCasoId]
  );

  const kpiStats = useMemo(() => {
    const totalExpedientes =
      isBackendOnline && indicadoresApi?.total_casos !== undefined
        ? indicadoresApi.total_casos
        : casos.length;
    const prioridadCritica = casos.filter(
      (caso) => caso.prioridad === 'CRITICA'
    ).length;
    const enInvestigacion =
      isBackendOnline &&
      indicadoresApi?.por_estatus?.['EN INVESTIGACION'] !== undefined
        ? indicadoresApi.por_estatus['EN INVESTIGACION']
        : casos.filter((caso) => caso.estatus === 'EN INVESTIGACION').length;
    const evidenciasTotales = casos.reduce(
      (acc, caso) => acc + (caso.evidencias_count || 0),
      0
    );

    return {
      totalExpedientes,
      prioridadCritica,
      enInvestigacion,
      evidenciasTotales,
    };
  }, [casos, indicadoresApi, isBackendOnline]);

  const nextConsecutiveFolio = useMemo(() => {
    const nextId =
      casos.reduce((maxId, caso) => Math.max(maxId, caso.id_caso), 0) + 1;
    return `UDINT-2026-${String(nextId).padStart(4, '0')}`;
  }, [casos]);

  const registrarAuditoriaLocal = useCallback(
    ({
      tipoEvento,
      tablaAfectada,
      idRegistro,
      numeroCaso,
      accion,
      justificacion,
    }) => {
      setAuditoria((prev) => {
        const nextAuditId =
          prev.reduce(
            (maxId, item) => Math.max(maxId, item.id_auditoria),
            100
          ) + 1;
        const nuevoEvento = {
          id_auditoria: nextAuditId,
          codigo_bitacora: `BIT-${nextAuditId}`,
          id_usuario: 1,
          tipo_evento: tipoEvento,
          tabla_afectada: tablaAfectada,
          id_registro: idRegistro,
          numero_caso: numeroCaso,
          direccion_ip: '10.14.0.5',
          fecha_evento: formatCurrentTimestamp(),
          accion,
          justificacion,
          usuario_responsable: 'admin_central@upslp.edu.mx',
        };
        return [nuevoEvento, ...prev];
      });
    },
    []
  );

  const syncFromBackend = useCallback(
    async (currentCasosSnapshot = null, currentUsersMap = null) => {
      const [casosRes, indicadoresRes, timelineRes] = await Promise.all([
        listarCasos({ page: 1, limit: 100 }),
        obtenerIndicadores().catch(() => null),
        obtenerTimeline({ page: 1, limit: 50 }).catch(() => null),
      ]);

      const resumenes = casosRes?.data ?? [];
      const existingById = new Map(
        (currentCasosSnapshot || []).map((item) => [item.id_caso, item])
      );

      const detallesResults = await Promise.allSettled(
        resumenes.map((item) => obtenerCasoPorFolio(item.numero_caso))
      );

      const casosHidratados = resumenes.map((resumen, index) => {
        const detalleResult = detallesResults[index];
        const raw =
          detalleResult?.status === 'fulfilled' && detalleResult.value
            ? detalleResult.value
            : resumen;
        return normalizeBackendCaso(raw, existingById.get(resumen.id_caso));
      });

      const casosById = new Map(
        casosHidratados.map((item) => [item.id_caso, item])
      );

      setCasos(casosHidratados);
      if (casosHidratados.length > 0) {
        setSelectedCasoId((prevId) =>
          casosById.has(prevId) ? prevId : casosHidratados[0].id_caso
        );
      }

      if (indicadoresRes) {
        setIndicadoresApi(indicadoresRes);
      }

      if (timelineRes?.data) {
        const userMap =
          currentUsersMap ||
          new Map(
            INITIAL_USUARIOS.map((usuario) => [usuario.id_usuario, usuario])
          );
        const mappedTimeline = timelineRes.data.map((evento) =>
          normalizeBackendTimelineEvent(evento, casosById, userMap)
        );
        setAuditoria(mappedTimeline);
      }

      return casosHidratados;
    },
    []
  );

  // Hidratación inicial: intenta conectar al backend; si no responde, mantiene fallback en memoria
  useEffect(() => {
    let isCancelled = false;

    async function hydrateFromBackend() {
      try {
        await checkBackendHealth();
        if (isCancelled) {
          return;
        }
        await syncFromBackend();
        if (!isCancelled) {
          setIsBackendOnline(true);
        }
      } catch {
        if (!isCancelled) {
          setIsBackendOnline(false);
        }
      }
    }

    hydrateFromBackend();
    return () => {
      isCancelled = true;
    };
  }, [syncFromBackend]);

  const handleSelectCaso = useCallback((idCaso) => {
    setIsNuevoExpediente(false);
    setSelectedCasoId(idCaso);
    setFeedbackMessage('');
  }, []);

  const handleGenerarConsecutivo = useCallback(() => {
    setIsNuevoExpediente(true);
    setFeedbackMessage('');
  }, []);

  const handleGuardarExpediente = useCallback(
    async ({
      categoria,
      estatus,
      prioridad,
      titulo,
      descripcion,
      justificacion,
    }) => {
      const categoriaLimpia = categoria.trim();
      const tituloLimpio = titulo.trim();
      const descripcionLimpia = descripcion.trim();
      const justificacionLimpia = justificacion.trim();

      if (categoriaLimpia.length < 3) {
        setFeedbackMessage(
          'Ingresa una Categoría Operativa válida (mínimo 3 caracteres).'
        );
        return false;
      }
      if (tituloLimpio.length < 5) {
        setFeedbackMessage(
          'Ingresa un Título Descriptivo del Caso válido (mínimo 5 caracteres).'
        );
        return false;
      }
      if (descripcionLimpia.length < 10) {
        setFeedbackMessage(
          'Ingresa una Descripción Detallada / Hallazgos Técnicos (mínimo 10 caracteres).'
        );
        return false;
      }
      if (justificacionLimpia.length < 5) {
        setFeedbackMessage(
          'La justificación obligatoria del cambio o registro debe tener al menos 5 caracteres.'
        );
        return false;
      }

      const nowIso = new Date().toISOString();
      setIsSubmitting(true);

      try {
        if (isNuevoExpediente) {
          if (isBackendOnline) {
            try {
              const creadoApi = await crearCaso({
                titulo: tituloLimpio,
                descripcion: descripcionLimpia,
                entidad_afectada: 'Unidad Operativa UDINT',
                categoria_delito: categoriaLimpia,
                prioridad,
              });

              let casoFinal = creadoApi;
              if (estatus !== 'ABIERTO' && creadoApi?.id_caso) {
                casoFinal = await actualizarEstatusCaso(creadoApi.id_caso, {
                  estatus_nuevo: estatus,
                  motivo_cambio: justificacionLimpia,
                });
              }

              await syncFromBackend(casos, usuariosMap);
              setIsNuevoExpediente(false);
              if (casoFinal?.id_caso) {
                setSelectedCasoId(casoFinal.id_caso);
              }
              setFeedbackMessage(
                `Expediente ${casoFinal?.numero_caso || ''} registrado en backend y bitácora.`
              );
              return true;
            } catch (error) {
              if (error instanceof ApiError && !error.isNetworkError) {
                setFeedbackMessage(`Error del servidor: ${error.detail}`);
                return false;
              }
              setIsBackendOnline(false);
            }
          }

          // Fallback en memoria (backend desconectado)
          const nextId =
            casos.reduce((maxId, caso) => Math.max(maxId, caso.id_caso), 0) + 1;
          const folio = `UDINT-2026-${String(nextId).padStart(4, '0')}`;

          const nuevoCaso = {
            id_caso: nextId,
            numero_caso: folio,
            titulo: tituloLimpio,
            descripcion: descripcionLimpia,
            entidad_afectada: 'Unidad Operativa UDINT',
            categoria_delito: categoriaLimpia,
            prioridad,
            estatus,
            fecha_apertura: nowIso,
            fecha_cierre: estatus === 'CERRADO' ? nowIso : null,
            id_usuario_creador: 1,
            fecha_ultima_modificacion: nowIso,
            evidencias_count: 0,
            direccion_ip: '10.14.0.5',
            correo_relacionado: 'udint@upslp.edu.mx',
            asignaciones: [],
            historial_estatus: [
              {
                id_historial: nextId * 100 + 1,
                estatus_anterior: null,
                estatus_nuevo: estatus,
                motivo_cambio: justificacionLimpia,
                fecha_cambio: nowIso,
                id_usuario_modifico: 1,
              },
            ],
          };

          setCasos((prev) => [...prev, nuevoCaso]);
          registrarAuditoriaLocal({
            tipoEvento: 'CREACION_CASO',
            tablaAfectada: 'casos',
            idRegistro: nextId,
            numeroCaso: folio,
            accion: `Alta de Expediente: ${estatus} (Prioridad ${PRIORITY_LABELS[prioridad]})`,
            justificacion: justificacionLimpia,
          });
          setIsNuevoExpediente(false);
          setSelectedCasoId(nextId);
          setFeedbackMessage(
            `Expediente ${folio} registrado en bitácora y guardado (fallback local).`
          );
          return true;
        }

        if (!selectedCaso) {
          return false;
        }

        const estatusAnterior = selectedCaso.estatus;
        const cambioEstatus = estatusAnterior !== estatus;
        const cambioMetadatos =
          selectedCaso.titulo !== tituloLimpio ||
          selectedCaso.descripcion !== descripcionLimpia ||
          selectedCaso.categoria_delito !== categoriaLimpia ||
          selectedCaso.prioridad !== prioridad;

        let syncedStatusWithApi = false;

        // PATCH /api/v1/casos/{id_caso}/estatus sí existe en backend/
        if (isBackendOnline && cambioEstatus) {
          try {
            await actualizarEstatusCaso(selectedCaso.id_caso, {
              estatus_nuevo: estatus,
              motivo_cambio: justificacionLimpia,
            });
            syncedStatusWithApi = true;
            const [indicadoresRes, timelineRes] = await Promise.all([
              obtenerIndicadores().catch(() => null),
              obtenerTimeline({ page: 1, limit: 50 }).catch(() => null),
            ]);
            if (indicadoresRes) {
              setIndicadoresApi(indicadoresRes);
            }
            if (timelineRes?.data) {
              const casosById = new Map(
                casos.map((item) => [item.id_caso, item])
              );
              setAuditoria(
                timelineRes.data.map((evento) =>
                  normalizeBackendTimelineEvent(evento, casosById, usuariosMap)
                )
              );
            }
          } catch (error) {
            if (error instanceof ApiError && !error.isNetworkError) {
              setFeedbackMessage(`Error del servidor: ${error.detail}`);
              return false;
            }
            setIsBackendOnline(false);
          }
        }

        // Actualización de estado local (y fallback de metadatos aún no expuestos por backend/)
        setCasos((prev) =>
          prev.map((caso) => {
            if (caso.id_caso !== selectedCaso.id_caso) {
              return caso;
            }
            return {
              ...caso,
              categoria_delito: categoriaLimpia,
              estatus,
              prioridad,
              titulo: tituloLimpio,
              descripcion: descripcionLimpia,
              fecha_cierre: estatus === 'CERRADO' ? nowIso : null,
              fecha_ultima_modificacion: nowIso,
              historial_estatus: [
                {
                  id_historial:
                    caso.historial_estatus.reduce(
                      (maxId, item) => Math.max(maxId, item.id_historial),
                      100
                    ) + 1,
                  estatus_anterior: estatusAnterior,
                  estatus_nuevo: estatus,
                  motivo_cambio: justificacionLimpia,
                  fecha_cambio: nowIso,
                  id_usuario_modifico: 1,
                },
                ...caso.historial_estatus,
              ],
            };
          })
        );

        if (!syncedStatusWithApi) {
          registrarAuditoriaLocal({
            tipoEvento: cambioEstatus ? 'CAMBIO_ESTATUS' : 'EDICION_CASO',
            tablaAfectada: 'casos',
            idRegistro: selectedCaso.id_caso,
            numeroCaso: selectedCaso.numero_caso,
            accion: cambioEstatus
              ? `Cambio de Estatus: ${estatusAnterior} -> ${estatus}`
              : `Edición de Expediente: Prioridad ${PRIORITY_LABELS[prioridad]}`,
            justificacion: justificacionLimpia,
          });
        }

        if (syncedStatusWithApi && cambioMetadatos) {
          setFeedbackMessage(
            `Estatus de ${selectedCaso.numero_caso} guardado en backend; metadatos actualizados en memoria.`
          );
        } else if (syncedStatusWithApi) {
          setFeedbackMessage(
            `Estatus de ${selectedCaso.numero_caso} actualizado en backend y bitácora.`
          );
        } else {
          setFeedbackMessage(
            `Cambios en ${selectedCaso.numero_caso} registrados en bitácora y guardados.`
          );
        }

        return true;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      casos,
      isBackendOnline,
      isNuevoExpediente,
      registrarAuditoriaLocal,
      selectedCaso,
      syncFromBackend,
      usuariosMap,
    ]
  );

  const handleActualizarResponsables = useCallback(
    async ({ investigadorId, capturistaId }) => {
      if (!selectedCaso) {
        return;
      }

      const invId = investigadorId ? Number(investigadorId) : null;
      const capId = capturistaId ? Number(capturistaId) : null;

      const nuevasAsignaciones = [];
      if (invId) {
        nuevasAsignaciones.push({
          id_usuario: invId,
          rol_en_caso: 'INVESTIGADOR',
          activo: true,
        });
      }
      if (capId) {
        nuevasAsignaciones.push({
          id_usuario: capId,
          rol_en_caso: 'CAPTURISTA',
          activo: true,
        });
      }

      setIsSubmitting(true);
      try {
        let syncedWithApi = false;

        if (isBackendOnline) {
          try {
            const prevActive = selectedCaso.asignaciones.filter(
              (asig) => asig.activo
            );
            const prevUserIds = new Set(
              prevActive.map((asig) => asig.id_usuario)
            );
            const nextUserIds = new Set(
              nuevasAsignaciones.map((asig) => asig.id_usuario)
            );

            // Desasignar usuarios removidos o cuyo rol cambió (DELETE desactiva todos los roles de ese usuario en el caso)
            const usersToDelete = new Set();
            prevUserIds.forEach((uid) => {
              if (!nextUserIds.has(uid)) {
                usersToDelete.add(uid);
              }
            });
            prevActive.forEach((prevAsig) => {
              const stillSameRole = nuevasAsignaciones.some(
                (nextAsig) =>
                  nextAsig.id_usuario === prevAsig.id_usuario &&
                  nextAsig.rol_en_caso === prevAsig.rol_en_caso
              );
              if (!stillSameRole) {
                usersToDelete.add(prevAsig.id_usuario);
              }
            });

            for (const uid of usersToDelete) {
              try {
                await desasignarUsuarioCaso(selectedCaso.id_caso, uid);
              } catch (error) {
                if (!(error instanceof ApiError && error.status === 404)) {
                  throw error;
                }
              }
            }

            for (const asig of nuevasAsignaciones) {
              const alreadyExistsUnchanged =
                !usersToDelete.has(asig.id_usuario) &&
                prevActive.some(
                  (prevAsig) =>
                    prevAsig.id_usuario === asig.id_usuario &&
                    prevAsig.rol_en_caso === asig.rol_en_caso
                );

              if (!alreadyExistsUnchanged) {
                try {
                  await asignarUsuarioCaso(selectedCaso.id_caso, {
                    id_usuario: asig.id_usuario,
                    rol_en_caso: asig.rol_en_caso,
                  });
                } catch (error) {
                  if (!(error instanceof ApiError && error.status === 409)) {
                    throw error;
                  }
                }
              }
            }

            await syncFromBackend(casos, usuariosMap);
            syncedWithApi = true;
          } catch (error) {
            if (error instanceof ApiError && !error.isNetworkError) {
              setFeedbackMessage(`Error del servidor: ${error.detail}`);
              return;
            }
            setIsBackendOnline(false);
          }
        }

        if (!syncedWithApi) {
          setCasos((prev) =>
            prev.map((caso) =>
              caso.id_caso === selectedCaso.id_caso
                ? {
                    ...caso,
                    asignaciones: nuevasAsignaciones,
                    fecha_ultima_modificacion: new Date().toISOString(),
                  }
                : caso
            )
          );

          const invNombre = invId
            ? usuariosMap.get(invId)?.nombre_completo || `Usuario #${invId}`
            : 'Sin asignar';
          const capNombre = capId
            ? usuariosMap.get(capId)?.nombre_completo || `Usuario #${capId}`
            : 'Sin asignar';

          registrarAuditoriaLocal({
            tipoEvento:
              nuevasAsignaciones.length > 0
                ? 'ASIGNACION_CASO'
                : 'DESASIGNACION_CASO',
            tablaAfectada: 'asignaciones_caso',
            idRegistro: selectedCaso.id_caso,
            numeroCaso: selectedCaso.numero_caso,
            accion: `Actualización de Responsables: Inv. ${invNombre} / Cap. ${capNombre}`,
            justificacion: `Reasignación operativa de personal autorizado para el folio ${selectedCaso.numero_caso}.`,
          });
        }

        setFeedbackMessage(
          syncedWithApi
            ? `Responsables de ${selectedCaso.numero_caso} actualizados en backend.`
            : `Responsables del expediente ${selectedCaso.numero_caso} actualizados correctamente.`
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      casos,
      isBackendOnline,
      registrarAuditoriaLocal,
      selectedCaso,
      syncFromBackend,
      usuariosMap,
    ]
  );

  // Consulta Full-Text (usa GET /api/v1/admin/consulta-general cuando backend está activo)
  const buscarCasosFullText = useCallback(
    async (queryText) => {
      const cleaned = queryText.trim();
      if (!cleaned) {
        return casos;
      }

      if (isBackendOnline) {
        try {
          const response = await consultaGeneral({ q: cleaned, limit: 100 });
          const existingById = new Map(
            casos.map((item) => [item.id_caso, item])
          );
          return (response?.data || []).map((item) =>
            normalizeBackendCaso(item, existingById.get(item.id_caso))
          );
        } catch (error) {
          if (error instanceof ApiError && error.isNetworkError) {
            setIsBackendOnline(false);
          }
        }
      }

      const normalized = cleaned.toLowerCase();
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
    },
    [casos, isBackendOnline]
  );

  // Alta de usuarios: fallback en memoria (backend/ aún no expone /api/v1/usuarios)
  const handleCrearUsuario = useCallback(
    ({ nombre_completo, correo, rol }) => {
      const nombreLimpio = nombre_completo.trim();
      const correoLimpio = correo.trim().toLowerCase();

      if (nombreLimpio.length < 4) {
        setFeedbackMessage(
          'Ingresa el Nombre Completo del Servidor (mínimo 4 caracteres).'
        );
        return false;
      }

      if (!/^[^\s@]+@upslp\.edu\.mx$/i.test(correoLimpio)) {
        setFeedbackMessage(
          'Solo se permiten correos institucionales verificados con dominio @upslp.edu.mx.'
        );
        return false;
      }

      if (
        usuarios.some(
          (usuario) => usuario.correo.toLowerCase() === correoLimpio
        )
      ) {
        setFeedbackMessage('Ya existe un usuario registrado con ese correo.');
        return false;
      }

      const nextUserId =
        usuarios.reduce(
          (maxId, usuario) => Math.max(maxId, usuario.id_usuario),
          0
        ) + 1;

      const nuevoUsuario = {
        id_usuario: nextUserId,
        nombre_completo: nombreLimpio,
        nombre_corto: getShortUserName(nombreLimpio),
        correo: correoLimpio,
        rol,
        area: ROLE_DEFAULT_AREAS[rol] || 'Unidad UDINT',
        activo: true,
      };

      setUsuarios((prev) => [...prev, nuevoUsuario]);
      registrarAuditoriaLocal({
        tipoEvento: 'ALTA_USUARIO',
        tablaAfectada: 'usuarios',
        idRegistro: nextUserId,
        numeroCaso: 'SISTEMA-USUARIOS',
        accion: `Alta de Credenciales: ${nombreLimpio} (${rol})`,
        justificacion: `Registro institucional validado de la cuenta ${correoLimpio} (fallback local pendiente de /api/v1/usuarios).`,
      });
      setFeedbackMessage(
        `Credenciales institucionales de ${nombreLimpio} registradas en memoria (pendiente de endpoint /api/v1/usuarios).`
      );
      return true;
    },
    [registrarAuditoriaLocal, usuarios]
  );

  return {
    apiBaseUrl: API_BASE_URL,
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
  };
}
