const db = require('../config/database');

exports.getEstatisticasGerais = async () => {
    try {
        const [rows] = await db.query(`
            SELECT 
                DATE_FORMAT(data, '%Y-%m') as mes,
                COUNT(DISTINCT anuncio_id) as total_anuncios,
                IFNULL(SUM(visualizacoes), 0) as total_visualizacoes,
                IFNULL(SUM(chamadas), 0) as total_chamadas,
                IFNULL(SUM(mensagens_whatsapp), 0) as total_mensagens,
                IFNULL(SUM(compartilhamentos), 0) as total_compartilhamentos,
                IFNULL(SUM(visualizacoes + chamadas + mensagens_whatsapp + compartilhamentos), 0) as total_geral
            FROM anuncios_estatisticas
            GROUP BY mes
            ORDER BY mes DESC
        `);

        return rows;
    } catch (error) {
        throw error;
    }
};

exports.getEstatisticasPorPeriodo = async (dataInicio, dataFim) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                DATE_FORMAT(data, '%Y-%m-%d') as data,
                COUNT(DISTINCT anuncio_id) as total_anuncios,
                IFNULL(SUM(visualizacoes), 0) as total_visualizacoes,
                IFNULL(SUM(chamadas), 0) as total_chamadas,
                IFNULL(SUM(mensagens_whatsapp), 0) as total_mensagens,
                IFNULL(SUM(compartilhamentos), 0) as total_compartilhamentos,
                IFNULL(SUM(visualizacoes + chamadas + mensagens_whatsapp + compartilhamentos), 0) as total_geral
            FROM anuncios_estatisticas
            WHERE data BETWEEN ? AND ?
            GROUP BY data
            ORDER BY data DESC`,
            [dataInicio, dataFim]
        );

        return rows;
    } catch (error) {
        throw error;
    }
}; 