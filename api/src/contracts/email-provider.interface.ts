export interface IEmailProvider {
    sendAlert(to: string, subject: string, body: string): Promise<void>;
}
