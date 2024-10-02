const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Usuários]
 *     security: [] # Remove a necessidade de autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - sobrenome
 *               - telefone
 *               - senha
 *             properties:
 *               nome:
 *                 type: string
 *               sobrenome:
 *                 type: string
 *               telefone:
 *                 type: string
 *               senha:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Dados inválidos ou usuário já existe
 */
router.post('/register', userController.registerUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Usuários]
 *     security: [] # Remove a necessidade de autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telefone
 *               - senha
 *             properties:
 *               telefone:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       401:
 *         description: Credenciais inválidas
 *       403:
 *         description: Conta não ativada
 */
router.post('/login', userController.loginUser);

/**
 * @swagger
 * /confirm-account:
 *   post:
 *     summary: Confirma a conta do usuário
 *     tags: [Usuários]
 *     security: [] # Remove a necessidade de autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telefone
 *               - confirmationCode
 *             properties:
 *               telefone:
 *                 type: string
 *               confirmationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conta confirmada com sucesso
 *       400:
 *         description: Código de confirmação inválido ou conta já ativa
 *       404:
 *         description: Usuário não encontrado
 */
router.post('/confirm-account', userController.confirmAccount);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Atualiza o token de acesso usando um refresh token
 *     tags: [Usuários]
 *     security: [] # Remove a necessidade de autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens atualizados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     sobrenome:
 *                       type: string
 *                     telefone:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Refresh token não fornecido
 *       401:
 *         description: Refresh token inválido ou expirado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao atualizar token
 */
router.post('/refresh-token', userController.refreshToken);

module.exports = router;