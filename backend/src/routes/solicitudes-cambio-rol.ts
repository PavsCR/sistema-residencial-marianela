import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// GET /api/solicitudes-cambio-rol - Obtener todas las solicitudes de cambio de rol
router.get('/', authenticateToken, async (req, res) => {
  try {
    const solicitudes = await prisma.solicitudCambioRol.findMany({
      include: {
        usuarioAfectado: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true,
            rol: {
              select: {
                nombreRol: true
              }
            },
            casa: {
              select: {
                numeroCasa: true
              }
            }
          }
        },
        usuarioSolicitante: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true
          }
        },
        primerRevisor: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true
          }
        },
        segundoRevisor: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true
          }
        }
      },
      orderBy: {
        fechaSolicitud: 'desc'
      }
    });

    res.json({
      success: true,
      data: solicitudes
    });
  } catch (error: any) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/solicitudes-cambio-rol/pendientes - Obtener solicitudes pendientes o parcialmente aprobadas
router.get('/pendientes', authenticateToken, async (req, res) => {
  try {
    const solicitudes = await prisma.solicitudCambioRol.findMany({
      where: {
        OR: [
          { estado: 'pendiente' },
          { estado: 'aprobada_parcial' }
        ]
      },
      include: {
        usuarioAfectado: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true,
            rol: {
              select: {
                nombreRol: true
              }
            },
            casa: {
              select: {
                numeroCasa: true
              }
            }
          }
        },
        usuarioSolicitante: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true
          }
        },
        primerRevisor: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true
          }
        }
      },
      orderBy: {
        fechaSolicitud: 'desc'
      }
    });

    res.json({
      success: true,
      data: solicitudes
    });
  } catch (error: any) {
    console.error('Error al obtener solicitudes pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/solicitudes-cambio-rol - Crear nueva solicitud de cambio de rol
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { idUsuarioAfectado, tipoCambio, justificacion } = req.body;
    const idUsuarioSolicitante = (req as any).user?.idUsuario;

    if (!idUsuarioSolicitante) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que el usuario afectado existe
    const usuarioAfectado = await prisma.usuario.findUnique({
      where: { idUsuario: parseInt(idUsuarioAfectado) },
      include: {
        rol: true
      }
    });

    if (!usuarioAfectado) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar tipo de cambio
    if (!['asignar_admin', 'remover_admin'].includes(tipoCambio)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de cambio inválido'
      });
    }

    // Verificar que el cambio tenga sentido
    const esAdmin = usuarioAfectado.rol.nombreRol === 'administrador';
    if (tipoCambio === 'asignar_admin' && esAdmin) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es administrador'
      });
    }

    if (tipoCambio === 'remover_admin' && !esAdmin) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es administrador'
      });
    }

    // Buscar los roles
    const rolAdmin = await prisma.rol.findUnique({
      where: { nombreRol: 'administrador' }
    });

    const rolVecino = await prisma.rol.findUnique({
      where: { nombreRol: 'vecino' }
    });

    if (!rolAdmin || !rolVecino) {
      return res.status(500).json({
        success: false,
        message: 'Roles del sistema no configurados correctamente'
      });
    }

    // Determinar rol actual y nuevo
    const rolActual = usuarioAfectado.rol.nombreRol;
    const rolNuevo = tipoCambio === 'asignar_admin' ? 'administrador' : 'vecino';

    // Crear la solicitud
    const solicitud = await prisma.solicitudCambioRol.create({
      data: {
        idUsuarioAfectado: parseInt(idUsuarioAfectado),
        idUsuarioSolicitante,
        rolActual,
        rolNuevo,
        tipoCambio,
        justificacion,
        estado: 'pendiente'
      },
      include: {
        usuarioAfectado: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true,
            rol: {
              select: {
                nombreRol: true
              }
            }
          }
        },
        usuarioSolicitante: {
          select: {
            idUsuario: true,
            nombreCompleto: true,
            correoElectronico: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de cambio de rol creada exitosamente',
      data: solicitud
    });
  } catch (error: any) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/solicitudes-cambio-rol/:id/revisar - Aprobar o rechazar solicitud (requiere 2 aprobaciones)
router.put('/:id/revisar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentariosRevision } = req.body;
    const idRevisor = (req as any).user?.idUsuario;

    if (!idRevisor) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar estado
    if (!['aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: aprobada o rechazada'
      });
    }

    // Obtener el usuario revisor para verificar su rol
    const usuarioRevisor = await prisma.usuario.findUnique({
      where: { idUsuario: idRevisor },
      include: {
        rol: true
      }
    });

    if (!usuarioRevisor) {
      return res.status(404).json({
        success: false,
        message: 'Usuario revisor no encontrado'
      });
    }

    const esSuperAdmin = usuarioRevisor.rol.nombreRol === 'super_admin';

    // Obtener la solicitud
    const solicitud = await prisma.solicitudCambioRol.findUnique({
      where: { idSolicitud: parseInt(id) },
      include: {
        usuarioAfectado: {
          include: {
            rol: true
          }
        },
        usuarioSolicitante: true,
        primerRevisor: true
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar que la solicitud no esté ya procesada completamente
    if (solicitud.estado === 'aprobada' || solicitud.estado === 'rechazada') {
      return res.status(400).json({
        success: false,
        message: 'La solicitud ya fue procesada'
      });
    }

    // Verificar que el revisor no sea el solicitante
    if (solicitud.idUsuarioSolicitante === idRevisor) {
      return res.status(400).json({
        success: false,
        message: 'No puedes revisar tu propia solicitud'
      });
    }

    // Si alguien rechaza, la solicitud queda rechazada inmediatamente
    if (estado === 'rechazada') {
      const solicitudActualizada = await prisma.solicitudCambioRol.update({
        where: { idSolicitud: parseInt(id) },
        data: {
          estado: 'rechazada',
          ...(solicitud.estado === 'pendiente' ? {
            idPrimerRevisor: idRevisor,
            fechaPrimeraRevision: new Date(),
            comentariosPrimerRevisor: comentariosRevision
          } : {
            idSegundoRevisor: idRevisor,
            fechaSegundaRevision: new Date(),
            comentariosSegundoRevisor: comentariosRevision
          })
        },
        include: {
          usuarioAfectado: {
            select: {
              idUsuario: true,
              nombreCompleto: true,
              correoElectronico: true,
              rol: {
                select: {
                  nombreRol: true
                }
              }
            }
          },
          usuarioSolicitante: {
            select: {
              idUsuario: true,
              nombreCompleto: true,
              correoElectronico: true
            }
          },
          primerRevisor: {
            select: {
              idUsuario: true,
              nombreCompleto: true,
              correoElectronico: true
            }
          },
          segundoRevisor: {
            select: {
              idUsuario: true,
              nombreCompleto: true,
              correoElectronico: true
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Solicitud rechazada',
        data: solicitudActualizada
      });
    }

    // Si es aprobación
    if (estado === 'aprobada') {
      // Si es super_admin, puede aprobar directamente sin segunda aprobación
      if (esSuperAdmin && solicitud.estado === 'pendiente') {
        // Buscar el nuevo rol
        const nuevoRol = await prisma.rol.findUnique({
          where: { nombreRol: solicitud.rolNuevo }
        });

        if (!nuevoRol) {
          return res.status(500).json({
            success: false,
            message: 'Rol no encontrado en el sistema'
          });
        }

        // Actualizar rol del usuario
        await prisma.usuario.update({
          where: { idUsuario: solicitud.idUsuarioAfectado },
          data: { idRol: nuevoRol.idRol }
        });

        // Actualizar la solicitud como completamente aprobada
        const solicitudActualizada = await prisma.solicitudCambioRol.update({
          where: { idSolicitud: parseInt(id) },
          data: {
            estado: 'aprobada',
            idPrimerRevisor: idRevisor,
            fechaPrimeraRevision: new Date(),
            comentariosPrimerRevisor: comentariosRevision
          },
          include: {
            usuarioAfectado: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true,
                rol: {
                  select: {
                    nombreRol: true
                  }
                }
              }
            },
            usuarioSolicitante: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true
              }
            },
            primerRevisor: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true
              }
            }
          }
        });

        return res.json({
          success: true,
          message: 'Solicitud aprobada por super_admin. El cambio de rol ha sido aplicado exitosamente.',
          data: solicitudActualizada
        });
      }

      // Primera aprobación (para administradores regulares)
      if (solicitud.estado === 'pendiente') {
        const solicitudActualizada = await prisma.solicitudCambioRol.update({
          where: { idSolicitud: parseInt(id) },
          data: {
            estado: 'aprobada_parcial',
            idPrimerRevisor: idRevisor,
            fechaPrimeraRevision: new Date(),
            comentariosPrimerRevisor: comentariosRevision
          },
          include: {
            usuarioAfectado: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true,
                rol: {
                  select: {
                    nombreRol: true
                  }
                }
              }
            },
            usuarioSolicitante: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true
              }
            },
            primerRevisor: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true
              }
            }
          }
        });

        return res.json({
          success: true,
          message: 'Primera aprobación registrada. Se requiere una segunda aprobación de otro administrador.',
          data: solicitudActualizada
        });
      }

      // Segunda aprobación
      if (solicitud.estado === 'aprobada_parcial') {
        // Verificar que el segundo revisor no sea el mismo que el primero
        if (solicitud.idPrimerRevisor === idRevisor) {
          return res.status(400).json({
            success: false,
            message: 'No puedes ser el segundo revisor de una solicitud que ya aprobaste'
          });
        }

        // Buscar el nuevo rol
        const nuevoRol = await prisma.rol.findUnique({
          where: { nombreRol: solicitud.rolNuevo }
        });

        if (!nuevoRol) {
          return res.status(500).json({
            success: false,
            message: 'Rol no encontrado en el sistema'
          });
        }

        // Actualizar rol del usuario
        await prisma.usuario.update({
          where: { idUsuario: solicitud.idUsuarioAfectado },
          data: { idRol: nuevoRol.idRol }
        });

        // Actualizar la solicitud a completamente aprobada
        const solicitudActualizada = await prisma.solicitudCambioRol.update({
          where: { idSolicitud: parseInt(id) },
          data: {
            estado: 'aprobada',
            idSegundoRevisor: idRevisor,
            fechaSegundaRevision: new Date(),
            comentariosSegundoRevisor: comentariosRevision
          },
          include: {
            usuarioAfectado: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true,
                rol: {
                  select: {
                    nombreRol: true
                  }
                }
              }
            },
            usuarioSolicitante: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true
              }
            },
            primerRevisor: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true
              }
            },
            segundoRevisor: {
              select: {
                idUsuario: true,
                nombreCompleto: true,
                correoElectronico: true
              }
            }
          }
        });

        return res.json({
          success: true,
          message: 'Segunda aprobación registrada. El cambio de rol ha sido aplicado exitosamente.',
          data: solicitudActualizada
        });
      }
    }

    res.status(400).json({
      success: false,
      message: 'Estado de solicitud inválido'
    });
  } catch (error: any) {
    console.error('Error al revisar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
