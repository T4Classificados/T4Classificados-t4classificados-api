const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /guests/confirm/{token}:
 *   post:
 *     summary: Confirma a presença de um convidado
 *     tags: [Convidados]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [aceito, rejeitado]
 *     responses:
 *       200:
 *         description: Presença confirmada com sucesso
 *       400:
 *         description: Token inválido ou presença já confirmada
 *       404:
 *         description: Convidado não encontrado
 */
router.post('/guests/confirm/:token', guestController.confirmPresence);

/**
 * @swagger
 * /guests/update-status/{telefone}:
 *   put:
 *     summary: Atualiza o status de um convidado pelo telefone
 *     tags: [Convidados]
 *     parameters:
 *       - in: path
 *         name: telefone
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [aceito, rejeitado, pendente]
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Status inválido
 *       404:
 *         description: Convidado não encontrado
 */
router.put('/guests/update-status/:telefone', guestController.updateGuestStatusByTelefone);

// Rotas protegidas
router.use('/guests', authMiddleware);

/**
 * @swagger
 * /guests:
 *   post:
 *     summary: Cria um novo convidado
 *     tags: [Convidados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - telefone
 *               - eventoId
 *             properties:
 *               nome:
 *                 type: string
 *               telefone:
 *                 type: string
 *               acompanhante:
 *                 type: boolean
 *               numeroAcompanhantes:
 *                 type: integer
 *               tipoAcompanhante:
 *                 type: string
 *               eventoId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Convidado criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/guests', guestController.createGuest);

/**
 * @swagger
 * /guests:
 *   get:
 *     summary: Lista todos os convidados
 *     tags: [Convidados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de convidados obtida com sucesso
 *       401:
 *         description: Não autorizado
 */
router.get('/guests', guestController.getAllGuests);

/**
 * @swagger
 * /guests/{id}:
 *   get:
 *     summary: Obtém um convidado específico
 *     tags: [Convidados]
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
 *         description: Convidado obtido com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Convidado não encontrado
 */
router.get('/guests/:id', guestController.getGuestById);

/**
 * @swagger
 * /guests/{id}:
 *   put:
 *     summary: Atualiza um convidado
 *     tags: [Convidados]
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
 *             properties:
 *               nome:
 *                 type: string
 *               telefone:
 *                 type: string
 *               acompanhante:
 *                 type: boolean
 *               numeroAcompanhantes:
 *                 type: integer
 *               tipoAcompanhante:
 *                 type: string
 *               eventoId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [aceito, rejeitado, pendente]
 *     responses:
 *       200:
 *         description: Convidado atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Convidado não encontrado
 */
router.put('/guests/:id', guestController.updateGuest);

/**
 * @swagger
 * /guests/{id}:
 *   delete:
 *     summary: Exclui um convidado
 *     tags: [Convidados]
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
 *         description: Convidado excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Convidado não encontrado
 */
router.delete('/guests/:id', guestController.deleteGuest);

// ... (mantenha as rotas existentes)

/**
 * @swagger
 * /user/{idUser}/guests:
 *   get:
 *     summary: Lista todos os convidados de um usuário específico
 *     tags: [Convidados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de convidados obtida com sucesso
 *       401:
 *         description: Não autorizado
 */
router.get('/user/:idUser/guests', authMiddleware, guestController.getGuestsByUserId);

/**
 * @swagger
 * /user/{idUser}/guests:
 *   post:
 *     summary: Cria um novo convidado para um usuário específico
 *     tags: [Convidados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
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
 *               - nome
 *               - telefone
 *               - eventoId
 *             properties:
 *               nome:
 *                 type: string
 *               telefone:
 *                 type: string
 *               acompanhante:
 *                 type: boolean
 *               numeroAcompanhantes:
 *                 type: integer
 *               tipoAcompanhante:
 *                 type: string
 *               eventoId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Convidado criado com sucesso
 *       401:
 *         description: Não autorizado
 */
router.post('/user/:idUser/guests', authMiddleware, guestController.createGuestForUser);

/**
 * @swagger
 * /user/{idUser}/guests/{guestId}:
 *   get:
 *     summary: Obtém um convidado específico de um usuário
 *     tags: [Convidados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Convidado obtido com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Convidado não encontrado
 */
router.get('/user/:idUser/guests/:guestId', authMiddleware, guestController.getGuestByIdAndUserId);

/**
 * @swagger
 * /user/{idUser}/guests/{guestId}:
 *   put:
 *     summary: Atualiza um convidado específico de um usuário
 *     tags: [Convidados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               telefone:
 *                 type: string
 *               acompanhante:
 *                 type: boolean
 *               numeroAcompanhantes:
 *                 type: integer
 *               tipoAcompanhante:
 *                 type: string
 *               eventoId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [aceito, rejeitado, pendente]
 *     responses:
 *       200:
 *         description: Convidado atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Convidado não encontrado
 */
router.put('/user/:idUser/guests/:guestId', authMiddleware, guestController.updateGuestForUser);

/**
 * @swagger
 * /user/{idUser}/guests/{guestId}:
 *   delete:
 *     summary: Exclui um convidado específico de um usuário
 *     tags: [Convidados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Convidado excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Convidado não encontrado
 */
router.delete('/user/:idUser/guests/:guestId', authMiddleware, guestController.deleteGuestForUser);

module.exports = router;