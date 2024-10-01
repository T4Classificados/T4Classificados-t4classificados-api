const db = require('../config/database');

exports.createEvent = async (nome, data, local, tipo, imagem) => {
  const [result] = await db.query(
    'INSERT INTO eventos (nome, data, local, tipo, imagem) VALUES (?, ?, ?, ?, ?)',
    [nome, data, local, tipo, imagem]
  );
  return result;
};

exports.getAllEvents = async () => {
  const [rows] = await db.query('SELECT * FROM eventos');
  return rows;
};

exports.getEventById = async (id) => {
  const [rows] = await db.query('SELECT * FROM eventos WHERE id = ?', [id]);
  return rows[0];
};

exports.updateEvent = async (id, eventData) => {
  const { nome, data, local, tipo, imagem } = eventData;
  
  const query = 'UPDATE eventos SET nome = ?, data = ?, local = ?, tipo = ?, imagem = ? WHERE id = ?';
  const params = [nome, data, local, tipo, imagem, id];

  const [result] = await db.query(query, params);
  return result;
};

exports.deleteEvent = async (id) => {
  const [result] = await db.query('DELETE FROM eventos WHERE id = ?', [id]);
  return result;
};

exports.getEventStatistics = async () => {
  const [totalEvents] = await db.query('SELECT COUNT(*) as total FROM eventos');
  const [totalGuests] = await db.query('SELECT COUNT(*) as total FROM convidados');
  const [guestStatus] = await db.query(`
    SELECT 
      SUM(CASE WHEN status = 'aceito' THEN 1 ELSE 0 END) as aceitos,
      SUM(CASE WHEN status = 'rejeitado' THEN 1 ELSE 0 END) as rejeitados,
      SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes
    FROM convidados
  `);

  return {
    totalEvents: totalEvents[0].total,
    totalGuests: totalGuests[0].total,
    acceptedInvitations: guestStatus[0].aceitos || 0,
    rejectedInvitations: guestStatus[0].rejeitados || 0,
    pendingInvitations: guestStatus[0].pendentes || 0
  };
};