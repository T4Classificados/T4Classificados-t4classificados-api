const db = require('../config/database');

class AnuncioModel {
    static async criar(dados) {
        try {
            const [result] = await db.query(
                `INSERT INTO anuncios (
                    titulo, tipo_transacao, categoria, preco, 
                    preco_negociavel, provincia, municipio, zona, 
                    descricao, whatsapp, status, usuario_id, imagem_principal,
                    mobilado, marca, kilometragem, ano_de_fabrico
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    dados.titulo,
                    dados.tipo_transacao,
                    dados.categoria,
                    dados.preco,
                    dados.preco_negociavel,
                    dados.provincia,
                    dados.municipio,
                    dados.zona,
                    dados.descricao,
                    dados.whatsapp,
                    'Disponível',
                    dados.usuario_id,
                    dados.imagem_principal,
                    dados.mobilado || null,
                    dados.marca || null,
                    dados.kilometragem || null,
                    dados.ano_de_fabrico || null
                ]
            );

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async salvarImagens(anuncioId, imagens) {
        try {
            // Preparar a query para inserção múltipla
            const values = imagens.map(url => [anuncioId, url]);
            
            await db.query(
                'INSERT INTO anuncio_imagens (anuncio_id, url_imagem) VALUES ?',
                [values]
            );

            return true;
        } catch (error) {
            console.error('Erro ao salvar imagens:', error);
            throw error;
        }
    }

    static async listar(filtros = {}) {
        try {
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
            `;
            
            
            const [rows] = await db.query(query, values);
            
            // Convert comma-separated images string to array with full URLs
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(row => ({
                ...row,
                imagem_principal: row.imagem_principal ? `${baseUrl}${row.imagem_principal}` : null,
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
                SELECT 
                    a.*,
                    GROUP_CONCAT(ai.url_imagem) as imagens,
                    u.id as usuario_id,
                    u.nome as usuario_nome,
                    u.sobrenome as usuario_sobrenome,
                    u.telefone as usuario_telefone,
                    u.provincia as usuario_provincia,
                    u.municipio as usuario_municipio,
                    u.foto_url as usuario_foto,
                    u.genero as usuario_genero,
                    u.created_at as usuario_created_at
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.id = ?
                GROUP BY a.id
            `, [id]);

            if (rows.length === 0) {
                return null;
            }

            const anuncio = rows[0];
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

            // Formatar dados do usuário
            const usuario = {
                id: anuncio.usuario_id,
                nome: anuncio.usuario_nome,
                sobrenome: anuncio.usuario_sobrenome,
                telefone: anuncio.usuario_telefone,
                provincia: anuncio.usuario_provincia,
                municipio: anuncio.usuario_municipio,
                genero: anuncio.usuario_genero,
                foto_url: anuncio.usuario_foto ? `${baseUrl}${anuncio.usuario_foto}` : null,
                created_at: anuncio.usuario_created_at
            };

            // Remover campos do usuário do objeto principal
            delete anuncio.usuario_id;
            delete anuncio.usuario_nome;
            delete anuncio.usuario_sobrenome;
            delete anuncio.usuario_telefone;
            delete anuncio.usuario_provincia;
            delete anuncio.usuario_municipio;
            delete anuncio.usuario_foto;
            delete anuncio.usuario_genero;
            delete anuncio.usuario_created_at;

            return {
                ...anuncio,
                imagem_principal: anuncio.imagem_principal ? `${baseUrl}${anuncio.imagem_principal}` : null,
                imagens: anuncio.imagens 
                    ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : [],
                usuario
            };
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
                    status = ?,
                    mobilado = ?,
                    marca = ?,
                    kilometragem = ?,
                    ano_de_fabrico = ?
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
                    anuncio.mobilado || null,
                    anuncio.marca || null,
                    anuncio.kilometragem || null,
                    anuncio.ano_de_fabrico || null,
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

    static async excluirAdmin(id) {
        try {
            // Primeiro exclui as imagens relacionadas
            await db.query(
                'DELETE FROM anuncio_imagens WHERE anuncio_id = ?',
                [id]
            );

            // Depois exclui o anúncio
            const [result] = await db.query(
                'DELETE FROM anuncios WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async excluir(id, usuarioId) {
        try {
            // Primeiro exclui as imagens relacionadas
            await db.query(
                'DELETE FROM anuncio_imagens WHERE anuncio_id = ? AND EXISTS (SELECT 1 FROM anuncios WHERE id = ? AND usuario_id = ?)',
                [id, id, usuarioId]
            );

            // Depois exclui o anúncio
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

    static async listarTodos() {
        try {
            // Query para buscar todos os anúncios com informações do usuário
            const [anuncios] = await db.query(
                `SELECT 
                    a.*,
                    u.nome as usuario_nome,
                    u.telefone as usuario_telefone,
                    a.imagem_principal,
                    GROUP_CONCAT(DISTINCT ai.url_imagem) as imagens
                FROM anuncios a
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                GROUP BY a.id
                ORDER BY a.created_at DESC
                `
            );

            // Buscar total de anúncios para paginação
            const [total] = await db.query(
                'SELECT COUNT(*) as total FROM anuncios'
            );

            // Formatar URLs das imagens
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            const anunciosFormatados = anuncios.map(anuncio => ({
                id: anuncio.id,
                titulo: anuncio.titulo,
                descricao: anuncio.descricao,
                preco: anuncio.preco,
                categoria: anuncio.categoria,
                subcategoria: anuncio.subcategoria,
                condicao: anuncio.condicao,
                status: anuncio.status,
                visualizacoes: anuncio.visualizacoes,
                chamadas: anuncio.chamadas,
                mensagens_whatsapp: anuncio.mensagens_whatsapp,
                compartilhamentos: anuncio.compartilhamentos,
                created_at: anuncio.created_at,
                updated_at: anuncio.updated_at,
                imagem_principal: anuncio.imagem_principal ? `${baseUrl}${anuncio.imagem_principal}` : null,
                usuario: {
                    id: anuncio.usuario_id,
                    nome: anuncio.usuario_nome,
                    telefone: anuncio.usuario_telefone
                },
                imagens: anuncio.imagens 
                    ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : [],
                total_favoritos: anuncio.total_favoritos || 0
            }));

            return {
                anuncios: anunciosFormatados,
                pagination: {
                    total: total[0].total,
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async listarPublicos(filtros = {}) {
        try {
            let query = `
                SELECT a.*, 
                       GROUP_CONCAT(ai.url_imagem) as imagens
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                WHERE a.status = 'Disponível'
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
            `;
            
            const [rows] = await db.query(query, values);
            
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(row => ({
                ...row,
                imagem_principal: row.imagem_principal ? `${baseUrl}${row.imagem_principal}` : null,
                imagens: row.imagens 
                    ? row.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            }));
        } catch (error) {
            throw error;
        }
    }

    static async incrementarInteracao(id, tipo) {
        try {
            // Verificar se o tipo é válido
            if (!Object.values(TipoInteracao).includes(tipo)) {
                throw new Error('Tipo de interação inválido');
            }

            const campo = camposPorTipo[tipo];
            
            const [result] = await db.query(
                `UPDATE anuncios SET ${campo} = ${campo} + 1 WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async listarPorUsuario(usuarioId, filtros = {}) {
        try {

            // Query para buscar anúncios do usuário com informações completas
            let query = `
                SELECT 
                    a.*,
                    u.nome as usuario_nome,
                    u.telefone as usuario_telefone,
                    a.imagem_principal,
                    GROUP_CONCAT(DISTINCT ai.url_imagem) as imagens
                FROM anuncios a
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                WHERE a.usuario_id = ?
            `;
            
            const values = [usuarioId];
            
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
            `;
            
            const [anuncios] = await db.query(query, values);

            // Buscar total de anúncios do usuário para paginação
            const [total] = await db.query(
                'SELECT COUNT(*) as total FROM anuncios WHERE usuario_id = ?',
                [usuarioId]
            );

            // Formatar URLs das imagens e estruturar resposta
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            const anunciosFormatados = anuncios.map(anuncio => ({
                id: anuncio.id,
                titulo: anuncio.titulo,
                descricao: anuncio.descricao,
                preco: anuncio.preco,
                categoria: anuncio.categoria,
                subcategoria: anuncio.subcategoria,
                condicao: anuncio.condicao,
                status: anuncio.status,
                tipo_transacao: anuncio.tipo_transacao,
                provincia: anuncio.provincia,
                municipio: anuncio.municipio,
                zona: anuncio.zona,
                visualizacoes: anuncio.visualizacoes,
                chamadas: anuncio.chamadas,
                mensagens_whatsapp: anuncio.mensagens_whatsapp,
                compartilhamentos: anuncio.compartilhamentos,
                mobilado: anuncio.mobilado,
                marca: anuncio.marca,
                kilometragem: anuncio.kilometragem,
                ano_de_fabrico: anuncio.ano_de_fabrico,
                created_at: anuncio.created_at,
                updated_at: anuncio.updated_at,
                usuario: {
                    id: anuncio.usuario_id,
                    nome: anuncio.usuario_nome,
                    telefone: anuncio.usuario_telefone
                },
                imagem_principal: anuncio.imagem_principal ? `${baseUrl}${anuncio.imagem_principal}` : null,
                imagens: anuncio.imagens 
                    ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : [],
                total_favoritos: anuncio.total_favoritos || 0
            }));

            return {
                anuncios: anunciosFormatados,
                pagination: {
                    total: total[0].total,
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async alterarStatus(id, userId, status) {
        try {
            // Verifica se o status é válido
            const statusValidos = ['Disponível', 'Vendido', 'Reservado', 'Indisponível'];
            if (!statusValidos.includes(status)) {
                throw new Error('Status inválido');
            }

            const [result] = await db.query(
                'UPDATE anuncios SET status = ? WHERE id = ? AND usuario_id = ?',
                [status, id, userId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async buscarSimilares(id) {
        try {
            // Primeiro obtém o anúncio de referência
            const [anuncioRef] = await db.query(
                'SELECT categoria, tipo_transacao, id FROM anuncios WHERE id = ?',
                [id]
            );

            if (!anuncioRef[0]) {
                return [];
            }

            // Busca anúncios similares
            const [rows] = await db.query(`
                SELECT a.*, 
                       GROUP_CONCAT(ai.url_imagem) as imagens
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                WHERE a.categoria = ? 
                OR a.marca = ?
                AND a.id != ?
                AND a.status = 'Disponível'
                GROUP BY a.id
                ORDER BY RAND()
                `,
                [
                    anuncioRef[0].categoria,
                    anuncioRef[0].marca,
                    id
                ]
            );

            // Formatar URLs das imagens
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(anuncio => ({
                id: anuncio.id,
                titulo: anuncio.titulo,
                descricao: anuncio.descricao,
                preco: anuncio.preco,
                provincia: anuncio.provincia,
                municipio: anuncio.municipio,
                tipo_transacao: anuncio.tipo_transacao,
                mobilado: anuncio.mobilado,
                marca: anuncio.marca,
                kilometragem: anuncio.kilometragem,
                ano_de_fabrico: anuncio.ano_de_fabrico,
                categoria: anuncio.categoria,
                status: anuncio.status,
                visualizacoes: anuncio.visualizacoes || 0,
                chamadas: anuncio.chamadas || 0,
                mensagens_whatsapp: anuncio.mensagens_whatsapp || 0,
                compartilhamentos: anuncio.compartilhamentos || 0,
                imagem_principal: anuncio.imagem_principal ? `${baseUrl}${anuncio.imagem_principal}` : null,
                imagens: anuncio.imagens 
                    ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            }));
        } catch (error) {
            throw error;
        }
    }

    static async buscarSimilaresDoUsuario(anuncioId) {
        try {
            // Primeiro obtém o anúncio de referência
            const [anuncioRef] = await db.query(
                'SELECT categoria, tipo_transacao, id, usuario_id FROM anuncios WHERE id = ?',
                [anuncioId]
            );

            if (!anuncioRef[0]) {
                return [];
            }

            // Busca anúncios similares do mesmo usuário
            const [rows] = await db.query(`
                SELECT a.*, 
                       GROUP_CONCAT(ai.url_imagem) as imagens
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                WHERE a.usuario_id = ?
                AND a.id != ?
                AND a.status = 'Disponível'
                AND (
                    a.categoria = ? OR 
                    a.marca = ?
                )
                GROUP BY a.id
                ORDER BY 
                    CASE 
                        WHEN a.categoria = ? AND a.marca = ? THEN 1
                        WHEN a.categoria = ? THEN 2
                        WHEN a.marca = ? THEN 3
                        ELSE 4
                    END,
                    a.created_at DESC
                `,
                [
                    anuncioRef[0].usuario_id,
                    anuncioId,
                    anuncioRef[0].categoria,
                    anuncioRef[0].marca,
                    anuncioRef[0].categoria,
                    anuncioRef[0].marca,
                    anuncioRef[0].categoria,
                    anuncioRef[0].marca
                ]
            );

            // Formatar URLs das imagens
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(anuncio => ({
                id: anuncio.id,
                titulo: anuncio.titulo,
                descricao: anuncio.descricao,
                preco: anuncio.preco,
                provincia: anuncio.provincia,
                municipio: anuncio.municipio,
                tipo_transacao: anuncio.tipo_transacao,
                mobilado: anuncio.mobilado,
                marca: anuncio.marca,
                kilometragem: anuncio.kilometragem,
                ano_de_fabrico: anuncio.ano_de_fabrico,
                categoria: anuncio.categoria,
                status: anuncio.status,
                visualizacoes: anuncio.visualizacoes || 0,
                chamadas: anuncio.chamadas || 0,
                mensagens_whatsapp: anuncio.mensagens_whatsapp || 0,
                compartilhamentos: anuncio.compartilhamentos || 0,
                created_at: anuncio.created_at,
                imagem_principal: anuncio.imagem_principal ? `${baseUrl}${anuncio.imagem_principal}` : null,
                imagens: anuncio.imagens 
                    ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : []
            }));
        } catch (error) {
            throw error;
        }
    }

    static async buscarRecentesDoUsuario(usuarioId) {
        try {
            const [rows] = await db.query(`
                SELECT a.*, 
                       GROUP_CONCAT(ai.url_imagem) as imagens,
                       u.nome as usuario_nome,
                       u.sobrenome as usuario_sobrenome,
                       u.foto_url as usuario_foto
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.usuario_id = ?
                AND a.status = 'Disponível'
                GROUP BY a.id
                ORDER BY a.created_at DESC
                `,
                [usuarioId]
            );

            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(anuncio => ({
                id: anuncio.id,
                titulo: anuncio.titulo,
                descricao: anuncio.descricao,
                preco: anuncio.preco,
                provincia: anuncio.provincia,
                municipio: anuncio.municipio,
                tipo_transacao: anuncio.tipo_transacao,
                mobilado: anuncio.mobilado,
                marca: anuncio.marca,
                kilometragem: anuncio.kilometragem,
                ano_de_fabrico: anuncio.ano_de_fabrico,
                categoria: anuncio.categoria,
                status: anuncio.status,
                visualizacoes: anuncio.visualizacoes || 0,
                chamadas: anuncio.chamadas || 0,
                mensagens_whatsapp: anuncio.mensagens_whatsapp || 0,
                compartilhamentos: anuncio.compartilhamentos || 0,
                created_at: anuncio.created_at,
                imagem_principal: anuncio.imagem_principal ? `${baseUrl}${anuncio.imagem_principal}` : null,
                imagens: anuncio.imagens 
                    ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : [],
                usuario: {
                    nome: anuncio.usuario_nome,
                    sobrenome: anuncio.usuario_sobrenome,
                    foto_url: anuncio.usuario_foto ? `${baseUrl}${anuncio.usuario_foto}` : null
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    static async obterEstatisticasUsuario(usuarioId) {
        try {
            // Estatísticas gerais
            const [estatisticas] = await db.query(`
                SELECT 
                    COUNT(*) as total_anuncios,
                    SUM(visualizacoes) as total_visualizacoes,
                    SUM(chamadas) as total_chamadas,
                    SUM(mensagens_whatsapp) as total_mensagens,
                    SUM(compartilhamentos) as total_compartilhamentos,
                    COUNT(CASE WHEN status = 'Vendido' THEN 1 END) as total_vendidos,
                    COUNT(CASE WHEN status = 'Disponível' THEN 1 END) as total_disponiveis,
                    COUNT(CASE WHEN status = 'Reservado' THEN 1 END) as total_reservados
                FROM anuncios 
                WHERE usuario_id = ?`,
                [usuarioId]
            );

            // Estatísticas por categoria
            const [categorias] = await db.query(`
                SELECT 
                    categoria,
                    COUNT(*) as total_anuncios,
                    SUM(visualizacoes) as visualizacoes,
                    SUM(chamadas) as chamadas,
                    SUM(mensagens_whatsapp) as mensagens,
                    SUM(compartilhamentos) as compartilhamentos
                FROM anuncios
                WHERE usuario_id = ?
                GROUP BY categoria
                ORDER BY total_anuncios DESC`,
                [usuarioId]
            );

            // Estatísticas por mês (últimos 6 meses)
            const [evolucaoMensal] = await db.query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as mes,
                    COUNT(*) as total_anuncios,
                    SUM(visualizacoes) as visualizacoes,
                    SUM(chamadas) as chamadas,
                    SUM(mensagens_whatsapp) as mensagens,
                    SUM(compartilhamentos) as compartilhamentos
                FROM anuncios
                WHERE usuario_id = ?
                AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY mes
                ORDER BY mes DESC`,
                [usuarioId]
            );

            return {
                resumo: {
                    total_anuncios: estatisticas[0].total_anuncios || 0,
                    total_visualizacoes: estatisticas[0].total_visualizacoes || 0,
                    total_chamadas: estatisticas[0].total_chamadas || 0,
                    total_mensagens: estatisticas[0].total_mensagens || 0,
                    total_compartilhamentos: estatisticas[0].total_compartilhamentos || 0,
                    total_vendidos: estatisticas[0].total_vendidos || 0,
                    total_disponiveis: estatisticas[0].total_disponiveis || 0,
                    total_reservados: estatisticas[0].total_reservados || 0
                },
                categorias: categorias.map(cat => ({
                    categoria: cat.categoria,
                    total_anuncios: cat.total_anuncios || 0,
                    visualizacoes: cat.visualizacoes || 0,
                    chamadas: cat.chamadas || 0,
                    mensagens: cat.mensagens || 0,
                    compartilhamentos: cat.compartilhamentos || 0
                })),
                evolucao_mensal: evolucaoMensal.map(mes => ({
                    mes: mes.mes,
                    total_anuncios: mes.total_anuncios || 0,
                    visualizacoes: mes.visualizacoes || 0,
                    chamadas: mes.chamadas || 0,
                    mensagens: mes.mensagens || 0,
                    compartilhamentos: mes.compartilhamentos || 0
                }))
            };
        } catch (error) {
            throw error;
        }
    }

    static async listarMaisVisualizados() {
        try {
            const [rows] = await db.query(`
                SELECT a.*, 
                       GROUP_CONCAT(ai.url_imagem) as imagens,
                       u.nome as usuario_nome,
                       u.sobrenome as usuario_sobrenome,
                       u.foto_url as usuario_foto,
                       u.telefone as usuario_telefone
                FROM anuncios a
                LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.status = 'Disponível'
                GROUP BY a.id
                ORDER BY a.visualizacoes DESC
                `
            );

            if (!rows || rows.length === 0) {
                return [];
            }

            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return rows.map(anuncio => ({
                id: anuncio.id,
                titulo: anuncio.titulo,
                descricao: anuncio.descricao,
                preco: anuncio.preco,
                provincia: anuncio.provincia,
                municipio: anuncio.municipio,
                tipo_transacao: anuncio.tipo_transacao,
                categoria: anuncio.categoria,
                status: anuncio.status,
                visualizacoes: anuncio.visualizacoes || 0,
                chamadas: anuncio.chamadas || 0,
                mensagens_whatsapp: anuncio.mensagens_whatsapp || 0,
                compartilhamentos: anuncio.compartilhamentos || 0,
                created_at: anuncio.created_at,
                imagem_principal: anuncio.imagem_principal ? `${baseUrl}${anuncio.imagem_principal}` : null,
                imagens: anuncio.imagens 
                    ? anuncio.imagens.split(',').map(img => `${baseUrl}${img}`)
                    : [],
                usuario: {
                    nome: anuncio.usuario_nome,
                    sobrenome: anuncio.usuario_sobrenome,
                    telefone: anuncio.usuario_telefone,
                    foto_url: anuncio.usuario_foto ? `${baseUrl}${anuncio.usuario_foto}` : null
                }
            }));
        } catch (error) {
            console.error('Erro ao listar anúncios mais visualizados:', error);
            return [];
        }
    }
}

// Enum para tipos de interação
const TipoInteracao = {
    VISUALIZACAO: 'visualizacao',
    CHAMADA: 'chamada',
    MENSAGEM: 'mensagem',
    COMPARTILHAMENTO: 'compartilhamento'
};

// Mapeamento de tipos para campos no banco
const camposPorTipo = {
    [TipoInteracao.VISUALIZACAO]: 'visualizacoes',
    [TipoInteracao.CHAMADA]: 'chamadas',
    [TipoInteracao.MENSAGEM]: 'mensagens_whatsapp',
    [TipoInteracao.COMPARTILHAMENTO]: 'compartilhamentos'
};

// Exportar o enum para uso no controller
exports.TipoInteracao = TipoInteracao;

module.exports = AnuncioModel;