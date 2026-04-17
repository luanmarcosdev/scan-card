export interface IStorageProvider {
    save(file: { filename: string; buffer: Buffer }, folder: string): Promise<string>;
    delete(path: string): Promise<void>;
}
