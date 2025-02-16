const db = require('../config/database');

class EstatisticasController {
    static async obterEstatisticas(req, res) {
        try {
            const { dataInicio, dataFim } = req.query;
            const userId = req.user.id;

            // Query base para filtrar por data
            const dateFilter = dataInicio && dataFim 
                ? 'AND DATE(a.created_at) BETWEEN DATE(?) AND DATE(?)' 
                : '';

            // Query params
            const queryParams = dataInicio && dataFim 
                ? [userId, dataInicio, dataFim]
                : [userId];

            // Buscar estatísticas gerais
            const [stats] = await db.query(
                `SELECT 
                    COUNT(DISTINCT a.id) as total_anuncios,
                    COALESCE(SUM(a.visualizacoes), 0) as total_visualizacoes,
                    COALESCE(SUM(a.chamadas), 0) as total_chamadas,
                    COALESCE(SUM(a.mensagens_whatsapp), 0) as total_mensagens,
                    COALESCE(SUM(a.compartilhamentos), 0) as total_compartilhamentos,
                    COALESCE(ROUND(AVG(NULLIF(a.visualizacoes, 0)), 2), 0) as media_visualizacoes,
                    COALESCE(ROUND(AVG(NULLIF(a.chamadas, 0)), 2), 0) as media_chamadas
                FROM anuncios a`,
                queryParams
            );

            // Buscar visualizações por categoria
            const [categorias] = await db.query(
                `SELECT 
                    a.categoria,
                    COUNT(DISTINCT a.id) as total_anuncios,
                    COALESCE(SUM(a.visualizacoes), 0) as visualizacoes,
                    ROUND((COUNT(DISTINCT a.id) * 100.0 / (
                        SELECT COUNT(DISTINCT id) 
                        FROM anuncios 
                        WHERE usuario_id = ? ${dateFilter}
                    )), 1) as porcentagem
                FROM anuncios a
                GROUP BY a.categoria
                ORDER BY visualizacoes DESC`,
                [...queryParams, ...queryParams]
            );

            // Calcular crescimento em relação ao período anterior
            const calcularCrescimento = (valor, valorAnterior) => {
                if (!valorAnterior || valorAnterior === 0) return "0.0";
                return ((valor - valorAnterior) / valorAnterior * 100).toFixed(1);
            };

            // Se tiver filtro de data, calcula crescimento
            let crescimento = {
                anuncios: "0.0",
                visualizacoes: "0.0",
                chamadas: "0.0",
                mensagens: "0.0",
                compartilhamentos: "0.0"
            };

             
                const [statsAnteriores] = await db.query(
                    `SELECT 
                        COUNT(DISTINCT id) as total_anuncios,
                        COALESCE(SUM(visualizacoes), 0) as total_visualizacoes,
                        COALESCE(SUM(chamadas), 0) as total_chamadas,
                        COALESCE(SUM(mensagens_whatsapp), 0) as total_mensagens,
                        COALESCE(SUM(compartilhamentos), 0) as total_compartilhamentos
                    FROM anuncios`,
                );

                crescimento = {
                    anuncios: calcularCrescimento(stats[0].total_anuncios, statsAnteriores[0].total_anuncios),
                    visualizacoes: calcularCrescimento(stats[0].total_visualizacoes, statsAnteriores[0].total_visualizacoes),
                    chamadas: calcularCrescimento(stats[0].total_chamadas, statsAnteriores[0].total_chamadas),
                    mensagens: calcularCrescimento(stats[0].total_mensagens, statsAnteriores[0].total_mensagens),
                    compartilhamentos: calcularCrescimento(stats[0].total_compartilhamentos, statsAnteriores[0].total_compartilhamentos)
                };
            

            res.json({
                success: true,
                data: {
                    periodo: {
                        inicio: dataInicio || null,
                        fim: dataFim || null
                    },
                    resumo: {
                        total_anuncios: stats[0].total_anuncios || 0,
                        total_visualizacoes: stats[0].total_visualizacoes || 0,
                        total_chamadas: stats[0].total_chamadas || 0,
                        total_mensagens: stats[0].total_mensagens || 0,
                        total_compartilhamentos: stats[0].total_compartilhamentos || 0,
                        media_visualizacoes: stats[0].media_visualizacoes || 0,
                        media_chamadas: stats[0].media_chamadas || 0
                    },
                    crescimento,
                    categorias: categorias.map(cat => ({
                        nome: cat.categoria,
                        total_anuncios: cat.total_anuncios || 0,
                        visualizacoes: cat.visualizacoes || 0,
                        porcentagem: cat.porcentagem || 0
                    }))
                }
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

module.exports = EstatisticasController; 