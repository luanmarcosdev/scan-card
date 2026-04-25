import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scan Card API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Validation error' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'Password1' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Success' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'document', 'password', 'phone'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            document: { type: 'string', description: 'CPF (only digits, no mask)', example: '12345678909' },
            password: { type: 'string', description: 'Min 6 chars, uppercase, lowercase, digit', example: 'Password1' },
            salary: { type: 'number', nullable: true, minimum: 0, example: 5000 },
            phone: { type: 'string', example: '11999999999' },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            document: { type: 'string' },
            salary: { type: 'number', nullable: true },
            phone: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        UserUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 3 },
            password: { type: 'string', description: 'Min 6 chars, uppercase, lowercase, digit' },
            salary: { type: 'number', nullable: true, minimum: 1 },
          },
        },
        CreateCardRequest: {
          type: 'object',
          required: ['last_numbers'],
          properties: {
            last_numbers: { type: 'string', pattern: '^\\d{4}$', example: '1234' },
            name: { type: 'string', nullable: true, maxLength: 50, example: 'Nubank' },
          },
        },
        UpdateCardRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', nullable: true, maxLength: 50, example: 'Nubank' },
          },
        },
        CardResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            last_numbers: { type: 'string', example: '1234' },
            name: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CreateExpenseCategoryRequest: {
          type: 'object',
          required: ['category'],
          properties: {
            category: { type: 'string', minLength: 2, maxLength: 50, example: 'Food' },
            description: { type: 'string', nullable: true, maxLength: 50, example: 'Food and beverages' },
          },
        },
        UpdateExpenseCategoryRequest: {
          type: 'object',
          properties: {
            category: { type: 'string', minLength: 2, maxLength: 50 },
            description: { type: 'string', nullable: true, maxLength: 50 },
          },
        },
        ExpenseCategoryResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            category: { type: 'string' },
            description: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CardStatementResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            card_id: { type: 'string', format: 'uuid' },
            status_id: { type: 'integer', example: 1, description: '1=pending 2=sent 3=processing 4=success 5=retry 6=dlq 7=needs_review' },
            year_reference: { type: 'integer', example: 2024 },
            month_reference: { type: 'integer', minimum: 1, maximum: 12, example: 3 },
            total: { type: 'number', nullable: true, example: 1500.00 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        UpdateCardStatementRequest: {
          type: 'object',
          properties: {
            total: { type: 'number', nullable: true, minimum: 0 },
          },
        },
        CreateCardTransactionRequest: {
          type: 'object',
          required: ['expense_category_id', 'total_value'],
          properties: {
            expense_category_id: { type: 'string', format: 'uuid' },
            total_value: { type: 'number', minimum: 0, example: 99.90 },
            merchant: { type: 'string', nullable: true, example: 'Amazon' },
            transaction_date: { type: 'string', format: 'date', example: '2024-03-15', nullable: true },
            parcels: { type: 'integer', minimum: 1, example: 1 },
            current_parcel: { type: 'integer', minimum: 1, example: 1 },
            parcel_value: { type: 'number', nullable: true, minimum: 0 },
          },
        },
        UpdateCardTransactionRequest: {
          type: 'object',
          properties: {
            expense_category_id: { type: 'string', format: 'uuid' },
            merchant: { type: 'string', nullable: true },
            transaction_date: { type: 'string', format: 'date', example: '2024-03-15', nullable: true },
            parcels: { type: 'integer', minimum: 1 },
            current_parcel: { type: 'integer', minimum: 1 },
            parcel_value: { type: 'number', nullable: true, minimum: 0 },
            total_value: { type: 'number', minimum: 0 },
          },
        },
        CardTransactionResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            card_statement_id: { type: 'string', format: 'uuid' },
            expense_category_id: { type: 'string', format: 'uuid' },
            merchant: { type: 'string', nullable: true },
            transaction_date: { type: 'string', format: 'date', example: '2024-03-15', nullable: true },
            parcels: { type: 'integer', example: 1 },
            current_parcel: { type: 'integer', example: 1 },
            parcel_value: { type: 'number', nullable: true },
            total_value: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        PurchaseTransaction: {
          type: 'object',
          properties: {
            transaction_id: { type: 'string', format: 'uuid' },
            card_id: { type: 'string', format: 'uuid' },
            card_last_numbers: { type: 'string', example: '1234' },
            card_name: { type: 'string', nullable: true, example: 'Nubank' },
            merchant: { type: 'string', nullable: true, example: 'Amazon' },
            transaction_date: { type: 'string', format: 'date', nullable: true, example: '2026-04-10' },
            parcels: { type: 'integer', example: 6 },
            current_parcel: { type: 'integer', example: 3 },
            parcel_value: { type: 'number', nullable: true, example: 50.00 },
            total_value: { type: 'number', example: 300.00 },
          },
        },
        CategoryBreakdown: {
          type: 'object',
          properties: {
            category_id: { type: 'string', format: 'uuid' },
            category_name: { type: 'string', example: 'Food' },
            count: { type: 'integer' },
            total: { type: 'number' },
            avg_value: { type: 'number' },
            salary_ratio: { type: 'number', nullable: true, description: 'Category total as % of salary' },
            due_ratio: { type: 'number', nullable: true, description: 'Category total as % of total_due' },
            transactions: { type: 'array', items: { '$ref': '#/components/schemas/PurchaseTransaction' } },
          },
        },
        AnalyticsResponse: {
          type: 'object',
          properties: {
            general: {
              type: 'object',
              properties: {
                salary: { type: 'number', nullable: true },
                total_installments: { type: 'number', example: 1200.00 },
                total_due: { type: 'number', example: 1500.00 },
                installments_salary_ratio: { type: 'number', nullable: true, example: 24.00, description: 'Percentage of salary spent on installments' },
                statements_count: { type: 'integer', example: 2, description: 'Number of statements included in this analysis' },
                statements_needing_review: { type: 'integer', example: 1, description: 'Number of statements with status needs_review' },
              },
            },
            transactions: {
              type: 'object',
              properties: {
                count: { type: 'integer', example: 15 },
                avg_value: { type: 'number', example: 80.00 },
                by_category: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/CategoryBreakdown' },
                },
              },
            },
            purchases: {
              type: 'object',
              properties: {
                cash: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 5 },
                    total: { type: 'number', example: 300.00 },
                  },
                },
                installments: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 10 },
                    total: { type: 'number', example: 900.00 },
                  },
                },
                ends_this_month: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 2 },
                    total: { type: 'number', example: 150.00 },
                    transactions: { type: 'array', items: { '$ref': '#/components/schemas/PurchaseTransaction' } },
                  },
                },
                ends_next_month: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 3 },
                    total: { type: 'number', example: 200.00 },
                    transactions: { type: 'array', items: { '$ref': '#/components/schemas/PurchaseTransaction' } },
                  },
                },
                ends_within_3_months: {
                  type: 'object',
                  description: 'Purchases ending in months 2 and 3 from reference (excludes this and next month)',
                  properties: {
                    count: { type: 'integer', example: 4 },
                    total: { type: 'number', example: 350.00 },
                    transactions: { type: 'array', items: { '$ref': '#/components/schemas/PurchaseTransaction' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
