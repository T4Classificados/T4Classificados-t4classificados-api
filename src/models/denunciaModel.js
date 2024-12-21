const db = require('../config/database');

exports.criarDenuncia = async (dados) => {
  const { anuncio_id, motivo, descricao } = dados;

  const [result] = await db.query(
    `INSERT INTO denuncias (anuncio_id, motivo, descricao)
     VALUES (?, ?, ?)`,
    [anuncio_id, motivo, descricao]
  );

  return result.insertId;
};

exports.getDenunciasPorAnuncio = async (anuncioId) => {
  const [rows] = await db.query(
    `SELECT d.*, a.titulo as anuncio_titulo
     FROM denuncias d
     JOIN anuncios a ON d.anuncio_id = a.id
     WHERE d.anuncio_id = ?
     ORDER BY d.created_at DESC`,
    [anuncioId]
  );

  return rows;
};

exports.listarDenuncias = async ({ status, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT d.*, a.titulo as anuncio_titulo
    FROM denuncias d
    JOIN anuncios a ON d.anuncio_id = a.id
    WHERE 1=1
  `;
  const queryParams = [];

  if (status) {
    query += ' AND d.status = ?';
    queryParams.push(status);
  }

  query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const [rows] = await db.query(query, queryParams);

  // Contar total para paginação
  const [totalRows] = await db.query(
    'SELECT COUNT(*) as total FROM denuncias WHERE 1=1' +
    (status ? ' AND status = ?' : ''),
    status ? [status] : []
  );

  return {
    denuncias: rows,
    total: totalRows[0].total
  };
}; 