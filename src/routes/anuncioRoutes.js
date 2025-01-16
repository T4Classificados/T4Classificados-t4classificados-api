const express = require('express');
const router = express.Router();
const AnuncioController = require('../controllers/anuncioController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * components:
 *   schemas:
 *     Anuncio:
 *       type: object
 *       required:
 *         - titulo
 *         - tipo_transacao
 *         - categoria
 *         - preco
 *         - provincia
 *         - municipio
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título do anúncio
 *         tipo_transacao:
 *           enum: [Vender, Alugar, Arrendar, Precisa-se]
 *           description: Tipo de transação (venda, aluguel, etc)
 *         categoria:
 *           type: string
 *           description: Categoria do anúncio
 *         preco:
 *           type: number
 *           description: Preço do item
 *         preco_negociavel:
 *           type: boolean
 *           description: Se o preço é negociável
 *         provincia:
 *           type: string
 *           description: Província onde está o item
 *         municipio:
 *           type: string
 *           description: Município onde está o item
 *         zona:
 *           type: string
 *           description: Zona/bairro onde está o item
 *         descricao:
 *           type: string
 *           description: Descrição detalhada do anúncio
 *         whatsapp:
 *           type: string
 *           description: Número de WhatsApp para contato
 *         mobilado:
 *           type: boolean
 *           description: Se o imóvel está mobilado (opcional)
 *         marca:
 *           type: string
 *           description: Marca do veículo (opcional)
 *         kilometragem:
 *           type: string
 *           description: Kilometragem do veículo (opcional)
 *         ano_de_fabrico:
 *           type: integer
 *           description: Ano de fabricação do veículo (opcional)
 *         imagem_principal:
 *           type: string
 *           description: URL da imagem principal do anúncio
 *         imagens:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Array de imagens do anúncio
 */

/**
 * @swagger
 * /anuncios:
 *   post:
 *     summary: Criar novo anúncio
 *     tags: [Anúncios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               tipo_transacao:
 *                 type: string
 *               categoria:
 *                 type: string
 *               preco:
 *                 type: number
 *               preco_negociavel:
 *                 type: boolean
 *               provincia:
 *                 type: string
 *               municipio:
 *                 type: string
 *               zona:
 *                 type: string
 *               descricao:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               imagem_principal:
 *                 type: string
 *                 format: binary
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               mobilado:
 *                 type: boolean
 *               marca:
 *                 type: string
 *               kilometragem:
 *                 type: string
 *               ano_de_fabrico:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Anúncio criado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro do servidor
 */
router.post('/anuncios', 
    auth, 
    upload.fields([
        { name: 'imagens', maxCount: 8 },
        { name: 'imagem_principal', maxCount: 1 }
    ]),
    AnuncioController.criar
);

/**
 * @swagger
 * /anuncios/{id}:
 *   get:
 *     summary: Obter um anúncio específico
 *     tags: [Anúncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do anúncio
 *     responses:
 *       200:
 *         description: Detalhes do anúncio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anuncio'
 *       404:
 *         description: Anúncio não encontrado
 */
router.get('/anuncios/:id', auth, AnuncioController.obterPorId);

/**
 * @swagger
 * /anuncios:
 *   get:
 *     summary: Listar todos os anúncios
 *     tags: [Anúncios]
 *     security:
 *       - bearerAuth: []
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
 *                     $ref: '#/components/schemas/Anuncio'
 */
router.get('/anuncios',auth, AnuncioController.listar);

/**
 * @swagger
 * /anuncios/{id}:
 *   put:
 *     summary: Atualizar um anúncio
 *     tags: [Anúncios]
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
 *               tipo_transacao:
 *                 type: string
 *               categoria:
 *                 type: string
 *               preco:
 *                 type: number
 *               preco_negociavel:
 *                 type: boolean
 *               provincia:
 *                 type: string
 *               municipio:
 *                 type: string
 *               zona:
 *                 type: string
 *               descricao:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               imagem_principal:
 *                 type: string
 *                 format: binary
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Anúncio atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Anúncio não encontrado
 */
router.put('/anuncios/:id', 
    auth, 
    upload.fields([
        { name: 'imagens', maxCount: 8 },
        { name: 'imagem_principal', maxCount: 1 }
    ]),
    AnuncioController.atualizar
);

/**
 * @swagger
 * /anuncios/{id}:
 *   delete:
 *     summary: Excluir um anúncio
 *     tags: [Anúncios]
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
 *         description: Anúncio excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Anúncio não encontrado
 */
router.delete('/anuncios/:id', 
    auth, 
    AnuncioController.excluir
);

/**
 * @swagger
 * /anuncios/{id}/interacao:
 *   post:
 *     summary: Registrar uma interação com o anúncio
 *     tags: [Anúncios]
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
 *               - tipo
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [visualizacao, chamada, mensagem, compartilhamento]
 *     responses:
 *       200:
 *         description: Interação registrada com sucesso
 *       400:
 *         description: Tipo de interação inválido
 */
// router.post('/:id/interacao', auth, AnuncioController.registrarInteracao);

/**
 * @swagger
 * /anuncios/{id}/status:
 *   patch:
 *     summary: Alterar status de um anúncio
 *     tags: [Anúncios]
 *     security:
 *       - bearerAuth: []
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Disponível, Vendido, Reservado, Indisponível]
 *                 description: Novo status do anúncio
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Status inválido
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem permissão para alterar este anúncio
 *       404:
 *         description: Anúncio não encontrado
 */
router.patch("/anuncios/:id/status", auth, AnuncioController.alterarStatus);

/**
 * @swagger
 * /anuncios/usuarios/{userId}/estatisticas:
 *   get:
 *     summary: Obter estatísticas dos anúncios de um usuário
 *     description: Retorna estatísticas detalhadas dos anúncios de um usuário específico
 *     tags: [Anúncios]
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
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     resumo:
 *                       type: object
 *                       properties:
 *                         total_anuncios:
 *                           type: integer
 *                         total_visualizacoes:
 *                           type: integer
 *                         total_chamadas:
 *                           type: integer
 *                         total_mensagens:
 *                           type: integer
 *                         total_compartilhamentos:
 *                           type: integer
 *                         total_vendidos:
 *                           type: integer
 *                         total_disponiveis:
 *                           type: integer
 *                         total_reservados:
 *                           type: integer
 *                     categorias:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoria:
 *                             type: string
 *                           total_anuncios:
 *                             type: integer
 *                           visualizacoes:
 *                             type: integer
 *                           chamadas:
 *                             type: integer
 *                           mensagens:
 *                             type: integer
 *                           compartilhamentos:
 *                             type: integer
 *                     evolucao_mensal:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mes:
 *                             type: string
 *                             format: YYYY-MM
 *                           total_anuncios:
 *                             type: integer
 *                           visualizacoes:
 *                             type: integer
 *                           chamadas:
 *                             type: integer
 *                           mensagens:
 *                             type: integer
 *                           compartilhamentos:
 *                             type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem permissão para acessar estatísticas de outro usuário
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro do servidor
 */
router.get(
  "/anuncios/usuarios/:userId/estatisticas",
  auth,
  AnuncioController.obterEstatisticasUsuario
);

/**
 * @swagger
 * /anuncios/mais-visualizados:
 *   get:
 *     summary: Listar os 5 anúncios mais visualizados
 *     description: Retorna os anúncios com maior número de visualizações
 *     tags: [Anúncios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dos anúncios mais visualizados
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
 *                     $ref: '#/components/schemas/Anuncio'
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro do servidor
 */
router.get('/mais-visualizados', auth, AnuncioController.listarMaisVisualizados);

module.exports = router; 