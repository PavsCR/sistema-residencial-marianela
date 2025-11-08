import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/comprobantes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'comprobante-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG, WEBP o PDF'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// GET /api/pagos/mi-casa - Obtener historial de pagos de la casa del usuario autenticado
// TODO: Re-enable authenticateToken after implementing login system
router.get('/mi-casa', async (req, res) => {
  try {
    // TODO: Get user ID from token after login is implemented
    // For now, use Super Admin (idUsuario = 1)
    const idUsuario = 1;
    
    console.log('Obteniendo pagos para usuario:', idUsuario);

    // Obtener el usuario con su casa
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: idUsuario },
      include: { casa: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!usuario.idCasa) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no tiene una casa asignada'
      });
    }

    // Obtener los pagos de la casa ordenados por fecha descendente
    const pagos = await prisma.pago.findMany({
      where: {
        idCasa: usuario.idCasa
      },
      select: {
        idPago: true,
        monto: true,
        descripcion: true,
        fechaPago: true
      },
      orderBy: {
        fechaPago: 'desc'
      }
    });

    // Calcular monto adeudado del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtener pagos del mes actual
    const pagosDelMes = await prisma.pago.findMany({
      where: {
        idCasa: usuario.idCasa,
        fechaPago: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Calcular total pagado en el mes
    const totalPagadoMes = pagosDelMes.reduce((sum: number, pago: any) => {
      return sum + parseFloat(pago.monto.toString());
    }, 0);

    // Cuota mensual estándar (esto debería venir de configuración)
    const cuotaMensual = 25000; // ₡25,000 por defecto
    const montoAdeudado = Math.max(0, cuotaMensual - totalPagadoMes);

    res.json({
      success: true,
      data: {
        casa: {
          numeroCasa: usuario.casa?.numeroCasa,
          estadoPago: usuario.casa?.estadoPago
        },
        pagos,
        mesActual: {
          cuotaMensual,
          totalPagado: totalPagadoMes,
          montoAdeudado,
          mes: now.toLocaleString('es-CR', { month: 'long', year: 'numeric' })
        }
      }
    });
  } catch (error: any) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/pagos/casa/:numeroCasa - Obtener historial de pagos de una casa específica (para administradores)
router.get('/casa/:numeroCasa', authenticateToken, async (req, res) => {
  try {
    const { numeroCasa } = req.params;

    // Buscar la casa
    const casa = await prisma.casa.findUnique({
      where: { numeroCasa }
    });

    if (!casa) {
      return res.status(404).json({
        success: false,
        message: 'Casa no encontrada'
      });
    }

    // Obtener los pagos de la casa
    const pagos = await prisma.pago.findMany({
      where: {
        idCasa: casa.idCasa
      },
      select: {
        idPago: true,
        monto: true,
        descripcion: true,
        fechaPago: true
      },
      orderBy: {
        fechaPago: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        casa: {
          numeroCasa: casa.numeroCasa,
          estadoPago: casa.estadoPago
        },
        pagos
      }
    });
  } catch (error: any) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/pagos/confirmar - Confirmar pago con comprobante (para vecinos)
router.post('/confirmar', authenticateToken, upload.single('comprobante'), async (req, res) => {
  try {
    const { fechaPago, mesPago, monto, descripcion, metodoPago } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un comprobante de pago'
      });
    }

    // Get user's casa
    const idUsuario = (req as any).user?.idUsuario || 1;
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario },
      select: { idCasa: true }
    });

    if (!usuario || !usuario.idCasa) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no tiene una casa asignada'
      });
    }

    // Create payment record
    const pago = await prisma.pago.create({
      data: {
        idCasa: usuario.idCasa,
        monto: parseFloat(monto),
        descripcion: `${descripcion} - Mes: ${mesPago}`,
        fechaPago: new Date(fechaPago),
        metodoPago: metodoPago,
        comprobante: file.filename // Store just the filename
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pago confirmado exitosamente',
      data: {
        idPago: pago.idPago,
        monto: pago.monto,
        descripcion: pago.descripcion,
        fechaPago: pago.fechaPago
      }
    });
  } catch (error: any) {
    console.error('Error al confirmar pago:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/pagos - Crear un nuevo pago (para administradores)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { idCasa, monto, descripcion, metodoPago, comprobante } = req.body;

    const pago = await prisma.pago.create({
      data: {
        idCasa: parseInt(idCasa),
        monto,
        descripcion,
        metodoPago,
        comprobante
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: pago
    });
  } catch (error: any) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
