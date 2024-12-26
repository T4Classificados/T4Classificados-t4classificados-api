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
            const { page = 1, limit = 10, ...filtros } = req.query;
            const anuncios = await AnuncioModel.listar(page, limit, filtros);
            
            res.json({
                success: true,
                data: anuncios
            });
        } catch (error) {
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
            const anuncio = await AnuncioModel.obterPorId(id);
            
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
            const excluido = await AnuncioModel.excluir(id, req.user.id);
            
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
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir anúncio',
                error: error.message
            });
        }
    }
}

module.exports = AnuncioController; 