// Configuración de la API
const API_URL = 'http://localhost:3001/api';

export interface LoginRequest {
  correoElectronico: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
  };
}

// Función para hacer peticiones autenticadas
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Si el token es inválido o expiró, limpiar y redirigir al login
  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({}));
    if (data.message?.includes('Token') || data.message?.includes('autenticad')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return response;
};

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();

      // Si la cuenta está suspendida, lanzar error con información especial
      if (error.estadoCuenta === 'suspendido') {
        const errorExtendido: any = new Error(error.message);
        errorExtendido.estadoCuenta = error.estadoCuenta;
        errorExtendido.usuario = error.usuario;
        throw errorExtendido;
      }

      throw new Error(error.message || 'Error al iniciar sesión');
    }

    const result = await response.json();

    // Adaptar respuesta del backend al formato del frontend
    return {
      token: result.data.token,
      user: {
        id: result.data.usuario.idUsuario,
        nombre: result.data.usuario.nombreCompleto,
        correo: result.data.usuario.correoElectronico,
        rol: result.data.usuario.rol,
      },
    };
  },
};
