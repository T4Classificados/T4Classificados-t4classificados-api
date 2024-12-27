const db = require('../config/database');

class CampanhaModel {
    static async criar(campanha) {
        try {
            const [result] = await db.query(
                `INSERT INTO campanhas (
                    usuario_id, tipo_exibicao, espaco, descricao,
                    logo_url, botao_texto, num_visualizacoes,
                    valor_visualizacao, total_pagar, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    campanha.usuario_id,
                    campanha.tipo_exibicao,
                    campanha.espaco,
                    campanha.descricao,
                    campanha.logo_url,
                    campanha.botao_texto,
                    campanha.num_visualizacoes,
                    campanha.valor_visualizacao,
                    campanha.total_pagar,
                    'pendente'
                ]
            );

            if (campanha.imagens && campanha.imagens.length > 0) {
                for (const imagem of campanha.imagens) {
                    await db.query(
                        'INSERT INTO campanha_imagens (campanha_id, url_imagem) VALUES (?, ?)',
                        [result.insertId, imagem]
                    );
                }
            }

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async listar(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const [rows] = await db.query(
                `SELECT c.*, GROUP_CONCAT(ci.url_imagem) as imagens
                FROM campanhas c
                LEFT JOIN campanha_imagens ci ON c.id = ci.campanha_id
                WHERE c.usuario_id = ?
                GROUP BY c.id
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(row => ({
                ...row,
                logo_url: row.logo_url ? `${baseUrl}${row.logo_url}` : null,
                imagens: row.imagens 
                    ? row.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            }));
        } catch (error) {
            throw error;
        }
    }

    static async obterPorId(id, userId) {
        try {
            const [rows] = await db.query(
                `SELECT c.*, GROUP_CONCAT(ci.url_imagem) as imagens
                FROM campanhas c
                LEFT JOIN campanha_imagens ci ON c.id = ci.campanha_id
                WHERE c.id = ? AND c.usuario_id = ?
                GROUP BY c.id`,
                [id, userId]
            );

            if (rows.length === 0) return null;

            const campanha = rows[0];
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            
            return {
                ...campanha,
                logo_url: campanha.logo_url ? `${baseUrl}${campanha.logo_url}` : null,
                imagens: campanha.imagens 
                    ? campanha.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            };
        } catch (error) {
            throw error;
        }
    }

    static async atualizar(id, userId, campanha) {
        try {
            // Primeiro verifica se a campanha existe
            const [existente] = await db.query(
                'SELECT * FROM campanhas WHERE id = ? AND usuario_id = ?',
                [id, userId]
            );

            if (existente.length === 0) {
                return null;
            }

            // Atualiza os dados básicos
            const [result] = await db.query(
                `UPDATE campanhas SET
                    tipo_exibicao = ?,
                    espaco = ?,
                    descricao = ?,
                    logo_url = ?,
                    botao_texto = ?,
                    num_visualizacoes = ?,
                    valor_visualizacao = ?,
                    total_pagar = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND usuario_id = ?`,
                [
                    campanha.tipo_exibicao || existente[0].tipo_exibicao,
                    campanha.espaco || existente[0].espaco,
                    campanha.descricao || existente[0].descricao,
                    campanha.logo_url || existente[0].logo_url,
                    campanha.botao_texto || existente[0].botao_texto,
                    campanha.num_visualizacoes || existente[0].num_visualizacoes,
                    campanha.valor_visualizacao || existente[0].valor_visualizacao,
                    campanha.total_pagar || existente[0].total_pagar,
                    id,
                    userId
                ]
            );

            // Se houver novas imagens, atualiza
            if (campanha.imagens) {
                await db.query('DELETE FROM campanha_imagens WHERE campanha_id = ?', [id]);
                
                for (const imagem of campanha.imagens) {
                    await db.query(
                        'INSERT INTO campanha_imagens (campanha_id, url_imagem) VALUES (?, ?)',
                        [id, imagem]
                    );
                }
            }

            // Retorna os dados atualizados
            const [campanhaAtualizada] = await db.query(
                `SELECT c.*, GROUP_CONCAT(ci.url_imagem) as imagens
                FROM campanhas c
                LEFT JOIN campanha_imagens ci ON c.id = ci.campanha_id
                WHERE c.id = ? AND c.usuario_id = ?
                GROUP BY c.id`,
                [id, userId]
            );

            if (campanhaAtualizada.length === 0) {
                return null;
            }

            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return {
                ...campanhaAtualizada[0],
                logo_url: campanhaAtualizada[0].logo_url ? `${baseUrl}${campanhaAtualizada[0].logo_url}` : null,
                imagens: campanhaAtualizada[0].imagens 
                    ? campanhaAtualizada[0].imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            };
        } catch (error) {
            throw error;
        }
    }

    static async excluir(id, userId) {
        try {
            // Primeiro verifica se existe e obtém os dados
            const [campanha] = await db.query(
                'SELECT * FROM campanhas WHERE id = ? AND usuario_id = ?',
                [id, userId]
            );

            if (campanha.length === 0) {
                return false;
            }

            // Exclui as imagens
            await db.query('DELETE FROM campanha_imagens WHERE campanha_id = ?', [id]);

            // Exclui a campanha
            await db.query(
                'DELETE FROM campanhas WHERE id = ? AND usuario_id = ?',
                [id, userId]
            );

            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CampanhaModel; 