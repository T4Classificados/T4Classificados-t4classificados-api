const db = require('../config/database');

exports.getEmpregos = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT e.*, u.nome as empresa_nome, u.telefone as empresa_telefone 
    FROM empregos e
    JOIN usuarios u ON e.user_id = u.id
    WHERE 1=1
  `;
  const queryParams = [];

  if (filters.categoria) {
    query += ' AND e.categoria = ?';
    queryParams.push(filters.categoria);
  }

  if (filters.modalidade) {
    query += ' AND e.modalidade = ?';
    queryParams.push(filters.modalidade);
  }

  if (filters.nivel_experiencia) {
    query += ' AND e.nivel_experiencia = ?';
    queryParams.push(filters.nivel_experiencia);
  }

  query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const [rows] = await db.query(query, queryParams);
  return rows;
};

exports.getEmpregoById = async (id) => {
  const [rows] = await db.query(
    `SELECT e.*, u.nome as empresa_nome, u.telefone as empresa_telefone 
     FROM empregos e
     JOIN usuarios u ON e.user_id = u.id
     WHERE e.id = ?`,
    [id]
  );
  return rows[0];
};

exports.createEmprego = async (userId, empregoData) => {
  const {
    titulo,
    empresa,
    descricao,
    requisitos,
    categoria,
    modalidade,
    salario,
    localizacao,
    nivel_experiencia
  } = empregoData;

  const [result] = await db.query(
    `INSERT INTO empregos (
      user_id, titulo, empresa, descricao, requisitos,
      categoria, modalidade, salario, localizacao,
      nivel_experiencia, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [userId, titulo, empresa, descricao, requisitos, categoria, 
     modalidade, salario, localizacao, nivel_experiencia]
  );

  return result.insertId;
};

exports.updateEmprego = async (id, userId, empregoData) => {
  const {
    titulo,
    empresa,
    descricao,
    requisitos,
    categoria,
    modalidade,
    salario,
    localizacao,
    nivel_experiencia
  } = empregoData;

  const [result] = await db.query(
    `UPDATE empregos 
     SET titulo = ?, empresa = ?, descricao = ?, requisitos = ?,
         categoria = ?, modalidade = ?, salario = ?, localizacao = ?,
         nivel_experiencia = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [titulo, empresa, descricao, requisitos, categoria, modalidade,
     salario, localizacao, nivel_experiencia, id, userId]
  );

  return result.affectedRows > 0;
};

exports.deleteEmprego = async (id, userId) => {
  const [result] = await db.query(
    'DELETE FROM empregos WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}; 