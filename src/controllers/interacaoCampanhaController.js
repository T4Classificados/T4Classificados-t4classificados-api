const db = require('../config/database');
const CampanhaModel = require('../models/campanhaModel');

class InteracaoCampanhaController {
    static async registrarVisualizacao(req, res) {
        try {
            const { campanhaId } = req.params;
            const { ip, userAgent } = req.body;

            // Verifica se a campanha existe e está ativa
            const [campanha] = await db.query(
                'SELECT * FROM campanhas WHERE id = ? AND status = "Ativa"',
                [campanhaId]
            );

            if (!campanha[0]) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada ou não está ativa'
                });
            }

            // Registra a visualização
            await db.query(
                `INSERT INTO campanha_visualizacoes 
                (campanha_id, ip_address, user_agent, data_visualizacao)
                VALUES (?, ?, ?, NOW())`,
                [campanhaId, ip, userAgent]
            );

            // Atualiza contador de visualizações da campanha
            await db.query(
                'UPDATE campanhas SET visualizacoes_atuais = visualizacoes_atuais + 1 WHERE id = ?',
                [campanhaId]
            );

            res.json({
                success: true,
                message: 'Visualização registrada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao registrar visualização:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao registrar visualização',
                error: error.message
            });
        }
    }

    static async registrarClique(req, res) {
        try {
            const { campanhaId } = req.params;
            const { ip, userAgent } = req.body;

            // Verifica se a campanha existe e está ativa
            const [campanha] = await db.query(
                'SELECT * FROM campanhas WHERE id = ? AND status = "Ativa"',
                [campanhaId]
            );

            if (!campanha[0]) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada ou não está ativa'
                });
            }

            // Registra o clique
            await db.query(
                `INSERT INTO campanha_cliques 
                (campanha_id, ip_address, user_agent, data_clique)
                VALUES (?, ?, ?, NOW())`,
                [campanhaId, ip, userAgent]
            );

            // Atualiza contador de cliques da campanha
            await db.query(
                'UPDATE campanhas SET cliques_totais = cliques_totais + 1 WHERE id = ?',
                [campanhaId]
            );

            res.json({
                success: true,
                message: 'Clique registrado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao registrar clique:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao registrar clique',
                error: error.message
            });
        }
    }

    static async obterEstatisticas(req, res) {
        try {
            const { campanhaId } = req.params;
            const { userId } = req.userData;

            // Verifica se o usuário tem acesso à campanha
            const campanha = await CampanhaModel.obterPorId(campanhaId, userId);
            if (!campanha) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            // Busca estatísticas
            const [estatisticas] = await db.query(
                `SELECT 
                    c.id,
                    c.visualizacoes_atuais,
                    c.cliques_totais,
                    COUNT(DISTINCT cv.ip_address) as visitantes_unicos,
                    COUNT(DISTINCT cc.ip_address) as cliques_unicos,
                    (SELECT COUNT(*) FROM campanha_visualizacoes 
                     WHERE campanha_id = c.id 
                     AND data_visualizacao >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as visualizacoes_24h,
                    (SELECT COUNT(*) FROM campanha_cliques 
                     WHERE campanha_id = c.id 
                     AND data_clique >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as cliques_24h
                FROM campanhas c
                LEFT JOIN campanha_visualizacoes cv ON c.id = cv.campanha_id
                LEFT JOIN                                                                                                                                                                                                                                                                                                                         cc ON c.id = cc.campanha_id
                WHERE c.id = ?
                GROUP BY c.id`,
                [campanhaId]
            );

            res.json({
                success: true,
                data: estatisticas[0]
            });
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter estatísticas',
                error: error.message
            });
        }
    }
}

module.exports = InteracaoCampanhaController; 