const db = require('../config/database');
const config = require('../config/config');
const path = require('path');

// Função auxiliar para formatar URLs de imagens
function formatImageUrls(images) {
  if (!images) return [];
  return images.split(',').map(image => {
    // Se a imagem já começa com http ou https, retorna como está
    if (image.startsWith('http')) {
      return image;
    }
    // Se a imagem já começa com /uploads, adiciona apenas a baseUrl
    if (image.startsWith('/uploads')) {
      return `${config.baseUrl}${image}`;
    }
    // Caso contrário, adiciona o caminho completo
    return `${config.baseUrl}/uploads/${image}`;
  });
}

exports.createAnuncio = async (
  titulo,
  categoria,
  modalidade,
  descricao,
  visibilidade,
  disponivel_whatsapp,
  imagens,
  userId
) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Inserir o anúncio
    const [result] = await connection.query(
      'INSERT INTO anuncios (titulo, categoria, modalidade, descricao, visibilidade, disponivel_whatsapp, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [titulo, categoria, modalidade, descricao, visibilidade, disponivel_whatsapp, userId]
    );

    const anuncioId = result.insertId;

    // Inserir as imagens
    if (imagens && imagens.length > 0) {
      const imageValues = imagens.map(imagem => [anuncioId, `/uploads/${path.basename(imagem)}`]);
      await connection.query(
        'INSERT INTO anuncio_imagens (anuncio_id, url) VALUES ?',
        [imageValues]
      );
    }

    await connection.commit();
    return anuncioId;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getAnuncios = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT 
      a.*,
      u.nome as user_nome,
      u.telefone as user_telefone,
      GROUP_CONCAT(ai.url) as imagens
    FROM anuncios a
    LEFT JOIN usuarios u ON a.user_id = u.id
    LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
  `;

  const whereConditions = [];
  const params = [];

  if (filters.categoria) {
    whereConditions.push('a.categoria = ?');
    params.push(filters.categoria);
  }

  if (filters.modalidade) {
    whereConditions.push('a.modalidade = ?');
    params.push(filters.modalidade);
  }

  if (filters.userId) {
    whereConditions.push('a.user_id = ?');
    params.push(filters.userId);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' GROUP BY a.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(query, params);
  
  // Converter a string de imagens em array com URLs completas
  return rows.map(row => ({
    ...row,
    imagens: formatImageUrls(row.imagens)
  }));
};

exports.getAnuncioById = async (id) => {
  const [rows] = await db.query(`
    SELECT 
      a.*,
      u.nome as user_nome,
      u.telefone as user_telefone,
      GROUP_CONCAT(ai.url) as imagens
    FROM anuncios a
    LEFT JOIN usuarios u ON a.user_id = u.id
    LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
    WHERE a.id = ?
    GROUP BY a.id
  `, [id]);

  if (rows[0]) {
    return {
      ...rows[0],
      imagens: formatImageUrls(rows[0].imagens)
    };
  }

  return null;
};

exports.updateAnuncio = async (id, userId, updateData) => {
  const { titulo, categoria, modalidade, descricao, visibilidade, disponivel_whatsapp } = updateData;
  
  const [result] = await db.query(
    `UPDATE anuncios 
     SET titulo = ?, categoria = ?, modalidade = ?, descricao = ?, 
         visibilidade = ?, disponivel_whatsapp = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [titulo, categoria, modalidade, descricao, visibilidade, disponivel_whatsapp, id, userId]
  );

  return result.affectedRows > 0;
};

exports.deleteAnuncio = async (id, userId) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Deletar imagens
    await connection.query('DELETE FROM anuncio_imagens WHERE anuncio_id = ?', [id]);

    // Deletar anúncio
    const [result] = await connection.query(
      'DELETE FROM anuncios WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    await connection.commit();
    return result.affectedRows > 0;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getAnunciosSemelhantes = async (anuncioId, limit = 5) => {
  // Primeiro, obter a categoria do anúncio atual
  const [anuncioAtual] = await db.query(
    `SELECT categoria FROM anuncios WHERE id = ?`,
    [anuncioId]
  );

  if (!anuncioAtual[0]) {
    throw new Error('Anúncio não encontrado');
  }

  // Buscar anúncios da mesma categoria, excluindo o anúncio atual
  const [anuncios] = await db.query(
    `SELECT 
       a.id,
       a.titulo,
       a.categoria,
       a.modalidade,
       a.descricao,
       a.visibilidade,
       a.disponivel_whatsapp,
       a.user_id,
       a.created_at,
       a.updated_at,
       u.nome as anunciante_nome,
       GROUP_CONCAT(DISTINCT ai.url) as imagens
     FROM anuncios a
     JOIN usuarios u ON a.user_id = u.id
     LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
     WHERE a.categoria = ? 
       AND a.id != ?
     GROUP BY a.id
     ORDER BY a.created_at DESC
     LIMIT ?`,
    [anuncioAtual[0].categoria, anuncioId, limit]
  );

  return anuncios.map(anuncio => ({
    id: anuncio.id,
    titulo: anuncio.titulo,
    categoria: anuncio.categoria,
    modalidade: anuncio.modalidade,
    descricao: anuncio.descricao,
    visibilidade: anuncio.visibilidade,
    disponivel_whatsapp: anuncio.disponivel_whatsapp,
    user_id: anuncio.user_id,
    anunciante: anuncio.anunciante_nome,
    imagens: formatImageUrls(anuncio.imagens),
    created_at: anuncio.created_at,
    updated_at: anuncio.updated_at
  }));
};