const express = require('express');
const router = express.Router();
const empregoController = require('../controllers/empregoController');
const anuncioController = require('../controllers/anuncioController');
const publicidadeController = require('../controllers/publicidadeController');
const denunciaController = require('../controllers/denunciaController');

/**
 * @swagger
 * /public/empregos:
 *   get:
 *     summary: Lista todas as vagas de emprego
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
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de vagas de emprego
 */
router.get('/empregos', empregoController.getEmpregos);

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
router.get('/anuncios', anuncioController.getAnuncios);

/**
 * @swagger
 * /public/publicidade:
 *   get:
 *     summary: Lista todas as publicidades ativas
 *     tags: [Publicidade]
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
 *         description: Lista de publicidades ativas
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
 *                       titulo:
 *                         type: string
 *                       objetivo:
 *                         type: string
 *                       contato:
 *                         type: string
 *                       anunciante_nome:
 *                         type: string
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
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
router.get('/publicidade', publicidadeController.getPublicidades);

/**
 * @swagger
 * /public/denuncias:
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
router.post('/denuncias', denunciaController.criarDenuncia);

module.exports = router; 