const express = require('express');
const router = express.Router();
const empregoController = require('../controllers/empregoController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Emprego:
 *       type: object
 *       required:
 *         - titulo
 *         - empresa
 *         - descricao
 *         - requisitos
 *         - categoria
 *         - modalidade
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título da vaga
 *         empresa:
 *           type: string
 *           description: Nome da empresa
 *         descricao:
 *           type: string
 *           description: Descrição detalhada da vaga
 *         requisitos:
 *           type: string
 *           description: Requisitos para a vaga
 *         categoria:
 *           type: string
 *           description: Categoria da vaga
 *         modalidade:
 *           type: string
 *           enum: [presencial, remoto, hibrido]
 *           description: Modalidade de trabalho
 *         salario:
 *           type: number
 *           description: Salário oferecido
 *         localizacao:
 *           type: string
 *           description: Localização da vaga
 *         nivel_experiencia:
 *           type: string
 *           enum: [junior, pleno, senior]
 *           description: Nível de experiência requerido
 */

/**
 * @swagger
 * /empregos:
 *   post:
 *     summary: Cria uma nova vaga de emprego
 *     tags: [Empregos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Emprego'
 *     responses:
 *       201:
 *         description: Vaga criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/empregos', empregoController.createEmprego);

/**
 * @swagger
 * /empregos:
 *   get:
 *     summary: Lista todas as vagas de emprego
 *     tags: [Empregos]
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
 *         description: Lista de vagas
 */
router.get('/empregos', empregoController.getEmpregos);

/**
 * @swagger
 * /empregos/{id}:
 *   get:
 *     summary: Obtém uma vaga específica
 *     tags: [Empregos]
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
 *         description: Vaga encontrada
 *       404:
 *         description: Vaga não encontrada
 */
router.get('/empregos/:id', empregoController.getEmpregoById);

/**
 * @swagger
 * /empregos/{id}:
 *   put:
 *     summary: Atualiza uma vaga
 *     tags: [Empregos]
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
 *             $ref: '#/components/schemas/Emprego'
 *     responses:
 *       200:
 *         description: Vaga atualizada com sucesso
 *       404:
 *         description: Vaga não encontrada
 */
router.put('/empregos/:id', empregoController.updateEmprego);

/**
 * @swagger
 * /empregos/{id}:
 *   delete:
 *     summary: Remove uma vaga
 *     tags: [Empregos]
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
 *         description: Vaga removida com sucesso
 *       404:
 *         description: Vaga não encontrada
 */
router.delete('/empregos/:id', empregoController.deleteEmprego);

module.exports = router; 