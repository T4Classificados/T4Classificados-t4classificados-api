const express = require('express');
const router = express.Router();
const denunciaController = require('../../controllers/denunciaController');

/**
 * @swagger
 * /api/public/denuncias:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     anuncio_id:
 *                       type: integer
 *                     motivo:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     status:
 *                       type: string
 */
router.post('/', denunciaController.criarDenuncia);

module.exports = router; 