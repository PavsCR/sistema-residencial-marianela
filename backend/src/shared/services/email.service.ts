/**
 * SERVICIO DE CORREO ELECTRÓNICO
 *
 * Maneja el envío de correos electrónicos usando Nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Configurar el transportador de correo
const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail', // Usar el servicio de Gmail directamente
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Configuración adicional para cuentas personales
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Interfaz para opciones de correo
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Enviar correo electrónico
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Sistema Residencial Marianela <sistema.residencial.marianela@gmail.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente:', info.messageId);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw new Error('Error al enviar correo electrónico');
  }
};

/**
 * Enviar correo de confirmación de cuenta aprobada
 */
export const sendAccountApprovedEmail = async (
  email: string,
  nombreCompleto: string
): Promise<void> => {
  const subject = '¡Tu cuenta ha sido aprobada! - Residencial Marianela';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cuenta Aprobada</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
        .info-box {
          background-color: #fff;
          border-left: 4px solid #4CAF50;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Bienvenido a Residencial Marianela!</h1>
      </div>
      <div class="content">
        <h2>Hola, ${nombreCompleto}</h2>
        <p>¡Excelentes noticias! Tu solicitud de registro ha sido <strong>aprobada</strong> por nuestro equipo de administración.</p>

        <div class="info-box">
          <p><strong>Tu cuenta ya está activa y puedes acceder al sistema.</strong></p>
          <p><strong>Correo electrónico:</strong> ${email}</p>
        </div>

        <p>Ya puedes iniciar sesión en el sistema con tu correo electrónico y la contraseña que estableciste durante el registro.</p>

        <center>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Iniciar Sesión</a>
        </center>

        <h3>¿Qué puedes hacer ahora?</h3>
        <ul>
          <li>Ver el estado de tus pagos</li>
          <li>Consultar información de tu casa</li>
          <li>Revisar el presupuesto del residencial</li>
          <li>Y mucho más...</li>
        </ul>

        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>

        <p>¡Bienvenido a la comunidad!</p>
        <p><strong>Equipo de Residencial Marianela</strong></p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} Residencial Marianela. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    ¡Bienvenido a Residencial Marianela!

    Hola, ${nombreCompleto}

    ¡Excelentes noticias! Tu solicitud de registro ha sido aprobada por nuestro equipo de administración.

    Tu cuenta ya está activa y puedes acceder al sistema.
    Correo electrónico: ${email}

    Ya puedes iniciar sesión en el sistema con tu correo electrónico y la contraseña que estableciste durante el registro.

    Accede aquí: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login

    ¿Qué puedes hacer ahora?
    - Ver el estado de tus pagos
    - Consultar información de tu casa
    - Revisar el presupuesto del residencial
    - Y mucho más...

    Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

    ¡Bienvenido a la comunidad!
    Equipo de Residencial Marianela

    ---
    Este es un correo automático, por favor no respondas a este mensaje.
    © ${new Date().getFullYear()} Residencial Marianela. Todos los derechos reservados.
  `;

  await sendEmail({ to: email, subject, html, text });
};

/**
 * Enviar correo de rechazo de solicitud
 */
export const sendAccountRejectedEmail = async (
  email: string,
  nombreCompleto: string,
  motivo: string
): Promise<void> => {
  const subject = 'Actualización sobre tu solicitud - Residencial Marianela';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Solicitud Rechazada</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f44336;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
        .info-box {
          background-color: #fff;
          border-left: 4px solid #f44336;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Actualización sobre tu solicitud</h1>
      </div>
      <div class="content">
        <h2>Hola, ${nombreCompleto}</h2>
        <p>Lamentamos informarte que tu solicitud de registro no ha sido aprobada en este momento.</p>

        <div class="info-box">
          <p><strong>Motivo:</strong></p>
          <p>${motivo}</p>
        </div>

        <p>Si crees que esto es un error o deseas más información, por favor contacta con la administración del residencial.</p>

        <p>Gracias por tu comprensión.</p>
        <p><strong>Equipo de Residencial Marianela</strong></p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} Residencial Marianela. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Actualización sobre tu solicitud - Residencial Marianela

    Hola, ${nombreCompleto}

    Lamentamos informarte que tu solicitud de registro no ha sido aprobada en este momento.

    Motivo:
    ${motivo}

    Si crees que esto es un error o deseas más información, por favor contacta con la administración del residencial.

    Gracias por tu comprensión.
    Equipo de Residencial Marianela

    ---
    Este es un correo automático, por favor no respondas a este mensaje.
    © ${new Date().getFullYear()} Residencial Marianela. Todos los derechos reservados.
  `;

  await sendEmail({ to: email, subject, html, text });
};
