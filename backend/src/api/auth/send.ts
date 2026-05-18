import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// 1. Konfigurasi Transporter Nodemailer (Pake akun Gmail dari .env)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Endpoint POST /api/auth/send-credential
// Pastikan tipe data parameter Express-nya explicit biar TS ngga rewel
router.post('/send-credential', async (req: Request, res: Response): Promise<any> => {
    const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap, cok!' });
  }

  try {
    // 3. Set Desain Konten Email HTML snapHire
    const mailOptions = {
      from: `"snapHire Admin Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔥 Akses Akun HR snapHire Anda Telah Aktif!',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #2563eb; font-weight: 900; margin: 0;">snapHire.</h1>
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Recruitment Platform Access</p>
          </div>
          
          <p style="color: #1f2937; font-size: 16px; font-weight: bold;">Halo, ${name}!</p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Selamat, akun Anda telah didaftarkan oleh Administrator untuk bergabung ke dalam tim recruitment <b>snapHire</b> sebagai <b>HR Manager</b>.</p>
          
          <div style="background-color: #f4f7fe; padding: 20px; border-radius: 16px; margin: 24px 0; border: 1px dashed #2563eb;">
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Kredensial Login Anda:</p>
            <p style="margin: 0 0 6px 0; font-size: 14px; color: #1f2937;"><b>Email:</b> ${email}</p>
            <p style="margin: 0; font-size: 14px; color: #1f2937;"><b>Password Sementara:</b> <span style="background-color: #ffffff; padding: 2px 8px; border-radius: 6px; font-family: monospace; color: #2563eb; font-weight: bold; border: 1px solid #dbeafe;">${password}</span></p>
          </div>
          
          <p style="color: #4b5563; font-size: 13px; margin-bottom: 24px;">Demi keamanan, harap segera mengganti password sementara Anda setelah berhasil masuk pertama kali.</p>
          
          <div style="text-align: center;">
            <a href="http://localhost:3000/login" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: bold; border-radius: 12px; display: inline-block;">Masuk ke Dashboard</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 32px 0 16px 0;" />
          <p style="color: #9ca3af; font-size: 10px; text-align: center; margin: 0;">Sistem Otomatis snapHire • Universitas Gadjah Mada</p>
        </div>
      `,
    };

    // 4. Eksekusi Kirim Email
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email kredensial berhasil terkirim via Nodemailer TypeScript!' 
    });

  } catch (error: any) {
    console.error('Nodemailer Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Gagal mengirim email: ' + error.message 
    });
  }
});

export default router;