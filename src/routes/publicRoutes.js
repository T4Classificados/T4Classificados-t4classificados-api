const express = require('express');
const router = express.Router();
const AnuncioController = require('../controllers/anuncioController');
const CampanhaController = require('../controllers/campanhaController');
const UserController = require('../controllers/userController');
const PagamentoModel = require('../models/pagamentoModel');
const userModel = require('../models/userModel');


/**
 * @swagger
 * components:
 *   schemas:
 *     Pagamento:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do pagamento
 *         tipo:
 *           type: string
 *           enum: [campanha, ativacao]
 *           description: Tipo do pagamento
 *         referencia_id:
 *           type: string
 *           description: ID de referência do pagamento
 *         transaction_id:
 *           type: string
 *           description: ID da transação
 *         amount:
 *           type: number
 *           format: float
 *           description: Valor do pagamento
 *         status:
 *           type: string
 *           enum: [pendente, pago, falhou, reembolsado]
 *           description: Status do pagamento
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         produto:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: ID do produto (campanha)
 *             nome:
 *               type: string
 *               description: Nome do produto
 *         usuario:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: ID do usuário
 *             nome:
 *               type: string
 *               description: Nome do usuário
 *             telefone:
 *               type: string
 *               description: Telefone do usuário
 */

/**
 * @swagger
 * /public/anuncios:
 *   get:
 *     summary: Lista todos os anúncios públicos
 *     tags: [Anúncios]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: provincia
 *         schema:
 *           type: string
 *         description: Filtrar por província
 *     responses:
 *       200:
 *         description: Lista de anúncios
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 */
router.get('/anuncios', AnuncioController.listarPublicos);
router.get('/test-api', (req, resp)=>{
    resp.send({
        texto: "Testando mudanças"
    })
});

//----------------------------------------------------------------------------------------------------------------
/**
 * @swagger
 * /public/anuncios:
 *   get:
 *     summary: Lista todos os anúncios públicos
 *     tags: [Anúncios]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: provincia
 *         schema:
 *           type: string
 *         description: Filtrar por província
 *     responses:
 *       200:
 *         description: Lista de anúncios
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 */
router.get('/campanha', CampanhaController.listarPublicos);

/**
 * @swagger
 * /public/anuncios/{id}:
 *   get:
 *     summary: Obter um anúncio específico
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes do anúncio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     tipo_transacao:
 *                       type: string
 *                     categoria:
 *                       type: string
 *                     preco:
 *                       type: number
 *                     preco_negociavel:
 *                       type: boolean
 *                     provincia:
 *                       type: string
 *                     municipio:
 *                       type: string
 *                     zona:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     whatsapp:
 *                       type: string
 *                     status:
 *                       type: string
 *                     imagem_principal:
 *                       type: string
 *                       format: uri
 *                     imagens:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     usuario:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         sobrenome:
 *                           type: string
 *                         telefone:
 *                           type: string
 *                         provincia:
 *                           type: string
 *                         municipio:
 *                           type: string
 *                         genero:
 *                           type: string
 *                           enum: [masculino, feminino, outro]
 *                         foto_url:
 *                           type: string
 *                           format: uri
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Anúncio não encontrado
 */
router.get('/anuncios/:id', AnuncioController.obterPorId);

/**
 * @swagger
 * /public/anuncios/{id}/similares:
 *   get:
 *     summary: Buscar anúncios similares
 *     description: Retorna anúncios similares baseado na categoria e tipo de transação
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio de referência
 *     responses:
 *       200:
 *         description: Lista de anúncios similares
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       preco:
 *                         type: number
 *                       provincia:
 *                         type: string
 *                       municipio:
 *                         type: string
 *                       tipo_transacao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 *       404:
 *         description: Anúncio de referência não encontrado
 *       500:
 *         description: Erro do servidor
 */
router.get('/anuncios/:id/similares', AnuncioController.buscarSimilares);

/**
 * @swagger
 * /public/anuncios/{id}/usuario-similares:
 *   get:
 *     summary: Buscar anúncios similares do mesmo usuário
 *     description: Retorna outros anúncios do mesmo usuário, priorizando mesma categoria e tipo de transação
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio de referência
 *     responses:
 *       200:
 *         description: Lista de anúncios similares do usuário
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       preco:
 *                         type: number
 *                       provincia:
 *                         type: string
 *                       municipio:
 *                         type: string
 *                       tipo_transacao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 *       404:
 *         description: Anúncio de referência não encontrado
 *       500:
 *         description: Erro do servidor
 */
router.get('/anuncios/:id/usuario-similares', AnuncioController.buscarSimilaresDoUsuario);

/**
 * @swagger
 * /public/anuncios/{id}/interacao:
 *   post:
 *     summary: Registrar uma interação com o anúncio
 *     description: Registra visualizações, chamadas, mensagens ou compartilhamentos
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [visualizacao, chamada, mensagem, compartilhamento]
 *                 description: Tipo de interação com o anúncio
 *     responses:
 *       200:
 *         description: Interação registrada com sucesso
 *       400:
 *         description: Tipo de interação inválido
 *       404:
 *         description: Anúncio não encontrado
 */
router.post('/anuncios/:id/interacao', AnuncioController.registrarInteracao);

/**
 * @swagger
 * /public/usuarios/{userId}/anuncios/recentes:
 *   get:
 *     summary: Buscar anúncios recentes de um usuário específico
 *     description: Retorna os anúncios mais recentes de um usuário, ordenados por data de criação
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista de anúncios recentes do usuário
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                       preco:
 *                         type: number
 *                       provincia:
 *                         type: string
 *                       municipio:
 *                         type: string
 *                       tipo_transacao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       status:
 *                         type: string
 *                       visualizacoes:
 *                         type: integer
 *                       chamadas:
 *                         type: integer
 *                       mensagens_whatsapp:
 *                         type: integer
 *                       compartilhamentos:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       imagem_principal:
 *                         type: string
 *                         format: uri
 *                       imagens:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uri
 *                       usuario:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           sobrenome:
 *                             type: string
 *                           foto_url:
 *                             type: string
 *                             format: uri
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro do servidor
 */
router.get('/usuarios/:userId/anuncios/recentes', AnuncioController.buscarRecentesDoUsuario);

/**
 * @swagger
 * /public/campanhas/pagamento/callback:
 *   post:
 *     summary: Webhook para receber confirmação de pagamento
 *     description: Endpoint público para receber callbacks de confirmação de pagamento
 *     tags: [Campanhas]
 *     security: [] # Remove a necessidade de autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference_id
 *               - status
 *             properties:
 *               reference_id:
 *                 type: string
 *                 description: ID da campanha
 *               status:
 *                 type: string
 *                 enum: [paid, failed]
 *                 description: Status do pagamento
 *               transaction_id:
 *                 type: string
 *                 description: ID da transação no gateway de pagamento
 *     responses:
 *       200:
 *         description: Callback processado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Campanha não encontrada
 *       500:
 *         description: Erro do servidor
 */
router.post('/campanhas/pagamento/callback', CampanhaController.processarCallbackPagamento);

/**
 * @swagger
 * /public/usuarios/pagamento/callback:
 *   post:
 *     summary: Webhook para receber confirmação de pagamento de ativação de conta
 *     description: Endpoint público para receber callbacks de confirmação de pagamento de ativação
 *     tags: [Usuários]
 *     security: [] # Remove a necessidade de autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference_id
 *               - transaction_id
 *               - amount
 *             properties:
 *               reference_id:
 *                 type: string
 *                 description: ID do usuário
 *               transaction_id:
 *                 type: string
 *                 description: ID da transação
 *               amount:
 *                 type: number
 *                 description: Valor do pagamento
 *     responses:
 *       200:
 *         description: Callback processado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro do servidor
 */
router.post('/usuarios/pagamento/callback', UserController.processarCallbackPagamento);

/**
 * @swagger
 * /public/campanhas/{campanhaId}/visualizacao:
 *   post:
 *     summary: Registra uma visualização da campanha
 *     tags: [Campanhas]
 *     security: [] # Remove a necessidade de autenticação
 *     parameters:
 *       - in: path
 *         name: campanhaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da campanha
 *     responses:
 *       200:
 *         description: Visualização registrada com sucesso
 *       404:
 *         description: Campanha não encontrada
 *       500:
 *         description: Erro do servidor
 */
router.post('/campanhas/:campanhaId/visualizacao', CampanhaController.registrarVisualizacao);

/**
 * @swagger
 * /public/campanhas/{campanhaId}/chamada:
 *   post:
 *     summary: Registra uma chamada da campanha
 *     tags: [Campanhas]
 *     security: [] # Remove a necessidade de autenticação
 *     parameters:
 *       - in: path
 *         name: campanhaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da campanha
 *     responses:
 *       200:
 *         description: Chamada registrada com sucesso
 *       404:
 *         description: Campanha não encontrada
 *       500:
 *         description: Erro do servidor
 */
router.post('/campanhas/:campanhaId/chamada', CampanhaController.registrarChamada);

/**
 * @swagger
 * /public/campanhas/{campanhaId}/clique:
 *   post:
 *     summary: Registra um clique na campanha
 *     tags: [Campanhas]
 *     security: [] # Remove a necessidade de autenticação
 *     parameters:
 *       - in: path
 *         name: campanhaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da campanha
 *     responses:
 *       200:
 *         description: Clique registrado com sucesso
 *       404:
 *         description: Campanha não encontrada
 *       500:
 *         description: Erro do servidor
 */
router.post('/campanhas/:campanhaId/clique', CampanhaController.registrarClique);

/**
 * @swagger
 * /public/pagamentos/{userId}:
 *   get:
 *     summary: Retorna os pagamentos de um usuário
 *     description: Lista todos os pagamentos associados a um usuário específico, incluindo detalhes do produto e usuário
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista de pagamentos do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pagamento'
 *       404:
 *         description: Usuário não encontrado
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
 *                   example: Usuário não encontrado
 *       500:
 *         description: Erro do servidor
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
 *                   example: Erro ao listar pagamentos
 *                 error:
 *                   type: string
 */
router.get('/pagamentos/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Verifica se o usuário existe
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Busca os pagamentos
        const pagamentos = await PagamentoModel.listarPorUsuario(userId);

        res.json({
            success: true,
            data: pagamentos.map(p => ({
                id: p.id,
                tipo: p.tipo,
                referencia_id: p.referencia_id,
                transaction_id: p.transaction_id,
                amount: p.amount,
                status: p.status,
                created_at: p.created_at,
                produto: p.produto,
                usuario: p.usuario
            }))
        });
    } catch (error) {
        console.error('Erro ao listar pagamentos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pagamentos',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /public/pagamentos:
 *   get:
 *     summary: Retorna todos os pagamentos
 *     description: Lista todos os pagamentos, incluindo detalhes do produto e usuário
 *     tags: [Pagamentos]
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pagamento'
 *       500:
 *         description: Erro do servidor
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
 *                   example: Erro ao listar pagamentos
 *                 error:
 *                   type: string
 */
router.get('/pagamentos', async (req, res) => {
    try {
        const pagamentos = await PagamentoModel.listarTodos();

        res.json({
            success: true,
            data: pagamentos
        });
    } catch (error) {
        console.error('Erro ao listar pagamentos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pagamentos',
            error: error.message
        });
    }
});

module.exports = router; 