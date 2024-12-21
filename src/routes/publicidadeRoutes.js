const express = require('express');
const router = express.Router();
const publicidadeController = require('../controllers/publicidadeController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const publicidadeMetricaController = require('../controllers/publicidadeMetricaController');

/**
 * @swagger
 * /publicidades:
 *   post:
 *     summary: Submete uma nova publicidade
 *     tags: [Publicidade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - objetivo
 *               - contato
 *               - plafond_maximo
 *               - data_inicio
 *               - data_fim
 *               - imagens
 *             properties:
 *               titulo:
 *                 type: string
 *               objetivo:
 *                 type: string
 *                 enum: [whatsapp, ligacao, site]
 *               contato:
 *                 type: string
 *               plafond_maximo:
 *                 type: number
 *               plafond_diario:
 *                 type: number
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Publicidade criada com sucesso
 */
router.post('/', 
  authMiddleware,
  upload.array('imagens', 8),
  publicidadeController.createPublicidade
);

/**
 * @swagger
 * /publicidades:
 *   get:
 *     summary: Lista todas as publicidades do usuário
 *     tags: [Publicidade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, aprovado, rejeitado]
 *     responses:
 *       200:
 *         description: Lista de publicidades
 */
router.get('/', 
  authMiddleware, 
  publicidadeController.getPublicidades
);

/**
 * @swagger
 * /publicidades/pendentes:
 *   get:
 *     summary: Lista todas as publicidades pendentes
 *     tags: [Publicidade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de publicidades pendentes
 */
router.get('/pendentes',
  authMiddleware,
  publicidadeController.getPublicidadesPendentes
);

/**
 * @swagger
 * /publicidades/{id}/aprovar:
 *   put:
 *     summary: Aprova uma publicidade (admin)
 *     tags: [Publicidade]
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
 *         description: Publicidade aprovada com sucesso
 */
router.put('/:id/aprovar', 
  authMiddleware, 
  publicidadeController.aprovarPublicidade
);

/**
 * @swagger
 * /publicidades/{id}/rejeitar:
 *   put:
 *     summary: Rejeita uma publicidade (admin)
 *     tags: [Publicidade]
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
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Publicidade rejeitada com sucesso
 */
router.put('/:id/rejeitar', 
  authMiddleware, 
  publicidadeController.rejeitarPublicidade
);

/**
 * @swagger
 * /publicidades/{id}/solicitar-alteracao:
 *   put:
 *     summary: Solicita alterações em uma publicidade (admin)
 *     tags: [Publicidade]
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
 *               - solicitacao
 *             properties:
 *               solicitacao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solicitação enviada com sucesso
 */
router.put('/:id/solicitar-alteracao',
  authMiddleware,
  publicidadeController.solicitarAlteracao
);

/**
 * @swagger
 * /publicidades/{id}:
 *   put:
 *     summary: Atualiza uma publicidade
 *     tags: [Publicidade]
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
 *               titulo:
 *                 type: string
 *               objetivo:
 *                 type: string
 *                 enum: [whatsapp, ligacao, site]
 *               contato:
 *                 type: string
 *               plafond_maximo:
 *                 type: number
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Publicidade atualizada com sucesso
 */
router.put('/:id',
  authMiddleware,
  upload.array('imagens', 8),
  publicidadeController.atualizarPublicidade
);

/**
 * @swagger
 * /publicidades/{id}/metricas:
 *   get:
 *     summary: Obtém métricas de uma publicidade
 *     tags: [Publicidade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [hoje, semana, mes]
 *     responses:
 *       200:
 *         description: Métricas da publicidade
 */
router.get('/:id/metricas',
  authMiddleware,
  publicidadeMetricaController.getMetricas
);

/**
 * @swagger
 * /publicidades/{id}/plafond:
 *   get:
 *     summary: Obtém status do plafond de uma publicidade
 *     tags: [Publicidade]
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
 *         description: Status do plafond
 */
router.get('/:id/plafond',
  authMiddleware,
  publicidadeMetricaController.getPlafondStatus
);

/**
 * @swagger
 * /publicidades/{id}/impressao:
 *   post:
 *     summary: Registra uma impressão da publicidade
 *     tags: [Publicidade]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Impressão registrada com sucesso
 */
router.post('/:id/impressao', publicidadeMetricaController.registrarImpressao);

/**
 * @swagger
 * /publicidades/{id}/clique:
 *   post:
 *     summary: Registra um clique na publicidade
 *     tags: [Publicidade]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Clique registrado com sucesso
 */
router.post('/:id/clique', publicidadeMetricaController.registrarClique);

module.exports = router; 