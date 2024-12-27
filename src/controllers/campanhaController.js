const CampanhaModel = require('../models/campanhaModel');
const { uploadImagens } = require('../utils/upload');

class CampanhaController {
    static async criar(req, res) {
        try {
            // Processa as imagens se existirem
            let imagens = undefined;
            let logo = undefined;

            try {
                if (req.files?.imagens) {
                    imagens = await uploadImagens(req.files.imagens);
                }
                if (req.files?.logo) {
                    logo = await uploadImagens([req.files.logo[0]]);
                }
            } catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: 'Erro ao processar imagens',
                    error: uploadError.message
                });
            }

            // Prepara os dados da campanha
            const campanha = {
                tipo_exibicao: req.body.tipo_exibicao,
                espaco: req.body.espaco,
                descricao: req.body.descricao,
                logo_url: logo ? logo[0] : undefined,
                botao_texto: req.body.botao_texto,
                num_visualizacoes: parseInt(req.body.num_visualizacoes),
                valor_visualizacao: parseFloat(req.body.valor_visualizacao),
                total_pagar: parseFloat(req.body.total_pagar),
                imagens: imagens
            };

            // Tenta criar a campanha
            try {
                const campanhaId = await CampanhaModel.criar(req.user.id, campanha);
                const campanhaCreated = await CampanhaModel.obterPorId(campanhaId, req.user.id);

                res.status(201).json({
                    success: true,
                    message: 'Campanha criada com sucesso',
                    data: campanhaCreated
                });
            } catch (error) {
                if (error.message === 'Usuário não possui empresa vinculada') {
                    return res.status(400).json({
                        success: false,
                        message: 'É necessário vincular uma empresa antes de criar uma campanha'
                    });
                }
                throw error;
            }

        } catch (error) {
            console.error('Erro ao criar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar campanha',
                error: error.message
            });
        }
    }

    static async listar(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const campanhas = await CampanhaModel.listar(req.user.id, page, limit);
            
            res.json({
                success: true,
                data: campanhas
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao listar campanhas',
                error: error.message
            });
        }
    }

    static async obterPorId(req, res) {
        try {
            const { id } = req.params;
            const campanha = await CampanhaModel.obterPorId(id, req.user.id);
            
            if (!campanha) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            res.json({
                success: true,
                data: campanha
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao obter campanha',
                error: error.message
            });
        }
    }

    static async atualizar(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Processa as imagens se existirem
            let imagens = undefined;
            let logo = undefined;

            try {
                if (req.files?.imagens) {
                    imagens = await uploadImagens(req.files.imagens);
                }
                if (req.files?.logo) {
                    logo = await uploadImagens([req.files.logo[0]]);
                }
            } catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: 'Erro ao processar imagens',
                    error: uploadError.message
                });
            }

            // Prepara os dados para atualização
            const dadosAtualizacao = {
                tipo_exibicao: req.body.tipo_exibicao,
                espaco: req.body.espaco,
                descricao: req.body.descricao,
                botao_texto: req.body.botao_texto,
                num_visualizacoes: req.body.num_visualizacoes ? parseInt(req.body.num_visualizacoes) : undefined,
                valor_visualizacao: req.body.valor_visualizacao ? parseFloat(req.body.valor_visualizacao) : undefined,
                total_pagar: req.body.total_pagar ? parseFloat(req.body.total_pagar) : undefined,
                imagens: imagens,
                logo_url: logo ? logo[0] : undefined
            };

            // Remove campos undefined
            Object.keys(dadosAtualizacao).forEach(key => 
                dadosAtualizacao[key] === undefined && delete dadosAtualizacao[key]
            );

            // Atualiza a campanha
            const campanhaAtualizada = await CampanhaModel.atualizar(id, req.user.id, dadosAtualizacao);

            if (!campanhaAtualizada) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Campanha atualizada com sucesso',
                data: campanhaAtualizada
            });

        } catch (error) {
            console.error('Erro ao atualizar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar campanha',
                error: error.message
            });
        }
    }

    static async excluir(req, res) {
        try {
            const { id } = req.params;
            
            // Busca a campanha antes de excluir para retornar seus dados
            const campanha = await CampanhaModel.obterPorId(id, req.user.id);
            if (!campanha) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            // Tenta excluir
            const excluido = await CampanhaModel.excluir(id, req.user.id);
            if (!excluido) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Campanha excluída com sucesso',
                data: campanha
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir campanha',
                error: error.message
            });
        }
    }

    static async promoverNovamente(req, res) {
        try {
            const { id } = req.params;
            
            // Primeiro busca a campanha
            const campanhaExistente = await CampanhaModel.obterPorId(id, req.user.id);
            if (!campanhaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            // Cria uma nova campanha baseada na existente
            const novaCampanha = {
                tipo_exibicao: campanhaExistente.tipo_exibicao,
                espaco: campanhaExistente.espaco,
                descricao: campanhaExistente.descricao,
                logo_url: campanhaExistente.logo_url?.replace(`${process.env.BASE_URL || 'http://localhost:4000'}`, ''),
                botao_texto: campanhaExistente.botao_texto,
                num_visualizacoes: campanhaExistente.num_visualizacoes,
                valor_visualizacao: campanhaExistente.valor_visualizacao,
                total_pagar: campanhaExistente.total_pagar,
                imagens: campanhaExistente.imagens?.map(img => 
                    img.replace(`${process.env.BASE_URL || 'http://localhost:4000'}`, '')
                )
            };

            // Cria a nova campanha
            const novaCampanhaId = await CampanhaModel.criar(req.user.id, novaCampanha);
            const campanhaPromovida = await CampanhaModel.obterPorId(novaCampanhaId, req.user.id);

            res.status(201).json({
                success: true,
                message: 'Campanha promovida novamente com sucesso',
                data: campanhaPromovida
            });
        } catch (error) {
            console.error('Erro ao promover campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao promover campanha',
                error: error.message
            });
        }
    }
}

module.exports = CampanhaController; 