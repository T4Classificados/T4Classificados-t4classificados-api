const db = require('../config/database');

exports.createGuest = async (nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken) => {
  const [result] = await db.query(
    'INSERT INTO convidados (nome, telefone, acompanhante, numero_acompanhantes, tipo_acompanhante, evento_id, confirmation_token, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken, 'pendente']
  );
  return result;
};

exports.getAllGuests = async () => {
  const [rows] = await db.query('SELECT * FROM convidados');
  return rows;
};

exports.getGuestById = async (id) => {
  const [rows] = await db.query('SELECT * FROM convidados WHERE id = ?', [id]);
  return rows[0];
};

exports.updateGuest = async (id, guestData) => {
  const { nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, status } = guestData;
  
  const query = `
    UPDATE convidados 
    SET nome = ?, telefone = ?, acompanhante = ?, numero_acompanhantes = ?, 
        tipo_acompanhante = ?, evento_id = ?, status = ? 
    WHERE id = ?
  `;
  const params = [nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, status, id];

  const [result] = await db.query(query, params);
  return result;
};

exports.deleteGuest = async (id) => {
  const [result] = await db.query('DELETE FROM convidados WHERE id = ?', [id]);
  return result;
};

exports.getGuestByToken = async (token) => {
  const [rows] = await db.query('SELECT * FROM convidados WHERE confirmation_token = ?', [token]);
  return rows[0];
};

exports.updateGuestStatus = async (id, status) => {
  const [result] = await db.query('UPDATE convidados SET status = ? WHERE id = ?', [status, id]);
  return result;
};

exports.getEventInfo = async (eventoId) => {
  const [rows] = await db.query('SELECT * FROM eventos WHERE id = ?', [eventoId]);
  return rows[0];
};

exports.getGuestByTelefone = async (telefone) => {
  const [rows] = await db.query('SELECT * FROM convidados WHERE telefone = ?', [telefone]);
  return rows[0];
};

exports.updateGuestStatusByTelefone = async (telefone, status) => {
  const [result] = await db.query('UPDATE convidados SET status = ? WHERE telefone = ?', [status, telefone]);
  return result;
};