const express = require('express');
const router = express.Router();
const estatisticasController = require('../controllers/estatisticasController');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /estatisticas/anuncios/{id}:
 *   get:
 *     summary: Obtém estatísticas de um anúncio
 *     tags: [Estatísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estatísticas do anúncio obtidas com sucesso
 */
router.get('/anuncios/:id', 
  authMiddleware,
  estatisticasController.getAnuncioEstatisticas
);

/**
 * @swagger
 * /estatisticas/publicidades/{id}:
 *   get:
 *     summary: Obtém estatísticas de uma publicidade
 *     tags: [Estatísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estatísticas da publicidade obtidas com sucesso
 */
router.get('/publicidades/:id',
  authMiddleware,
  estatisticasController.getPublicidadeEstatisticas
);

/**
 * @swagger
 * /estatisticas/geral:
 *   get:
 *     summary: Obtém estatísticas gerais da plataforma
 *     tags: [Estatísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas gerais obtidas com sucesso
 */
router.get('/geral',
  authMiddleware,
  estatisticasController.getEstatisticasGerais
);

module.exports = router; 