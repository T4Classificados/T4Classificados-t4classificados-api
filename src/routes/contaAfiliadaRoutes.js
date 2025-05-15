const express = require('express');
const router = express.Router();
const ContaAfiliadaController = require('../controllers/contaAfiliadaController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     ContaAfiliada:
 *       type: object
 *       required:
 *         - bi
 *         - iban
 *       properties:
 *         id:
 *           type: integer
 *         bi:
 *           type: string
 *           description: Número do Bilhete de Identidade
 *         iban:
 *           type: string
 *           description: Número IBAN da conta bancária
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * 
 * /conta-afiliada:
 *   post:
 *     summary: Vincular conta afiliada ao usuário (opcional)
 *     description: Permite vincular uma conta afiliada ao usuário. Não é possível vincular conta afiliada se o usuário já tiver empresa.
 *     tags: [Conta Afiliada]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bi
 *               - iban
 *             properties:
 *               bi:
 *                 type: string
 *                 description: Número do Bilhete de Identidade
 *               iban:
 *                 type: string
 *                 description: Número IBAN da conta bancária
 *     responses:
 *       201:
 *         description: Conta afiliada vinculada com sucesso
 *       400:
 *         description: Dados inválidos, BI já cadastrado ou usuário com empresa vinculada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Usuários com empresa vinculada não podem criar conta afiliada
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro do servidor
 */
router.post('/', auth, ContaAfiliadaController.vincularConta);

module.exports = router; 