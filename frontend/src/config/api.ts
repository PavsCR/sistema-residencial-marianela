// Configuración de la API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper para construir URLs de endpoints
export const getApiUrl = (endpoint: string) => {
  // Asegurarse de que el endpoint empiece con /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${path}`;
};

// Configuración de headers comunes
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
