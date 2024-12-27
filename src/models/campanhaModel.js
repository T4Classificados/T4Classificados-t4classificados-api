const db = require('../config/database');

class CampanhaModel {
    static async criar(userId, campanha) {
        try {
            // Primeiro verifica se o usuário tem empresa vinculada
            const [usuario] = await db.query(
                'SELECT empresa_id FROM usuarios WHERE id = ?',
                [userId]
            );

            if (!usuario[0] || !usuario[0].empresa_id) {
                throw new Error('Usuário não possui empresa vinculada');
            }

            const empresaId = usuario[0].empresa_id;

            // Insere a campanha vinculada à empresa
            const [result] = await db.query(
                `INSERT INTO campanhas (
                    empresa_id,
                    usuario_id,
                    tipo_exibicao,
                    espaco,
                    descricao,
                    logo_url,
                    botao_texto,
                    num_visualizacoes,
                    valor_visualizacao,
                    total_pagar
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    userId,
                    campanha.tipo_exibicao,
                    campanha.espaco,
                    campanha.descricao,
                    campanha.logo_url,
                    campanha.botao_texto,
                    campanha.num_visualizacoes,
                    campanha.valor_visualizacao,
                    campanha.total_pagar
                ]
            );

            const campanhaId = result.insertId;

            // Insere as imagens se houver
            if (campanha.imagens && campanha.imagens.length > 0) {
                for (const imagem of campanha.imagens) {
                    await db.query(
                        'INSERT INTO campanha_imagens (campanha_id, url_imagem) VALUES (?, ?)',
                        [campanhaId, imagem]
                    );
                }
            }

            return campanhaId;
        } catch (error) {
            throw error;
        }
    }

    static async listar(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const [rows] = await db.query(
                `SELECT c.*, 
                    GROUP_CONCAT(ci.url_imagem) as imagens,
                    e.nome as empresa_nome,
                    e.nif as empresa_nif,
                    e.logo_url as empresa_logo
                FROM campanhas c
                LEFT JOIN campanha_imagens ci ON c.id = ci.campanha_id
                LEFT JOIN empresas e ON c.empresa_id = e.id
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
                    : [],
                empresa: {
                    id: row.empresa_id,
                    nome: row.empresa_nome,
                    nif: row.empresa_nif,
                    logo_url: row.empresa_logo ? `${baseUrl}${row.empresa_logo}` : null
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    static async obterPorId(id, userId) {
        try {
            const [rows] = await db.query(
                `SELECT c.*, 
                    GROUP_CONCAT(ci.url_imagem) as imagens,
                    e.nome as empresa_nome,
                    e.nif as empresa_nif,
                    e.logo_url as empresa_logo
                FROM campanhas c
                LEFT JOIN campanha_imagens ci ON c.id = ci.campanha_id
                LEFT JOIN empresas e ON c.empresa_id = e.id
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
                    : [],
                empresa: {
                    id: campanha.empresa_id,
                    nome: campanha.empresa_nome,
                    nif: campanha.empresa_nif,
                    logo_url: campanha.empresa_logo ? `${baseUrl}${campanha.empresa_logo}` : null
                }
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