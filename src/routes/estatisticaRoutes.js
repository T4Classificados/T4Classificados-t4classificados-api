const express = require('express');
const router = express.Router();
const estatisticaController = require('../controllers/estatisticaController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

/**
 * @swagger
 * /estatisticas/anuncios/{id}:
 *   get:
 *     summary: Obtém estatísticas de um anúncio e anúncios semelhantes
 *     tags: [Estatísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [total, hoje, semana, mes]
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Estatísticas e anúncios semelhantes obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     estatisticas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           data:
 *                             type: string
 *                           total_partilhas:
 *                             type: integer
 *                           total_ligacoes:
 *                             type: integer
 *                           total_whatsapp:
 *                             type: integer
 *                     anuncios_semelhantes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           titulo:
 *                             type: string
 *                           categoria_nome:
 *                             type: string
 *                           cidade_nome:
 *                             type: string
 *                           estado_nome:
 *                             type: string
 *                           preco:
 *                             type: number
 *                           imagens:
 *                             type: array
 *                             items:
 *                               type: string
 *                           relevancia_score:
 *                             type: number
 */
router.get('/anuncios/:id',
  authMiddleware,
  estatisticaController.getEstatisticasAnuncio
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
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [total, hoje, semana, mes]
 */
router.get('/publicidades/:id',
  authMiddleware,
  estatisticaController.getEstatisticasPublicidade
);

/**
 * @swagger
 * /estatisticas/geral:
 *   get:
 *     summary: Obtém estatísticas gerais da plataforma
 *     tags: [Estatísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [total, hoje, semana, mes]
 */
router.get('/geral',
  authMiddleware,
  adminMiddleware,
  estatisticaController.getEstatisticasGerais
);

module.exports = router; 