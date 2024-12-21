const express = require('express');
const router = express.Router();
const denunciaController = require('../controllers/denunciaController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

/**
 * @swagger
 * /denuncias:
 *   post:
 *     summary: Cria uma nova denúncia para um anúncio
 *     tags: [Denúncias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - anuncio_id
 *               - motivo
 *             properties:
 *               anuncio_id:
 *                 type: integer
 *                 description: ID do anúncio a ser denunciado
 *               motivo:
 *                 type: string
 *                 description: Motivo da denúncia
 *               descricao:
 *                 type: string
 *                 description: Descrição detalhada da denúncia
 *     responses:
 *       201:
 *         description: Denúncia criada com sucesso
 */
router.post('/', denunciaController.criarDenuncia);

/**
 * @swagger
 * /denuncias/anuncio/{anuncioId}:
 *   get:
 *     summary: Lista todas as denúncias de um anúncio específico
 *     tags: [Denúncias]
 *     parameters:
 *       - in: path
 *         name: anuncioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio
 *     responses:
 *       200:
 *         description: Lista de denúncias do anúncio
 */
router.get('/anuncio/:anuncioId', denunciaController.getDenunciasPorAnuncio);

/**
 * @swagger
 * /denuncias:
 *   get:
 *     summary: Lista todas as denúncias
 *     tags: [Denúncias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, resolvido, rejeitado]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de denúncias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       anuncio_id:
 *                         type: integer
 *                       anuncio_titulo:
 *                         type: string
 *                       motivo:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/', authMiddleware, denunciaController.listarDenuncias);

module.exports = router; 