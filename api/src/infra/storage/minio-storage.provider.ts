import { Client } from 'minio';
import { Readable } from 'stream';
import { IStorageProvider } from '../../contracts/storage-provider.interface';

export class MinioStorageProvider implements IStorageProvider {

    private readonly client: Client;
    private readonly bucket: string;

    constructor() {
        this.client = new Client({
            endPoint: process.env.MINIO_ENDPOINT ?? 'minio-scancard',
            port: Number(process.env.MINIO_PORT ?? 9000),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY ?? '',
            secretKey: process.env.MINIO_SECRET_KEY ?? '',
        });
        this.bucket = process.env.MINIO_BUCKET ?? 'scancard';
    }

    async save(file: { filename: string; buffer: Buffer }, folder: string): Promise<string> {
        await this.ensureBucket();
        const objectName = `${folder}/${file.filename}`;
        await this.client.putObject(this.bucket, objectName, file.buffer, file.buffer.length);
        return objectName;
    }

    async get(path: string): Promise<Buffer> {
        const stream = await this.client.getObject(this.bucket, path);
        return streamToBuffer(stream);
    }

    async delete(path: string): Promise<void> {
        await this.client.removeObject(this.bucket, path);
    }

    private async ensureBucket(): Promise<void> {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
            await this.client.makeBucket(this.bucket);
        }
    }

}

function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
