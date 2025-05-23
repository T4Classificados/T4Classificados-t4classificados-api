const express = require('express');
const router = express.Router();
const CampanhaController = require('../controllers/campanhaController');
const auth = require('../middleware/auth');
//const upload = require('../middleware/upload');

const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

const uploadFields = upload.fields([
    { name: 'imagens', maxCount: 8 },
    { name: 'logo', maxCount: 1 }
]);

/**
 * @swagger
 * components:
 *   schemas:
 *     Empresa:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nome:
 *           type: string
 *         nif:
 *           type: string
 *         logo_url:
 *           type: string
 *           nullable: true
 *     Campanha:
 *       type: object
 *       required:
 *         - nome
 *         - tipo_exibicao
 *         - espaco_exibicao
 *         - num_visualizacoes
 *         - valor_visualizacao
 *       properties:
 *         id:
 *           type: integer
 *         nome:
 *           type: string
 *           description: Nome da campanha
 *         tipo_exibicao:
 *           type: string
 *           enum: [computador, telemóvel, ambos]
 *         espaco_exibicao:
 *           type: string
 *           enum: [cabecalho-pagina-principal, cabecalho-pagina-imoveis, cabecalho-pagina-carros, cabecalho-pagina-bebe-criancas, pagina-principal, pagina-principal-ver-anuncios, pagina-imoveis-carros-desapego, pagina-bebe-criancas, pagina-tecnologia]
 *         descricao:
 *           type: string
 *         logo_url:
 *           type: string
 *           nullable: true
 *         botao_texto:
 *           type: string
 *         num_visualizacoes:
 *           type: integer
 *         valor_visualizacao:
 *           type: number
 *         total_pagar:
 *           type: number
 *         views:
 *           type: integer
 *           description: Número de visualizações recebidas
 *         chamadas:
 *           type: integer
 *           description: Número de chamadas recebidas
 *         cliques:
 *           type: integer
 *           description: Número de cliques recebidos
 *         status:
 *           type: string
 *           enum: [pendente, ativa, pausada, concluida, rejeitada]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         imagens:
 *           type: array
 *           items:
 *             type: string
 *         empresa:
 *           $ref: '#/components/schemas/Empresa'
 *         channel_value:
 *           type: string
 *         reference_id:
 *           type: string
 *           description: ID de referência para pagamento
 */

/**
 * @swagger
 * /campanhas:
 *   post:
 *     summary: Criar nova campanha
 *     description: Cria uma nova campanha vinculada à empresa do usuário. É necessário ter uma empresa vinculada.
 *     tags: [Campanhas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_exibicao
 *               - espaco_exibicao
 *               - num_visualizacoes
 *               - valor_visualizacao
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da campanha
 *               tipo_exibicao:
 *                 type: string
 *                 enum: [computador, telemóvel, ambos]
 *               espaco_exibicao:
 *                 type: string
 *                 enum: [cabecalho_pagina_principal, pagina_principal, pagina_princiapl_ver_anuncios, pagina_imoveis_carros_desapego, paganina_bebe, pagina_tecnologia]
 *               descricao:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *               botao_texto:
 *                 type: string
 *               channel_value:
 *                 type: string
 *               num_visualizacoes:
 *                 type: integer
 *                 minimum: 1
 *               valor_visualizacao:
 *                 type: number
 *                 format: float
 *               total_pagar:
 *                 type: number
 *                 format: float
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Campanha criada com sucesso
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
 *                   example: Campanha criada com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Campanha'
 *       400:
 *         description: Dados inválidos ou usuário sem empresa vinculada
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro do servidor
 */
router.post('/', auth, uploadFields, CampanhaController.criar);

/**
 * @swagger
 * /campanhas:
 *   get:
 *     summary: Listar campanhas do usuário
 *     tags: [Campanhas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de campanhas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campanha'
 */
router.get('/', auth, CampanhaController.listar);

/**
 * @swagger
 * /campanhas/{id}:
 *   get:
 *     summary: Obter uma campanha específica
 *     tags: [Campanhas]
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
 *         description: Detalhes da campanha
 *       404:
 *         description: Campanha não encontrada
 */
router.get('/:id', auth, CampanhaController.obterPorId);

/**
 * @swagger
 * /campanhas/{id}:
 *   put:
 *     summary: Atualizar uma campanha
 *     tags: [Campanhas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da campanha
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_exibicao:
 *                 type: string
 *                 enum: [computador, telemóvel, ambos]
 *               espaco_exibicao:
 *                 type: string
 *                 enum: [cabecalho_pagina_principal, pagina_principal, pagina_princiapl_ver_anuncios, pagina_imoveis_carros_desapego, paganina_bebe, pagina_tecnologia]
 *               descricao:
 *                 type: string
 *               botao_texto:
 *                 type: string
 *               num_visualizacoes:
 *                 type: integer
 *               valor_visualizacao:
 *                 type: number
 *               total_pagar:
 *                 type: number
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Campanha atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Campanha não encontrada
 *       500:
 *         description: Erro do servidor
 */
router.put('/:id', auth, uploadFields, CampanhaController.atualizar);

/**
 * @swagger
 * /campanhas/{id}:
 *   delete:
 *     summary: Excluir uma campanha
 *     tags: [Campanhas]
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
 *         description: Campanha excluída com sucesso
 *       404:
 *         description: Campanha não encontrada
 *       500:
 *         description: Erro do servidor
 */
router.delete('/:id', auth, CampanhaController.excluir);

/**
 * @swagger
 * /campanhas/{id}/promover:
 *   post:
 *     summary: Promover novamente uma campanha
 *     description: Cria uma nova campanha baseada em uma existente
 *     tags: [Campanhas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da campanha a ser promovida novamente
 *     responses:
 *       201:
 *         description: Campanha promovida com sucesso
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
 *                   example: Campanha promovida novamente com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Campanha'
 *       400:
 *         description: Usuário sem empresa vinculada
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Campanha não encontrada
 *       500:
 *         description: Erro do servidor
 */
router.post('/:id/promover', auth, CampanhaController.promoverNovamente);

/**
 * @swagger
 * /campanhas/{id}/confirmar-pagamento:
 *   post:
 *     summary: Confirmar pagamento e ativar campanha
 *     description: Confirma o pagamento e muda o status da campanha para Ativa
 *     tags: [Campanhas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da campanha
 *     responses:
 *       200:
 *         description: Pagamento confirmado e campanha ativada
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Campanha não encontrada ou já ativada
 *       500:
 *         description: Erro do servidor
 */
router.post('/:id/confirmar-pagamento', auth, CampanhaController.confirmarPagamento);

module.exports = router; 