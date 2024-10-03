const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.use(authMiddleware);

/**
 * @swagger
 * /events/statistics:
 *   get:
 *     summary: Obtém estatísticas dos eventos
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 */
router.get('/events/statistics', eventController.getEventStatistics);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Cria um novo evento
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               data:
 *                 type: string
 *                 format: date
 *               local:
 *                 type: string
 *               tipo:
 *                 type: string
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Evento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 eventId:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 */
router.post('/events', upload.single('imagem'), eventController.createEvent);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Lista todos os eventos
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Lista de eventos obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   data:
 *                     type: string
 *                     format: date
 *                   local:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   imagemUrl:
 *                     type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       sobrenome:
 *                         type: string
 *                       telefone:
 *                         type: string
 */
router.get('/events', eventController.getAllEvents);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Obtém um evento específico
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evento obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 data:
 *                   type: string
 *                   format: date
 *                 local:
 *                   type: string
 *                 tipo:
 *                   type: string
 *                 imagemUrl:
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
 *       404:
 *         description: Evento não encontrado
 */
router.get('/events/:id', eventController.getEventById);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Atualiza um evento
 *     tags: [Eventos]
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
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               data:
 *                 type: string
 *                 format: date
 *               local:
 *                 type: string
 *               tipo:
 *                 type: string
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Evento atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Evento não encontrado
 */
router.put('/events/:id', upload.single('imagem'), eventController.updateEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Exclui um evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evento excluído com sucesso
 *       404:
 *         description: Evento não encontrado
 */
router.delete('/events/:id', eventController.deleteEvent);

/**
 * @swagger
 * /events/user-statistics/{userId}:
 *   get:
 *     summary: Obtém estatísticas dos eventos de um usuário específico
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                 totalGuests:
 *                   type: integer
 *                 acceptedInvitations:
 *                   type: integer
 *                 rejectedInvitations:
 *                   type: integer
 *                 pendingInvitations:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro ao buscar estatísticas
 */
router.get('/events/user-statistics/:userId', authMiddleware, eventController.getUserEventStatistics);

/**
 * @swagger
 * /events/link/{eventLink}:
 *   get:
 *     summary: Obtém um evento específico pelo link
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventLink
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 data:
 *                   type: string
 *                   format: date
 *                 local:
 *                   type: string
 *                 tipo:
 *                   type: string
 *                 imagemUrl:
 *                   type: string
 *                 event_link:
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
 *       404:
 *         description: Evento não encontrado
 */
router.get('/events/link/:eventLink', eventController.getEventByLink);

/**
 * @swagger
 * /user/{idUser}/events:
 *   get:
 *     summary: Lista todos os eventos de um usuário específico
 *     tags: [Eventos]
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
 *         description: Lista de eventos obtida com sucesso
 *       401:
 *         description: Não autorizado
 */
router.get('/user/:idUser/events', authMiddleware, eventController.getUserEvents);

/**
 * @swagger
 * /user/{idUser}/events:
 *   post:
 *     summary: Cria um novo evento para um usuário específico
 *     tags: [Eventos]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               data:
 *                 type: string
 *                 format: date
 *               local:
 *                 type: string
 *               tipo:
 *                 type: string
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Evento criado com sucesso
 *       401:
 *         description: Não autorizado
 */
router.post('/user/:idUser/events', authMiddleware, upload.single('imagem'), eventController.createUserEvent);

/**
 * @swagger
 * /user/{idUser}/events/{eventId}:
 *   get:
 *     summary: Obtém um evento específico de um usuário
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evento obtido com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Evento não encontrado
 */
router.get('/user/:idUser/events/:eventId', authMiddleware, eventController.getUserEventById);

/**
 * @swagger
 * /user/{idUser}/events/{eventId}:
 *   put:
 *     summary: Atualiza um evento específico de um usuário
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               data:
 *                 type: string
 *                 format: date
 *               local:
 *                 type: string
 *               tipo:
 *                 type: string
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Evento atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Evento não encontrado
 */
router.put('/user/:idUser/events/:eventId', authMiddleware, upload.single('imagem'), eventController.updateUserEvent);

/**
 * @swagger
 * /user/{idUser}/events/{eventId}:
 *   delete:
 *     summary: Exclui um evento específico de um usuário
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evento excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Evento não encontrado
 */
router.delete('/user/:idUser/events/:eventId', authMiddleware, eventController.deleteUserEvent);

/**
 * @swagger
 * /events/link/{eventLink}/check-guest/{telefone}:
 *   get:
 *     summary: Verifica se um convidado está associado a um evento específico usando o link do evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: eventLink
 *         required: true
 *         schema:
 *           type: string
 *         description: Link do evento
 *       - in: path
 *         name: telefone
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de telefone do convidado
 *     responses:
 *       200:
 *         description: Verificação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isInvited:
 *                   type: boolean
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
 *       500:
 *         description: Erro ao verificar convidado
 */
router.get('/events/link/:eventLink/check-guest/:telefone', eventController.checkGuestByEventLinkAndPhone);

module.exports = router;