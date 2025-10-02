import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correoElectronico: '',
    telefono: '',
    numeroCasa: '',
    contrasena: '',
    confirmarContrasena: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones del frontend
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    // Validar teléfono (8 dígitos o +506 + 8 dígitos)
    const telefonoRegex = /^(\+506)?[0-9]{8}$/;
    if (formData.telefono && !telefonoRegex.test(formData.telefono)) {
      setError('El teléfono debe tener 8 dígitos o incluir +506 seguido de 8 dígitos');
      setLoading(false);
      return;
    }

    // Validar número de casa
    const numeroCasaInt = parseInt(formData.numeroCasa);
    if (!formData.numeroCasa || isNaN(numeroCasaInt) || numeroCasaInt < 0 || numeroCasaInt > 120) {
      setError('Por favor ingresa un número de casa válido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/usuarios/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreCompleto: formData.nombreCompleto,
          correoElectronico: formData.correoElectronico,
          telefono: formData.telefono || null,
          numeroCasa: formData.numeroCasa || null,
          contrasena: formData.contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar solicitud de registro');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>¡Solicitud Enviada!</h1>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#28a745', marginBottom: '1rem' }}>
              ✓ Tu solicitud de registro ha sido enviada exitosamente.
            </p>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Un administrador revisará tu solicitud pronto. Recibirás un correo electrónico
              cuando tu cuenta sea aprobada.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '0.75rem 2rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Sistema Residencial Marianela</h1>
        <h2>Registro de Nueva Cuenta</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombreCompleto">Nombre Completo *</label>
            <input
              id="nombreCompleto"
              name="nombreCompleto"
              type="text"
              value={formData.nombreCompleto}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={255}
              placeholder="Ej: Juan Pérez González"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="correoElectronico">Correo Electrónico *</label>
            <input
              id="correoElectronico"
              name="correoElectronico"
              type="email"
              value={formData.correoElectronico}
              onChange={handleChange}
              required
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="88887777 o +50688887777"
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Formato: 8 dígitos o +506 seguido de 8 dígitos
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="numeroCasa">Número de Casa *</label>
            <input
              id="numeroCasa"
              name="numeroCasa"
              type="number"
              min="1"
              max="120"
              value={formData.numeroCasa}
              onChange={handleChange}
              placeholder="Ej: 100"
              required
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Número de casa del 1 al 120
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña *</label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              value={formData.contrasena}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="••••••••"
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              Mínimo 8 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarContrasena">Confirmar Contraseña *</label>
            <input
              id="confirmarContrasena"
              name="confirmarContrasena"
              type="password"
              value={formData.confirmarContrasena}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-login">
            {loading ? 'Enviando solicitud...' : 'Enviar Solicitud'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Volver al Login
          </button>
        </form>
      </div>
    </div>
  );
}
