const db = require('../config/database');

exports.createUser = async (nome, sobrenome, telefone, senha, role = 'user') => {
  const [result] = await db.query(
    'INSERT INTO usuarios (nome, sobrenome, telefone, senha, role) VALUES (?, ?, ?, ?, ?)',
    [nome, sobrenome, telefone, senha, role]
  );
  return result;
};

exports.getUserByTelefone = async (telefone) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE telefone = ?', [telefone]);
  return rows[0];
};

exports.getUserById = async (id) => {
  const [rows] = await db.query('SELECT id, nome, sobrenome, telefone, role FROM usuarios WHERE id = ?', [id]);
  return rows[0];
};