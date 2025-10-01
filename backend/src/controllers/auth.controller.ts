import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../shared/utils/auth.utils';

const prisma = new PrismaClient();

export async function register(req: Request, res: Response) {
  try {
    const { nombreCompleto, correoElectronico, contrasena } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { correoElectronico }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(contrasena);

    // Obtener rol de vecino por defecto
    const vecinoRole = await prisma.rol.findUnique({
      where: { nombreRol: 'vecino' }
    });

    if (!vecinoRole) {
      return res.status(500).json({ message: 'Error de configuración: rol no encontrado' });
    }

    // Crear usuario
    const user = await prisma.usuario.create({
      data: {
        nombreCompleto,
        correoElectronico,
        contrasenaHash: hashedPassword,
        idRol: vecinoRole.idRol,
        estadoCuenta: 'pendiente'
      }
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Espera la aprobación del administrador.',
      user: {
        id: user.idUsuario,
        nombre: user.nombreCompleto,
        correo: user.correoElectronico
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { correoElectronico, contrasena } = req.body;

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { correoElectronico },
      include: { rol: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Verificar contraseña
    const isValid = await comparePassword(contrasena, user.contrasenaHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Verificar estado de la cuenta
    if (user.estadoCuenta !== 'activo') {
      return res.status(403).json({ message: 'Cuenta inactiva o pendiente de aprobación' });
    }

    // Generar token
    const token = generateToken(user.idUsuario, user.correoElectronico, user.rol.nombreRol);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.idUsuario,
        nombre: user.nombreCompleto,
        correo: user.correoElectronico,
        rol: user.rol.nombreRol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
}
