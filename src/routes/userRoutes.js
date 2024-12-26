const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const userPreferencesController = require('../controllers/userPreferencesController');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - nome
 *         - sobrenome
 *         - telefone
 *         - senha
 *         - provincia
 *         - municipio
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome do usuário
 *         sobrenome:
 *           type: string
 *           description: Sobrenome do usuário
 *         telefone:
 *           type: string
 *           description: Número de telefone do usuário
 *         senha:
 *           type: string
 *           description: Senha do usuário
 *         provincia:
 *           type: string
 *           description: Província do usuário
 *         municipio:
 *           type: string
 *           description: Municipio do usuário
 *     UserPreferences:
 *       type: object
 *       properties:
 *         notificacoes_promocoes:
 *           type: boolean
 *           description: Receber alertas sobre novas promoções e ofertas especiais
 *         alertas_emprego:
 *           type: boolean
 *           description: Receber notificações sobre novas vagas de emprego
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Dados inválidos ou usuário já existe
 *       500:
 *         description: Erro no servidor
 */
router.post('/register', userController.register);

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
 *               lembrar:
 *                 type: boolean
 *                 description: Se true, mantém o usuário logado por 30 dias
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais inválidas
 *       403:
 *         description: Conta não ativada
 */
router.post('/login', (req, res, next) => {
  userController.loginUser(req, res, next);
});

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

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Obtém informações do usuário logado
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações do usuário obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
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
 *                     is_active:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/me', authMiddleware, userController.getCurrentUser);

/**
 * @swagger
 * /resend-confirmation:
 *   post:
 *     summary: Reenvia o código de confirmação
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
 *             properties:
 *               telefone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Novo código de confirmação enviado com sucesso
 *       400:
 *         description: Conta já está ativa
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao enviar o código de confirmação
 */
router.post('/resend-confirmation', userController.resendConfirmationCode);

/**
 * @swagger
 * /request-password-reset:
 *   post:
 *     summary: Solicita redefinição de senha
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
 *             properties:
 *               telefone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código de redefinição enviado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao enviar o código de redefinição
 */
router.post('/request-password-reset', userController.requestPasswordReset);

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Redefine a senha do usuário
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
 *               - resetCode
 *               - newPassword
 *             properties:
 *               telefone:
 *                 type: string
 *               resetCode:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Código de redefinição inválido
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao redefinir senha
 */
router.post('/reset-password', userController.resetPassword);

/**
 * @swagger
 * /change-password:
 *   put:
 *     summary: Altera a senha do usuário logado
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senhaAtual
 *               - novaSenha
 *             properties:
 *               senhaAtual:
 *                 type: string
 *               novaSenha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Senha atual incorreta ou nova senha igual à atual
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao alterar senha
 */
router.put('/change-password', authMiddleware, userController.changePassword);


/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Realiza logout do usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       500:
 *         description: Erro ao realizar logout
 */
router.post('/logout', authMiddleware, userController.logout);

/**
 * @swagger
 * /update-profile:
 *   patch:
 *     summary: Atualiza informações do perfil do usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do usuário
 *               genero:
 *                 type: string
 *                 enum: [masculino, feminino, outro]
 *                 description: Gênero do usuário
 *               provincia:
 *                 type: string
 *                 description: Província do usuário
 *               municipio:
 *                 type: string
 *                 description: Municipio do usuário
 *     responses:
 *       200:
 *         description: Informações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos fornecidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao atualizar informações
 */
router.patch('/update-profile', authMiddleware, userController.updateUser);

/**
 * @swagger
 * /preferences:
 *   get:
 *     summary: Obtém as preferências do usuário
 *     tags: [Preferências]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferências obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 preferences:
 *                   $ref: '#/components/schemas/UserPreferences'
 */
router.get('/preferences', authMiddleware, userPreferencesController.getPreferences);

/**
 * @swagger
 * /preferences:
 *   put:
 *     summary: Atualiza as preferências do usuário
 *     tags: [Preferências]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: Preferências atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 preferences:
 *                   $ref: '#/components/schemas/UserPreferences'
 */
router.put('/preferences', authMiddleware, userPreferencesController.updatePreferences);

module.exports = router;