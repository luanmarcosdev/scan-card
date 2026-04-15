import 'dotenv/config';
import "reflect-metadata"
import { DataSource } from 'typeorm';
import { join } from 'path/posix';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  entities: [join(__dirname, 'entities', '*.ts')],
  migrations: [join(__dirname, 'migrations', '*.ts')],

  synchronize: false,
  logging: true, 
});