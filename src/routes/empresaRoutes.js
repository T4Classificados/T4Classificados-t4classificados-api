const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/empresaController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const uploadFields = upload.fields([
    { name: 'logo', maxCount: 1 }
]);

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nome:
 *           type: string
 *         email:
 *           type: string
 *         empresa_id:
 *           type: integer
 *           nullable: true
 *           description: ID da empresa vinculada (opcional)
 * 
 * /empresa:
 *   post:
 *     summary: Vincular empresa ao usuário (opcional)
 *     description: Permite vincular uma empresa ao usuário. Um usuário pode existir sem empresa vinculada.
 *     tags: [Empresa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - nif
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da empresa
 *               nif:
 *                 type: string
 *                 description: NIF (Número de Identificação Fiscal) da empresa
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo da empresa (opcional)
 *     responses:
 *       201:
 *         description: Empresa vinculada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Empresa vinculada com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     nif:
 *                       type: string
 *                     logo_url:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Dados inválidos ou NIF já cadastrado
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
 *                   example: Já existe uma empresa cadastrada com este NIF
 *       500:
 *         description: Erro do servidor
 */
router.post('/', auth, uploadFields, EmpresaController.vincularEmpresa);

module.exports = router; 