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

            // Insere a campanha com status inicial 'Pendente'
            const [result] = await db.query(
                `INSERT INTO campanhas (
                    empresa_id,
                    usuario_id,
                    nome,
                    tipo_exibicao,
                    espaco_exibicao,
                    descricao,
                    logo_url,
                    botao_texto,
                    num_visualizacoes,
                    valor_visualizacao,
                    total_pagar,
                    views,
                    chamadas,
                    cliques,
                    status,
                    reference_id,
                    channel_value
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'Pendente', ?, ?)`,
                [
                    empresaId,
                    userId,
                    campanha.nome || null,
                    campanha.tipo_exibicao,
                    campanha.espaco_exibicao,
                    campanha.descricao,
                    campanha.logo_url,
                    campanha.botao_texto,
                    campanha.num_visualizacoes,
                    parseFloat(campanha.valor_visualizacao) || 0,
                    parseFloat(campanha.total_pagar) || 0,
                    campanha.reference_id || null,
                    campanha.channel_value || null
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
    static async salvarImagens(campanha_id, imagens) {
        console.log(campanha_id);
        try {
            // Preparar a query para inserção múltipla
            const values = imagens.map(url => [campanha_id, url]);
            
            await db.query(
                'INSERT INTO campanha_imagens (campanha_id, url_imagem) VALUES ?',
                [values]
            );

            return true;
        } catch (error) {
            console.error('Erro ao salvar imagens:', error);
            throw error;
        }
    }

    static async listar(userId) {
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
                WHERE c.usuario_id = ?
                GROUP BY c.id
                ORDER BY c.created_at DESC
                `,
                [userId]
            );

            //const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(row => ({
                ...row,
                logo_url: row.logo_url ? row.logo_url : null,
                imagens: row.imagens 
                    ? row.imagens.split(',').map(img => img)
                    : [],
                empresa: {
                    id: row.empresa_id,
                    nome: row.empresa_nome,
                    nif: row.empresa_nif,
                    logo_url: row.empresa_logo ?row.empresa_logo : null
                }
            }));
        } catch (error) {
            throw error;
        }
    }
    static async listarPublico() {
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
                GROUP BY c.id
                ORDER BY c.created_at DESC`
            );
    
            //const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    
            return rows.map(row => ({
                ...row,
                logo_url: row.logo_url ? row.logo_url : null,
                imagens: row.imagens 
                    ? row.imagens.split(',').map(img => img)
                    : [],
                empresa: {
                    id: row.empresa_id,
                    nome: row.empresa_nome,
                    nif: row.empresa_nif,
                    logo_url: row.empresa_logo ? row.empresa_logo : null
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
           // const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            
            return {
                ...campanha,
                logo_url: campanha.logo_url ? campanha.logo_url : null,
                imagens: campanha.imagens 
                    ? campanha.imagens.split(',').map(img => img)
                    : [],
                empresa: {
                    id: campanha.empresa_id,
                    nome: campanha.empresa_nome,
                    nif: campanha.empresa_nif,
                    logo_url: campanha.empresa_logo ? campanha.empresa_logo: null
                }
            };
        } catch (error) {
            throw error;
        }
    }
    static async obterPorReferenceId(referenceId) {
        console.log("Entre aqui")
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
                WHERE c.reference_id = ?
                GROUP BY c.id`,
                [referenceId]
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
                    espaco_exibicao = ?,
                    descricao = ?,
                    logo_url = ?,
                    botao_texto = ?,
                    num_visualizacoes = ?,
                    valor_visualizacao = ?,
                    total_pagar = ?,
                    channel_value = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND usuario_id = ?`,
                [
                    campanha.tipo_exibicao || existente[0].tipo_exibicao,
                    campanha.espaco_exibicao || existente[0].espaco_exibicao,
                    campanha.descricao || existente[0].descricao,
                    campanha.logo_url || existente[0].logo_url,
                    campanha.botao_texto || existente[0].botao_texto,
                    campanha.num_visualizacoes || existente[0].num_visualizacoes,
                    campanha.valor_visualizacao || existente[0].valor_visualizacao,
                    campanha.total_pagar || existente[0].total_pagar,
                    campanha.channel_value || existente[0].channel_value,
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

    static async listarAdmin(status = 'todos') {
        try {
            let whereClause = '';
            let params = [];

            // Filtro de status
            if (status !== 'todos') {
                whereClause = ' AND c.status = ?';
                params.push(status);
            }

            // Query principal
            const [campanhas] = await db.query(
                `SELECT 
                    c.*,
                    u.nome as usuario_nome,
                    u.telefone as usuario_telefone,
                    e.nome as empresa_nome,
                    GROUP_CONCAT(DISTINCT ci.url_imagem) as imagens
                FROM campanhas c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                LEFT JOIN empresas e ON u.empresa_id = e.id
                LEFT JOIN campanha_imagens ci ON c.id = ci.campanha_id
                WHERE 1=1 ${whereClause}
                GROUP BY c.id
                ORDER BY c.created_at DESC
                `,
                [...params]
            );

            // Contagem total para paginação
            const [total] = await db.query(
                `SELECT COUNT(*) as total 
                FROM campanhas c 
                WHERE 1=1 ${whereClause}`,
                params
            );

            // Formatar URLs e estruturar dados
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            const campanhasFormatadas = campanhas.map(campanha => ({
                id: campanha.id,
                nome: campanha.nome,
                tipo_exibicao: campanha.tipo_exibicao,
                espaco_exibicao: campanha.espaco_exibicao,
                descricao: campanha.descricao,
                logo_url: campanha.logo_url ? `${baseUrl}${campanha.logo_url}` : null,
                botao_texto: campanha.botao_texto,
                num_visualizacoes: campanha.num_visualizacoes,
                valor_visualizacao: campanha.valor_visualizacao,
                channel_value: campanha.channel_value,
                total_pagar: campanha.total_pagar,
                views: campanha.views || 0,
                chamadas: campanha.chamadas || 0,
                cliques: campanha.cliques || 0,
                status: campanha.status,
                created_at: campanha.created_at,
                updated_at: campanha.updated_at,
                usuario: {
                    id: campanha.usuario_id,
                    nome: campanha.usuario_nome,
                    telefone: campanha.usuario_telefone
                },
                empresa: campanha.empresa_nome ? {
                    nome: campanha.empresa_nome
                } : null,
                imagens: campanha.imagens 
                    ? campanha.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            }));

            return {
                campanhas: campanhasFormatadas,
                pagination: {
                    total: total[0].total,
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async incrementarEstatistica(id, tipo) {
        try {
            const campo = tipo === 'view' ? 'views' : 
                         tipo === 'chamada' ? 'chamadas' : 
                         'cliques';
            
            const [result] = await db.query(
                `UPDATE campanhas 
                SET ${campo} = ${campo} + 1 
                WHERE id = ? 
                AND status = 'Ativa'`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async incrementarVisualizacao(id) {
        try {
            const [result] = await db.query(`
                UPDATE campanhas 
                SET 
                    views = views + 1,
                    status = CASE 
                        WHEN views + 1 >= num_visualizacoes THEN 'Concluída'
                        ELSE status 
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? 
                AND status = 'Ativa'`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async confirmarPagamento(id) {
        try {
            const [result] = await db.query(
                `UPDATE campanhas 
                SET 
                    status = 'Ativa',
                    updated_at = CURRENT_TIMESTAMP
                WHERE 
                    id = ? 
                    AND status = 'Pendente'`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async atualizarStatusPagamento(id, status, transactionId) {
        try {
            const [result] = await db.query(
                `UPDATE campanhas 
                SET 
                    status = ?,
                    transaction_id = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE 
                    reference_id = ? 
                    AND (status = 'Pendente' OR status = 'Concluída')`,
                [status, transactionId, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CampanhaModel; 