export interface IStorageProvider {
    save(file: { filename: string; buffer: Buffer }, folder: string): Promise<string>;
    get(path: string): Promise<Buffer>;
    delete(path: string): Promise<void>;
}
