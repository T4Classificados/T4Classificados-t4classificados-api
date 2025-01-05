const express = require('express');
const router = express.Router();
const AnuncioController = require('../controllers/anuncioController');

/**
 * @swagger
 * /public/anuncios:
 *   get:
 *     summary: Lista todos os anúncios públicos
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 */
router.get('/anuncios', AnuncioController.listarPublicos);

/**
 * @swagger
 * /public/anuncios/{id}:
 *   get:
 *     summary: Obter um anúncio específico
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes do anúncio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     imagem_principal:
 *                       type: string
 *                       format: uri
 *                     imagens:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *       404:
 *         description: Anúncio não encontrado
 */
router.get('/anuncios/:id', AnuncioController.obterPorId);

/**
 * @swagger
 * /public/anuncios/{id}/similares:
 *   get:
 *     summary: Buscar anúncios similares
 *     description: Retorna anúncios similares baseado na categoria e tipo de transação
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio de referência
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Número máximo de anúncios similares a retornar
 *     responses:
 *       200:
 *         description: Lista de anúncios similares
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
 *                       preco:
 *                         type: number
 *                       provincia:
 *                         type: string
 *                       municipio:
 *                         type: string
 *                       tipo_transacao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 *       404:
 *         description: Anúncio de referência não encontrado
 *       500:
 *         description: Erro do servidor
 */
router.get('/anuncios/:id/similares', AnuncioController.buscarSimilares);

/**
 * @swagger
 * /public/anuncios/{id}/usuario-similares:
 *   get:
 *     summary: Buscar anúncios similares do mesmo usuário
 *     description: Retorna outros anúncios do mesmo usuário, priorizando mesma categoria e tipo de transação
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio de referência
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Número máximo de anúncios similares a retornar
 *     responses:
 *       200:
 *         description: Lista de anúncios similares do usuário
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
 *                       preco:
 *                         type: number
 *                       provincia:
 *                         type: string
 *                       municipio:
 *                         type: string
 *                       tipo_transacao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 *       404:
 *         description: Anúncio de referência não encontrado
 *       500:
 *         description: Erro do servidor
 */
router.get('/anuncios/:id/usuario-similares', AnuncioController.buscarSimilaresDoUsuario);

module.exports = router; 