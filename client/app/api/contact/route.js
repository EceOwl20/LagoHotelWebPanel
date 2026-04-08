// app/api/contact/route.js
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { consumeRateLimit, getClientIp } from '@/lib/admin/security';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req) {
  try {
    const rateLimit = consumeRateLimit({
      key: `contact:${getClientIp(req)}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Cok fazla mesaj gonderildi. Lutfen daha sonra tekrar deneyin.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const { name, email, message } = await req.json();
    
    // Validation
    if (!name  || !message || name.length > 120 || message.length > 5000) {
      return new Response(JSON.stringify({ error: 'Zorunlu alanları doldurunuz' }), { 
        status: 400 
      });
    }

    const emailContent = `
      ${message}
      
      İletişim Bilgileri:
      - İsim: ${name} 
      ${email ? `- E-posta: ${email}` : ''}
    `;

    const mailOptions = {
      from: `"Dgtlface Contact Form" <${process.env.SMTP_USER}>`, // Sabit gönderici adresi
      to: 'info@dgtlface.com', // Hedef adres
      replyTo: email || process.env.SMTP_USER, // Yanıtlanacak adres
      subject: 'Yeni İletişim Formu Mesajı',
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #54b9cf;">Yeni İletişim Formu Mesajı</h2>
          <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</pre>
          <h3 style="margin-top: 20px; color: #547ccf;">İletişim Bilgileri</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>İsim:</strong> ${name}</li>
          
            ${email ? `<li><strong>E-posta:</strong> ${email}</li>` : ''}
          </ul>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ message: 'Mesajınız başarıyla gönderildi!' }), { 
      status: 200 
    });

  } catch (error) {
    console.error('Mail gönderim hatası:', error);
    return new Response(JSON.stringify({ 
      error: 'Mesaj gönderilirken bir hata oluştu: ' + error.message 
    }), { 
      status: 500 
    });
  }
}
