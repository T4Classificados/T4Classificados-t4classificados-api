const dotenv = require('dotenv');

dotenv.config();

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'T4 Classificados API',
      version: '1.0.0',
      description: 'T4 Classificados API',
    },
    servers: [
      {
        url: process.env.BASE_URL + '/api' || 'http://localhost:4000/api  ',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            nome: {
              type: 'string',
              description: 'Nome completo do usuário'
            },
            sobrenome: {
              type: 'string',
              description: 'Sobrenome do usuário'
            },
            telefone: {
              type: 'string',
              description: 'Número de telefone do usuário'
            },
            provincia: {
              type: 'string',
              description: 'Província do usuário'
            },
            municipio: {
              type: 'string',
              description: 'Municipio do usuário'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos de rota
};

const specs = swaggerJsdoc(options);

module.exports = specs;