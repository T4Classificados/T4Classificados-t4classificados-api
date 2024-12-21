const express = require('express');
const router = express.Router();
const anuncioController = require('../controllers/anuncioController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Aplicar middleware de autenticação para todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Anuncio:
 *       type: object
 *       required:
 *         - titulo
 *         - categoria
 *         - modalidade
 *         - descricao
 *         - visibilidade
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título do anúncio
 *         categoria:
 *           type: string
 *           description: Categoria do anúncio
 *         modalidade:
 *           type: string
 *           description: Modalidade do anúncio
 *         descricao:
 *           type: string
 *           description: Descrição detalhada do anúncio
 *         visibilidade:
 *           type: string
 *           enum: [publico, privado]
 *           description: Visibilidade do anúncio
 *         disponivel_whatsapp:
 *           type: boolean
 *           description: Indica se está disponível para contato via WhatsApp
 *         imagens:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs das imagens do anúncio
 */

/**
 * @swagger
 * /anuncios:
 *   post:
 *     summary: Cria um novo anúncio
 *     tags: [Anúncios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               categoria:
 *                 type: string
 *               modalidade:
 *                 type: string
 *               descricao:
 *                 type: string
 *               visibilidade:
 *                 type: string
 *                 enum: [publico, privado]
 *               disponivel_whatsapp:
 *                 type: boolean
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Anúncio criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/anuncios', 
  upload.array('imagens', 8), 
  anuncioController.createAnuncio
);

/**
 * @swagger
 * /anuncios:
 *   get:
 *     summary: Lista todos os anúncios
 *     tags: [Anúncios]
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Anuncio'
 */
router.get('/anuncios', anuncioController.getAnuncios);

/**
 * @swagger
 * /anuncios/{id}:
 *   get:
 *     summary: Obtém um anúncio específico
 *     tags: [Anúncios]
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
 *         description: Anúncio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anuncio'
 *       404:
 *         description: Anúncio não encontrado
 */
router.get('/anuncios/:id', anuncioController.getAnuncioById);

/**
 * @swagger
 * /anuncios/{id}:
 *   put:
 *     summary: Atualiza um anúncio
 *     tags: [Anúncios]
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
 *             $ref: '#/components/schemas/Anuncio'
 *     responses:
 *       200:
 *         description: Anúncio atualizado com sucesso
 *       404:
 *         description: Anúncio não encontrado
 */
router.put('/anuncios/:id', anuncioController.updateAnuncio);

/**
 * @swagger
 * /anuncios/{id}:
 *   delete:
 *     summary: Remove um anúncio
 *     tags: [Anúncios]
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
 *         description: Anúncio removido com sucesso
 *       404:
 *         description: Anúncio não encontrado
 */
router.delete('/anuncios/:id', anuncioController.deleteAnuncio);

/**
 * @swagger
 * /anuncios/{id}/semelhantes:
 *   get:
 *     summary: Obtém anúncios da mesma categoria
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Número máximo de anúncios a retornar
 *     responses:
 *       200:
 *         description: Lista de anúncios da mesma categoria
 */
router.get('/:id/semelhantes', anuncioController.getAnunciosSemelhantes);

module.exports = router; 