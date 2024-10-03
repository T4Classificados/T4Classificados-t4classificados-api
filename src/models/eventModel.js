const db = require('../config/database');
const crypto = require('crypto');

function generateEventLink() {
  return crypto.randomBytes(8).toString('hex');
}

exports.createEvent = async (nome, data, local, tipo, imagem, userId) => {
  const eventLink = generateEventLink();
  const [result] = await db.query(
    'INSERT INTO eventos (nome, data, local, tipo, imagem, user_id, event_link) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nome, data, local, tipo, imagem, userId, eventLink]
  );
  return { ...result, eventLink };
};

exports.getAllEvents = async () => {
  const [rows] = await db.query(`
    SELECT e.*, u.nome as user_nome, u.sobrenome as user_sobrenome, u.telefone as user_telefone
    FROM eventos e
    JOIN usuarios u ON e.user_id = u.id
  `);
  return rows;
};

exports.getEventById = async (id) => {
  const [rows] = await db.query(`
    SELECT e.*, u.nome as user_nome, u.sobrenome as user_sobrenome, u.telefone as user_telefone
    FROM eventos e
    JOIN usuarios u ON e.user_id = u.id
    WHERE e.id = ?
  `, [id]);
  console.log('Resultado da consulta getEventById:', rows); // Adicione este log
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

exports.getUserEventStatistics = async (userId) => {
  const [totalEvents] = await db.query('SELECT COUNT(*) as total FROM eventos WHERE user_id = ?', [userId]);
  const [totalGuests] = await db.query(`
    SELECT COUNT(*) as total 
    FROM convidados c
    JOIN eventos e ON c.evento_id = e.id
    WHERE e.user_id = ?
  `, [userId]);
  const [guestStatus] = await db.query(`
    SELECT 
      SUM(CASE WHEN c.status = 'aceito' THEN 1 ELSE 0 END) as aceitos,
      SUM(CASE WHEN c.status = 'rejeitado' THEN 1 ELSE 0 END) as rejeitados,
      SUM(CASE WHEN c.status = 'pendente' THEN 1 ELSE 0 END) as pendentes
    FROM convidados c
    JOIN eventos e ON c.evento_id = e.id
    WHERE e.user_id = ?
  `, [userId]);

  return {
    totalEvents: totalEvents[0].total,
    totalGuests: totalGuests[0].total,
    acceptedInvitations: guestStatus[0].aceitos || 0,
    rejectedInvitations: guestStatus[0].rejeitados || 0,
    pendingInvitations: guestStatus[0].pendentes || 0
  };
};

exports.getEventByLink = async (eventLink) => {
  const [rows] = await db.query(`
    SELECT e.*, u.nome as user_nome, u.sobrenome as user_sobrenome, u.telefone as user_telefone
    FROM eventos e
    JOIN usuarios u ON e.user_id = u.id
    WHERE e.event_link = ?
  `, [eventLink]);
  return rows[0];
};

exports.getEventsByUserId = async (userId) => {
  const [rows] = await db.query('SELECT * FROM eventos WHERE user_id = ?', [userId]);
  return rows;
};

exports.getUserEventById = async (userId, eventId) => {
  const [rows] = await db.query('SELECT * FROM eventos WHERE id = ? AND user_id = ?', [eventId, userId]);
  return rows[0];
};

exports.updateUserEvent = async (userId, eventId, eventData) => {
  const { nome, data, local, tipo, imagem } = eventData;
  const query = 'UPDATE eventos SET nome = ?, data = ?, local = ?, tipo = ?, imagem = ? WHERE id = ? AND user_id = ?';
  const params = [nome, data, local, tipo, imagem, eventId, userId];
  const [result] = await db.query(query, params);
  return result;
};

exports.deleteUserEvent = async (userId, eventId) => {
  const [result] = await db.query('DELETE FROM eventos WHERE id = ? AND user_id = ?', [eventId, userId]);
  return result;
};

exports.checkGuestByEventAndPhone = async (eventId, telefone) => {
  const [rows] = await db.query(
    'SELECT * FROM convidados WHERE evento_id = ? AND telefone = ?',
    [eventId, telefone]
  );
  return rows[0];
};

exports.checkGuestByEventLinkAndPhone = async (eventLink, telefone) => {
  const [rows] = await db.query(
    'SELECT c.* FROM convidados c JOIN eventos e ON c.evento_id = e.id WHERE e.event_link = ? AND c.telefone = ?',
    [eventLink, telefone]
  );
  return rows[0];
};