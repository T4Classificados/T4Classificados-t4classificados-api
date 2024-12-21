const express = require('express');
const router = express.Router();
const publicidadeController = require('../controllers/publicidadeController');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /painel/publicidades:
 *   get:
 *     summary: Lista publicidades do anunciante
 *     tags: [Painel do Anunciante]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [ativas, pendentes, encerradas]
 *     responses:
 *       200:
 *         description: Lista de publicidades do anunciante
 */
router.get('/publicidades', 
  authMiddleware,
  publicidadeController.getPublicidadesAnunciante
);

/**
 * @swagger
 * /painel/publicidades/{id}/desempenho:
 *   get:
 *     summary: Obtém métricas de desempenho de uma campanha
 *     tags: [Painel do Anunciante]
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
 *           enum: [hoje, semana, mes, total]
 *     responses:
 *       200:
 *         description: Métricas de desempenho da campanha
 */
router.get('/publicidades/:id/desempenho',
  authMiddleware,
  publicidadeController.getDesempenhoCampanha
);

/**
 * @swagger
 * /painel/publicidades/{id}/renovar:
 *   post:
 *     summary: Renova uma campanha existente
 *     tags: [Painel do Anunciante]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plafond_adicional:
 *                 type: number
 *               nova_data_fim:
 *                 type: string
 *                 format: date
 *               plafond_diario:
 *                 type: number
 *     responses:
 *       200:
 *         description: Campanha renovada com sucesso
 */
router.post('/publicidades/:id/renovar',
  authMiddleware,
  publicidadeController.renovarCampanha
);

module.exports = router; 