import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { IStorageProvider } from '../../contracts/storage-provider.interface';

export class LocalStorageProvider implements IStorageProvider {

    private readonly baseDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

    async save(file: { filename: string; buffer: Buffer }, folder: string): Promise<string> {
        const dir = join(this.baseDir, folder);
        await mkdir(dir, { recursive: true });

        const filePath = join(dir, file.filename);
        await writeFile(filePath, file.buffer);

        return filePath;
    }

    async delete(path: string): Promise<void> {
        await unlink(path);
    }

}
