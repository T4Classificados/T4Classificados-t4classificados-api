const db = require('../config/database');

exports.createUser = async (nome, sobrenome, telefone, senha, provincia, municipio, role = 'user', confirmationCode) => {
  const [result] = await db.query(
    'INSERT INTO usuarios (nome, sobrenome, telefone, senha, provincia, municipio, role, confirmation_code, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, sobrenome, telefone, senha, provincia, municipio, role, confirmationCode, false]
  );
  return result;
};

exports.getUserByTelefone = async (telefone) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE telefone = ?', [telefone]);
  return rows[0];
};

exports.getUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return rows[0];
};

exports.activateUser = async (id) => {
  const [result] = await db.query('UPDATE usuarios SET is_active = 1, confirmation_code = NULL WHERE id = ?', [id]);
  return result;
};

exports.updateConfirmationCode = async (id, confirmationCode) => {
  const [result] = await db.query('UPDATE usuarios SET confirmation_code = ? WHERE id = ?', [confirmationCode, id]);
  return result;
};

exports.updateResetCode = async (id, resetCode) => {
  const [result] = await db.query('UPDATE usuarios SET reset_code = ? WHERE id = ?', [resetCode, id]);
  return result;
};

exports.updatePassword = async (id, newPassword) => {
  const [result] = await db.query('UPDATE usuarios SET senha = ? WHERE id = ?', [newPassword, id]);
  return result;
};

exports.clearResetCode = async (id) => {
  const [result] = await db.query('UPDATE usuarios SET reset_code = NULL WHERE id = ?', [id]);
  return result;
};

exports.updateUser = async (id, updateData) => {
  // Campos permitidos para atualização
  const allowedFields = ['nome', 'genero', 'provincia', 'municipio', 'role'];
  
  // Filtrar apenas os campos permitidos que foram fornecidos
  const validUpdates = Object.keys(updateData)
    .filter(key => allowedFields.includes(key) && updateData[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(validUpdates).length === 0) {
    return false;
  }

  // Construir a query dinamicamente
  const setClause = Object.keys(validUpdates)
    .map(field => `${field} = ?`)
    .join(', ');
  
  const values = [...Object.values(validUpdates), id];

  const [result] = await db.query(
    `UPDATE usuarios SET ${setClause} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
};