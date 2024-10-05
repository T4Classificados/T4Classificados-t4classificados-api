const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const guestController = require('../controllers/guestController');
const contactController = require('../controllers/contactController');
const isAdminMiddleware = require('../middleware/isAdmin'); // Importe o middleware de admin

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

router.get('/:idUser/guests', authMiddleware, guestController.getGuestsByUserId);

/**
 * @swagger
 * /validate-guest-code:
 *   post:
 *     summary: Valida o código do convidado
 *     tags: [Convidados]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telefone
 *               - codigo
 *             properties:
 *               telefone:
 *                 type: string
 *               codigo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código validado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 guest:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     telefone:
 *                       type: string
 *                     status:
 *                       type: string
 *                     evento_id:
 *                       type: integer
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro ao validar código
 */
router.post('/validate-guest-code', guestController.validateGuestCode);

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Envia formulário de contato
 *     tags: [Contato]
 *     security: [] # Remove a necessidade de autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomeEmpresa
 *               - telefone
 *             properties:
 *               nomeEmpresa:
 *                 type: string
 *               telefone:
 *                 type: string
 *               mensagem:
 *                 type: string
 *     responses:
 *       201:
 *         description: Formulário de contato enviado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro ao processar formulário de contato
 */
router.post('/contact', contactController.submitContactForm);

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Lista todos os contatos
 *     tags: [Contato]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contatos obtida com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 *       500:
 *         description: Erro ao buscar contatos
 */
router.get('/contacts', authMiddleware, isAdminMiddleware, contactController.getAllContacts);

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Obtém detalhes de um contato específico
 *     tags: [Contato]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contato
 *     responses:
 *       200:
 *         description: Detalhes do contato obtidos com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 *       404:
 *         description: Contato não encontrado
 *       500:
 *         description: Erro ao buscar contato
 */
router.get('/contacts/:id', authMiddleware, isAdminMiddleware, contactController.getContactById);

module.exports = router;