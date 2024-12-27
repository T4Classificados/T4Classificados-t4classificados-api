const express = require('express');
const router = express.Router();
const EstatisticasController = require('../controllers/estatisticasController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /estatisticas:
 *   get:
 *     summary: Obter estatísticas dos anúncios
 *     description: Retorna estatísticas detalhadas dos anúncios do usuário
 *     tags: [Estatísticas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtrar (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtrar (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     periodo:
 *                       type: object
 *                       properties:
 *                         inicio:
 *                           type: string
 *                           format: date
 *                         fim:
 *                           type: string
 *                           format: date
 *                     resumo:
 *                       type: object
 *                       properties:
 *                         total_anuncios:
 *                           type: integer
 *                           example: 1482
 *                         total_visualizacoes:
 *                           type: integer
 *                           example: 12450
 *                         total_chamadas:
 *                           type: integer
 *                           example: 3624
 *                         total_mensagens:
 *                           type: integer
 *                           example: 2847
 *                         total_compartilhamentos:
 *                           type: integer
 *                           example: 1936
 *                         media_visualizacoes:
 *                           type: number
 *                           example: 8.4
 *                         media_chamadas:
 *                           type: number
 *                           example: 2.4
 *                     crescimento:
 *                       type: object
 *                       properties:
 *                         anuncios:
 *                           type: string
 *                           example: "2.5"
 *                         visualizacoes:
 *                           type: string
 *                           example: "12.5"
 *                         chamadas:
 *                           type: string
 *                           example: "8.2"
 *                         mensagens:
 *                           type: string
 *                           example: "5.7"
 *                         compartilhamentos:
 *                           type: string
 *                           example: "3.1"
 *                     categorias:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                             example: "Apartamentos"
 *                           total_anuncios:
 *                             type: integer
 *                             example: 667
 *                           visualizacoes:
 *                             type: integer
 *                             example: 5603
 *                           porcentagem:
 *                             type: number
 *                             example: 45.0
 */
router.get('/', auth, EstatisticasController.obterEstatisticas);

module.exports = router; 