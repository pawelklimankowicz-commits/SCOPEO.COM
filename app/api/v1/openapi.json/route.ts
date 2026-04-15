import { NextResponse } from 'next/server';

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Scopeo Public API',
      version: '1.0.0',
      description: 'Publiczne API Scopeo dla integracji ERP/BI.',
      contact: { email: 'support@scopeo.com' },
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Missing or invalid API key' },
          },
          required: ['error'],
        },
        EmissionsResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', example: 'scope1_fuel_gas' },
                  scope: { type: 'string', example: 'SCOPE1' },
                  totalKgCO2e: { type: 'number', example: 12345.67 },
                  totalTCO2e: { type: 'number', example: 12.35 },
                  year: { type: 'integer', nullable: true, example: 2024 },
                  lineCount: { type: 'integer', example: 42 },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                organizationId: { type: 'string', example: 'org_123' },
                year: { type: 'integer', nullable: true, example: 2024 },
                generatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      '/emissions': {
        get: {
          summary: 'Get emissions by category',
          description: 'Wymaga scope `emissions:read`.',
          tags: ['Emissions'],
          parameters: [
            { in: 'query', name: 'year', schema: { type: 'integer' } },
            { in: 'query', name: 'scope', schema: { type: 'string', enum: ['SCOPE1', 'SCOPE2', 'SCOPE3'] } },
          ],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/EmissionsResponse' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '403': {
              description: 'Missing scope',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/suppliers': {
        get: {
          summary: 'Get suppliers',
          description: 'Wymaga scope `suppliers:read`.',
          tags: ['Suppliers'],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  examples: {
                    default: {
                      value: {
                        data: [{ id: 'sup_1', name: 'ACME Sp. z o.o.', taxId: '5250000000' }],
                        meta: { total: 120, page: 1, limit: 50 },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '403': {
              description: 'Missing scope',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
      '/factors': {
        get: {
          summary: 'Get emission factors',
          description: 'Wymaga scope `factors:read`.',
          tags: ['Factors'],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  examples: {
                    default: {
                      value: {
                        data: [
                          {
                            id: 'fac_1',
                            code: 'KOBIZE_2023_PL_ELEC',
                            categoryCode: 'scope2_electricity',
                            scope: 'SCOPE2',
                            factorValue: 0.7309,
                            factorUnit: 'kgCO2e/kWh',
                            year: 2023,
                            source: 'KOBIZE',
                          },
                        ],
                        meta: { total: 200, page: 1, limit: 50 },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '403': {
              description: 'Missing scope',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
              },
            },
          },
        },
      },
    },
  };
  return NextResponse.json(spec);
}
