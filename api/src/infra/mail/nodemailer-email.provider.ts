import nodemailer from 'nodemailer';
import { IEmailProvider } from '../../contracts/email-provider.interface';

export class NodemailerEmailProvider implements IEmailProvider {
    private transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    async sendAlert(to: string, subject: string, body: string): Promise<void> {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            text: body,
        });
    }
}
