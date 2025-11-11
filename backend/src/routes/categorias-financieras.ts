import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../shared/middleware/auth.middleware';

const router = Router();

// GET /api/categorias-financieras - Obtener todas las categorías
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categorias = await prisma.categoriaFinanciera.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });

    res.json({
      success: true,
      data: categorias
    });
  } catch (error: any) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/categorias-financieras - Crear una categoría
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    const categoria = await prisma.categoriaFinanciera.create({
      data: {
        nombre,
        descripcion
      }
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: categoria
    });
  } catch (error: any) {
    console.error('Error al crear categoría:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/categorias-financieras/:id - Actualizar una categoría
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const categoria = await prisma.categoriaFinanciera.update({
      where: { idCategoria: parseInt(id) },
      data: {
        nombre,
        descripcion
      }
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoria
    });
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/categorias-financieras/:id - Desactivar una categoría (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay movimientos asociados
    const movimientosCount = await prisma.movimientoFinanciero.count({
      where: { idCategoria: parseInt(id) }
    });

    if (movimientosCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene movimientos asociados'
      });
    }

    const categoria = await prisma.categoriaFinanciera.update({
      where: { idCategoria: parseInt(id) },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Categoría desactivada exitosamente',
      data: categoria
    });
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
