// ============================================================
// MAILER (v9.8 — Paquete D) — envío de correos del sistema.
// Configuración por .env (NO versionar):
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=ventasinversoraipsfa@gmail.com
//   SMTP_PASS=<contraseña de aplicación de 16 letras>
//   APP_URL=https://ventasinversora.com
// Si el SMTP no está configurado, los correos se omiten con aviso
// en el log (el sistema nunca se rompe por falta de correo).
// ============================================================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // TLS vía STARTTLS en el puerto 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function envoltura(titulo, cuerpoHtml) {
    return '<div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f6f9;padding:24px;">' +
        '<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;' +
        'box-shadow:0 4px 16px rgba(0,0,0,0.08);">' +
        '<div style="background:#1a365d;color:#fff;padding:18px 24px;font-size:18px;font-weight:700;">' +
        'Sistema de Créditos IPSFA</div>' +
        '<div style="padding:24px;color:#2d3748;font-size:14px;line-height:1.6;">' +
        '<h2 style="margin:0 0 12px;color:#1a365d;font-size:18px;">' + titulo + '</h2>' + cuerpoHtml +
        '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">' +
        '<p style="font-size:12px;color:#a0aec0;margin:0;">Correo automático — no responder. ' +
        'Si no reconoces esta actividad, cambia tu contraseña de inmediato.</p>' +
        '</div></div></div>';
}

async function enviarCorreo(para, asunto, titulo, cuerpoHtml) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[mailer] SMTP sin configurar — correo omitido:', asunto);
        return false;
    }
    try {
        await transporter.sendMail({
            from: '"IPSFA Creditos" <' + process.env.SMTP_USER + '>',
            to: para,
            subject: asunto,
            html: envoltura(titulo, cuerpoHtml)
        });
        console.log('[mailer] enviado a', para, '—', asunto);
        return true;
    } catch (e) {
        console.error('[mailer] error enviando a', para, ':', e.message);
        return false;
    }
}

module.exports = { enviarCorreo };
