import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class RecreateUsers1776124800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users', true);

        await queryRunner.createTable(new Table({
            name: 'users',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: '(UUID())',
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'email',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                    isUnique: true,
                },
                {
                    name: 'document',
                    type: 'varchar',
                    length: '50',
                    isNullable: false,
                },
                {
                    name: 'password',
                    type: 'varchar',
                    length: '20',
                    isNullable: false,
                },
                {
                    name: 'salary',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'phone',
                    type: 'varchar',
                    length: '20',
                    isNullable: true,
                },
                {
                    name: 'created_at',
                    type: 'datetime',
                    isNullable: false,
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'datetime',
                    isNullable: true,
                    default: null,
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'deleted_at',
                    type: 'datetime',
                    isNullable: true,
                    default: null,
                },
            ],
        }), true);

        await queryRunner.createIndex('users', new TableIndex({
            name: 'IDX_USERS_DOCUMENT',
            columnNames: ['document'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users', true);
    }

}
