const db = require('../config/database');

class AnuncioModel {
    static async criar(anuncio) {
        try {
            const [result] = await db.query(
                `INSERT INTO anuncios (
                    titulo, tipo_transacao, categoria, preco, preco_negociavel,
                    provincia, municipio, zona, descricao, whatsapp, status,
                    usuario_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    anuncio.titulo,
                    anuncio.tipo_transacao,
                    anuncio.categoria,
                    anuncio.preco,
                    anuncio.preco_negociavel,
                    anuncio.provincia,
                    anuncio.municipio,
                    anuncio.zona,
                    anuncio.descricao,
                    anuncio.whatsapp,
                    anuncio.status || 'Disponível',
                    anuncio.usuario_id
                ]
            );

            if (anuncio.imagens && anuncio.imagens.length > 0) {
                for (const imagem of anuncio.imagens) {
                    await db.query(
                        'INSERT INTO anuncio_imagens (anuncio_id, url_imagem) VALUES (?, ?)',
                        [result.insertId, imagem]
                    );
                }
            }

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async listar(page = 1, limit = 10, filtros = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT a.*, GROUP_CONCAT(ai.url_imagem) as imagens
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                WHERE 1=1
            `;
            
            const values = [];
            
            if (filtros.categoria) {
                query += ' AND a.categoria = ?';
                values.push(filtros.categoria);
            }
            
            if (filtros.provincia) {
                query += ' AND a.provincia = ?';
                values.push(filtros.provincia);
            }
            
            query += `
                GROUP BY a.id
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            values.push(parseInt(limit), offset);
            
            const [rows] = await db.query(query, values);
            
            // Convert comma-separated images string to array with full URLs
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(row => ({
                ...row,
                imagens: row.imagens 
                    ? row.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            }));
        } catch (error) {
            throw error;
        }
    }

    static async obterPorId(id) {
        try {
            const [rows] = await db.query(`
                SELECT a.*, GROUP_CONCAT(ai.url_imagem) as imagens
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                WHERE a.id = ?
                GROUP BY a.id
            `, [id]);

            if (rows.length === 0) {
                return null;
            }

            const anuncio = rows[0];
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            anuncio.imagens = anuncio.imagens 
                ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                : [];
            return anuncio;
        } catch (error) {
            throw error;
        }
    }

    static async atualizar(id, anuncio) {
        try {
            const [result] = await db.query(
                `UPDATE anuncios SET
                    titulo = ?,
                    tipo_transacao = ?,
                    categoria = ?,
                    preco = ?,
                    preco_negociavel = ?,
                    provincia = ?,
                    municipio = ?,
                    zona = ?,
                    descricao = ?,
                    whatsapp = ?,
                    status = ?
                WHERE id = ? AND usuario_id = ?`,
                [
                    anuncio.titulo,
                    anuncio.tipo_transacao,
                    anuncio.categoria,
                    anuncio.preco,
                    anuncio.preco_negociavel,
                    anuncio.provincia,
                    anuncio.municipio,
                    anuncio.zona,
                    anuncio.descricao,
                    anuncio.whatsapp,
                    anuncio.status || 'Disponível',
                    id,
                    anuncio.usuario_id
                ]
            );

            if (result.affectedRows === 0) {
                return false;
            }

            if (anuncio.imagens && anuncio.imagens.length > 0) {
                // Remove imagens antigas
                await db.query('DELETE FROM anuncio_imagens WHERE anuncio_id = ?', [id]);
                
                // Insere novas imagens
                for (const imagem of anuncio.imagens) {
                    await db.query(
                        'INSERT INTO anuncio_imagens (anuncio_id, url_imagem) VALUES (?, ?)',
                        [id, imagem]
                    );
                }
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    static async excluir(id, usuarioId) {
        try {
            const [result] = await db.query(
                'DELETE FROM anuncios WHERE id = ? AND usuario_id = ?',
                [id, usuarioId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async incrementarEstatistica(anuncioId, campo) {
        try {
            const campos = ['visualizacoes', 'chamadas', 'mensagens_whatsapp', 'compartilhamentos'];
            if (!campos.includes(campo)) {
                throw new Error('Campo de estatística inválido');
            }

            await db.query(
                `UPDATE anuncios 
                SET ${campo} = ${campo} + 1 
                WHERE id = ?`,
                [anuncioId]
            );
            return true;
        } catch (error) {
            console.error(`Erro ao incrementar ${campo}:`, error);
            throw error;
        }
    }
}

module.exports = AnuncioModel;