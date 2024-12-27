const AnuncioModel = require('../models/anuncioModel');
const { uploadImagens } = require('../utils/upload');

class AnuncioController {
    static async criar(req, res) {
        try {
            const imagens = req.files ? await uploadImagens(req.files) : [];
            
            const anuncio = {
                ...req.body,
                imagens,
                usuario_id: req.user.id,
                preco_negociavel: req.body.preco_negociavel === 'true'
            };

            const anuncioId = await AnuncioModel.criar(anuncio);
            
            res.status(201).json({
                success: true,
                message: 'Anúncio criado com sucesso',
                data: { id: anuncioId }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao criar anúncio',
                error: error.message
            });
        }
    }

    static async listar(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            let anuncios;

            // Se for admin, lista todos os anúncios
            if (req.userData && req.userData.role === 'admin') {
                anuncios = await AnuncioModel.listarTodos(page, limit);
            } else {
                // Se não for admin, lista apenas anúncios públicos
                anuncios = await AnuncioModel.listarPorUsuario(req.userData.userId, page, limit);
            }

            res.json({
                success: true,
                data: anuncios
            });
        } catch (error) {
            console.error('Erro ao listar anúncios:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao listar anúncios',
                error: error.message
            });
        }
    }

    static async obterPorId(req, res) {
        try {
            const { id } = req.params;
            const anuncio = await AnuncioModel.obterPorId(id, req.userData.userId);
            
            if (!anuncio) {
                return res.status(404).json({
                    success: false,
                    message: 'Anúncio não encontrado'
                });
            }

            res.json({
                success: true,
                data: anuncio
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao obter anúncio',
                error: error.message
            });
        }
    }

    static async atualizar(req, res) {
        try {
            const { id } = req.params;
            const imagens = req.files ? await uploadImagens(req.files) : [];
            
            const anuncio = {
                ...req.body,
                imagens,
                usuario_id: req.user.id,
                preco_negociavel: req.body.preco_negociavel === 'true'
            };

            const atualizado = await AnuncioModel.atualizar(id, anuncio);
            
            if (!atualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Anúncio não encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Anúncio atualizado com sucesso'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar anúncio',
                error: error.message
            });
        }
    }

    static async excluir(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar se o usuário está autenticado
            if (!req.userData) {
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado'
                });
            }

            let excluido;
           
            // Se for admin, pode excluir qualquer anúncio
            if (req.userData.role === 'admin') {
                excluido = await AnuncioModel.excluirAdmin(id);
            } else {
                // Se não for admin, só pode excluir seus próprios anúncios
                excluido = await AnuncioModel.excluir(id, req.userData.userId);
            }
            
            if (!excluido) {
                return res.status(404).json({
                    success: false,
                    message: 'Anúncio não encontrado ou sem permissão para excluir'
                });
            }

            res.json({
                success: true,
                message: 'Anúncio excluído com sucesso'
            });
        } catch (error) {
            console.error('Erro ao excluir anúncio:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir anúncio',
                error: error.message
            });
        }
    }

    static async registrarInteracao(req, res) {
        try {
            const { id } = req.params;
            const { tipo } = req.body;

            // Verificar se o tipo é válido usando o enum
            if (!Object.values(AnuncioModel.TipoInteracao).includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de interação inválido. Tipos válidos: visualizacao, chamada, mensagem, compartilhamento'
                });
            }

            const sucesso = await AnuncioModel.incrementarInteracao(id, tipo);

            if (!sucesso) {
                return res.status(404).json({
                    success: false,
                    message: 'Anúncio não encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Interação registrada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao registrar interação:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao registrar interação',
                error: error.message
            });
        }
    }
}

module.exports = AnuncioController; 