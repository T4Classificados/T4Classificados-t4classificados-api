const express = require('express');
const router = express.Router();
const empregoController = require('../controllers/empregoController');
const anuncioController = require('../controllers/anuncioController');

/**
 * @swagger
 * /public/empregos:
 *   get:
 *     summary: Lista pública de todas as vagas de emprego
 *     tags: [Empregos]
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
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: modalidade
 *         schema:
 *           type: string
 *         description: Filtrar por modalidade
 *       - in: query
 *         name: nivel_experiencia
 *         schema:
 *           type: string
 *         description: Filtrar por nível de experiência
 *     responses:
 *       200:
 *         description: Lista de vagas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Emprego'
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
router.get('/empregos', empregoController.getEmpregosPublic);

/**
 * @swagger
 * /public/anuncios:
 *   get:
 *     summary: Lista pública de todos os anúncios
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
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: modalidade
 *         schema:
 *           type: string
 *         description: Filtrar por modalidade
 *     responses:
 *       200:
 *         description: Lista de anúncios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Anuncio'
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
router.get('/anuncios', anuncioController.getAnunciosPublic);

module.exports = router; 