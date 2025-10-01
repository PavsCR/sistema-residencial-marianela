// Configuración de la API
const API_URL = 'http://localhost:3001/api';

export interface LoginRequest {
  correoElectronico: string;
  contrasena: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
  };
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    return response.json();
  },
};
