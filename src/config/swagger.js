const dotenv = require('dotenv');

dotenv.config();

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node Express API Starter',
      version: '1.0.0',
      description: 'API para Node Express API Starter',
    },
    servers: [
      {
        url: process.env.BASE_URL + '/api' || 'http://localhost:5000/api  ',
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
            id: {
              type: 'integer',
              description: 'ID do usuário'
            },
            nome: {
              type: 'string',
              description: 'Nome completo do usuário'
            },
            telefone: {
              type: 'string',
              description: 'Número de telefone do usuário'
            },
            genero: {
              type: 'string',
              enum: ['masculino', 'feminino', 'outro'],
              description: 'Gênero do usuário'
            },
            provincia: {
              type: 'string',
              description: 'Província do usuário'
            },
            zona: {
              type: 'string',
              description: 'Zona/Bairro do usuário'
            },
            tipoConta: {
              type: 'string',
              enum: ['pessoal', 'empresarial'],
              description: 'Tipo de conta do usuário'
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