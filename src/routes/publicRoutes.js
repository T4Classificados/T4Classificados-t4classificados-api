const express = require('express');
const router = express.Router();
const AnuncioController = require('../controllers/anuncioController');

/**
 * @swagger
 * /public/anuncios:
 *   get:
 *     summary: Lista todos os anúncios
 *     tags: [Anúncios]
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
 *     responses:
 *       200:
 *         description: Lista de anúncios
 */
router.get('/anuncios', AnuncioController.listar);
router.get('/anuncios/:id', AnuncioController.obterPorId);

module.exports = router; 