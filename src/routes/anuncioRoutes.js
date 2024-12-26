const express = require('express');
const router = express.Router();
const AnuncioController = require('../controllers/anuncioController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * components:
 *   schemas:
 *     Anuncio:
 *       type: object
 *       required:
 *         - titulo
 *         - tipo_transacao
 *         - categoria
 *         - preco
 *         - provincia
 *         - municipio
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título do anúncio
 *         tipo_transacao:
 *           type: string
 *           description: Tipo de transação (venda, aluguel, etc)
 *         categoria:
 *           type: string
 *           description: Categoria do anúncio
 *         preco:
 *           type: number
 *           description: Preço do item
 *         preco_negociavel:
 *           type: boolean
 *           description: Se o preço é negociável
 *         provincia:
 *           type: string
 *           description: Província onde está o item
 *         municipio:
 *           type: string
 *           description: Município onde está o item
 *         zona:
 *           type: string
 *           description: Zona/bairro onde está o item
 *         descricao:
 *           type: string
 *           description: Descrição detalhada do anúncio
 *         whatsapp:
 *           type: string
 *           description: Número de WhatsApp para contato
 */

/**
 * @swagger
 * /anuncios:
 *   post:
 *     summary: Criar novo anúncio
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
 *               tipo_transacao:
 *                 type: string
 *               categoria:
 *                 type: string
 *               preco:
 *                 type: number
 *               preco_negociavel:
 *                 type: boolean
 *               provincia:
 *                 type: string
 *               municipio:
 *                 type: string
 *               zona:
 *                 type: string
 *               descricao:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Anúncio criado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro do servidor
 */
router.post('/anuncios', 
    auth, 
    upload.array('imagens', 8),
    AnuncioController.criar
);

/**
 * @swagger
 * /anuncios/{id}:
 *   get:
 *     summary: Obter um anúncio específico
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio
 *     responses:
 *       200:
 *         description: Detalhes do anúncio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anuncio'
 *       404:
 *         description: Anúncio não encontrado
 */
router.get('/anuncios/:id', AnuncioController.obterPorId);

/**
 * @swagger
 * /anuncios:
 *   get:
 *     summary: Listar todos os anúncios
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
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: provincia
 *         schema:
 *           type: string
 *         description: Filtrar por província
 *     responses:
 *       200:
 *         description: Lista de anúncios
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
 *                     $ref: '#/components/schemas/Anuncio'
 */
router.get('/anuncios', AnuncioController.listar);

/**
 * @swagger
 * /anuncios/{id}:
 *   put:
 *     summary: Atualizar um anúncio
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Anuncio'
 *     responses:
 *       200:
 *         description: Anúncio atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Anúncio não encontrado
 */
router.put('/anuncios/:id', 
    auth, 
    upload.array('imagens', 8),
    AnuncioController.atualizar
);

/**
 * @swagger
 * /anuncios/{id}:
 *   delete:
 *     summary: Excluir um anúncio
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
 *         description: Anúncio excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Anúncio não encontrado
 */
router.delete('/anuncios/:id', 
    auth, 
    AnuncioController.excluir
);

module.exports = router; 