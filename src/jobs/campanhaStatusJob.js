const cron = require('node-cron');
const db = require('../config/database');

// Função que verifica e atualiza o status das campanhas
async function verificarStatusCampanhas() {
    try {
        // Busca campanhas ativas que atingiram o limite de visualizações
        const [campanhas] = await db.query(`
            UPDATE campanhas 
            SET 
                status = 'Concluída',
                updated_at = CURRENT_TIMESTAMP
            WHERE 
                status = 'Ativa' 
                AND views >= num_visualizacoes
        `);

        if (campanhas.affectedRows > 0) {
            console.log(`${campanhas.affectedRows} campanhas foram marcadas como concluídas`);
        }

    } catch (error) {
        console.error('Erro ao verificar status das campanhas:', error);
    }
}

// Executa a cada 5 minutos
const job = cron.schedule('*/1 * * * *', verificarStatusCampanhas);

// Exporta o job para poder ser iniciado no app.js
module.exports = job; 