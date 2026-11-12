import nodemailer from 'nodemailer';
import { env } from '../../../config/env';
import { IEnviadorCorreo } from '../recuperacion';

export class SmtpEnviadorCorreo implements IEnviadorCorreo {
  private readonly transporte = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.password },
  });

  async enviar(para: string, asunto: string, texto: string): Promise<void> {
    await this.transporte.sendMail({ from: env.smtp.from, to: para, subject: asunto, text: texto });
  }
}

export class ConsolaEnviadorCorreo implements IEnviadorCorreo {
  async enviar(para: string, asunto: string, texto: string): Promise<void> {
    console.log(`[correo simulado] Para: ${para} | ${asunto} | ${texto}`);
  }
}

export function crearEnviadorCorreo(): IEnviadorCorreo {
  return env.smtp.host && env.smtp.user ? new SmtpEnviadorCorreo() : new ConsolaEnviadorCorreo();
}
