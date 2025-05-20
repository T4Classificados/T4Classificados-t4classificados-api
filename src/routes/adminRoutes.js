const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const AnuncioController = require('../controllers/anuncioController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const CampanhaController = require('../controllers/campanhaController');

/**
 * @swagger
 * /admin/usuarios:
 *   get:
 *     summary: Listar todos os usuários (Admin)
 *     description: Lista todos os usuários com informações detalhadas. Apenas para administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo, todos]
 *         description: Filtrar por status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou telefone
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       403:
 *         description: Acesso negado
 */
router.get('/usuarios', auth, adminAuth, UserController.listarAdmin);
/**
 * @swagger
 * /admin/summary:
 *   get:
 *     summary: Obter resumo administrativo
 *     description: Retorna o total de usuários e total de pagamentos cadastrados no sistema. Acesso restrito a administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Totais administrativos retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsuarios:
 *                   type: integer
 *                   example: 150
 *                 totalPagamentos:
 *                   type: integer
 *                   example: 430
 *       403:
 *         description: Acesso negado
 */
router.get('/summary', auth, adminAuth, UserController.AdminSummary);
/**
 * @swagger
 * /admin/usuarios/{id}/status:
 *   patch:
 *     summary: Alterar status do usuário (Admin)
 *     tags: [Admin]
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
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status alterado com sucesso
 *       403:
 *         description: Acesso negado
 */
router.patch('/usuarios/:id/status', auth, adminAuth, UserController.alterarStatus);

/**
 * @swagger
 * /admin/anuncios:
 *   get:
 *     summary: Listar todos os anúncios (Admin)
 *     description: Lista todos os anúncios com informações detalhadas. Apenas para administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de anúncios
 *       403:
 *         description: Acesso negado
 */
router.get('/anuncios', auth, adminAuth, AnuncioController.listar);

/**
 * @swagger
 * /admin/anuncios/{id}:
 *   delete:
 *     summary: Excluir um anúncio (Admin)
 *     tags: [Admin]
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
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Anúncio não encontrado
 */
router.delete('/anuncios/:id', auth, adminAuth, AnuncioController.excluir);

/**
 * @swagger
 * /admin/campanhas:
 *   get:
 *     summary: Listar todas as campanhas (Admin)
 *     description: Lista todas as campanhas com informações detalhadas. Apenas para administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativa, inativa, pendente, todos]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de campanhas
 *       403:
 *         description: Acesso negado
 */
router.get('/campanhas', auth, adminAuth, CampanhaController.listarAdmin);

module.exports = router; 