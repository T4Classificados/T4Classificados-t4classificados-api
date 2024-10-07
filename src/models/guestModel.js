const db = require('../config/database');
const crypto = require('crypto');

function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.createGuest = async (nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken) => {
  const randomCode = generateRandomCode();
  const [result] = await db.query(
    'INSERT INTO convidados (nome, telefone, acompanhante, numero_acompanhantes, tipo_acompanhante, evento_id, confirmation_token, status, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken, 'pendente', randomCode]
  );
  return { ...result, randomCode };
};

exports.getAllGuests = async () => {
  const [rows] = await db.query('SELECT * FROM convidados ORDER BY id DESC');
  return rows;
};

exports.getGuestById = async (id) => {
  const [rows] = await db.query('SELECT * FROM convidados WHERE id = ? ORDER BY id DESC', [id]);
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
  const [rows] = await db.query('SELECT * FROM convidados WHERE confirmation_token = ? ORDER BY id DESC', [token]);
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

exports.getGuestsByUserId = async (userId) => {
  if (!userId) {
    throw new Error('ID do usuário não fornecido');
  }

  const query = `
    SELECT c.*, e.nome AS evento_nome, e.event_link, e.privacidade
    FROM convidados c
    JOIN eventos e ON c.evento_id = e.id
    WHERE e.user_id = ?
    ORDER BY c.id DESC
  `;
  console.log('Executando query:', query);
  console.log('UserId:', userId);

  const [rows] = await db.query(query, [userId]);
  console.log('Resultados da query:', rows);
  return rows;
};

exports.createGuestForUser = async (userId, guestData) => {
  const { nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken } = guestData;
  const randomCode = generateRandomCode();
  const [result] = await db.query(
    'INSERT INTO convidados (nome, telefone, acompanhante, numero_acompanhantes, tipo_acompanhante, evento_id, confirmation_token, status, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken, 'pendente', randomCode]
  );
  return { ...result, randomCode };
};

exports.getGuestByIdAndUserId = async (guestId, userId) => {
  const [rows] = await db.query(`
    SELECT c.*, e.nome as evento_nome, e.data as evento_data, e.local as evento_local
    FROM convidados c
    JOIN eventos e ON c.evento_id = e.id
    WHERE c.id = ? AND e.user_id = ?
  `, [guestId, userId]);
  return rows[0];
};

exports.updateGuestForUser = async (guestId, userId, guestData) => {
  // Primeiro, obtenha os dados atuais do convidado
  const currentGuest = await exports.getGuestByIdAndUserId(guestId, userId);
  
  if (!currentGuest) {
    throw new Error('Guest not found or does not belong to the user');
  }

  // Mescle os dados atuais com os novos dados fornecidos
  const updatedData = {
    nome: guestData.nome || currentGuest.nome,
    telefone: guestData.telefone || currentGuest.telefone,
    acompanhante: guestData.acompanhante !== undefined ? guestData.acompanhante : currentGuest.acompanhante,
    numeroAcompanhantes: guestData.numeroAcompanhantes !== undefined ? guestData.numeroAcompanhantes : currentGuest.numero_acompanhantes,
    tipoAcompanhante: guestData.tipoAcompanhante || currentGuest.tipo_acompanhante,
    eventoId: guestData.eventoId || currentGuest.evento_id,
    status: guestData.status || currentGuest.status
  };

  const [result] = await db.query(
    `UPDATE convidados c
     JOIN eventos e ON c.evento_id = e.id
     SET c.nome = ?, c.telefone = ?, c.acompanhante = ?, c.numero_acompanhantes = ?, 
         c.tipo_acompanhante = ?, c.evento_id = ?, c.status = ?
     WHERE c.id = ? AND e.user_id = ?`,
    [updatedData.nome, updatedData.telefone, updatedData.acompanhante, updatedData.numeroAcompanhantes, 
     updatedData.tipoAcompanhante, updatedData.eventoId, updatedData.status, guestId, userId]
  );
  
  return result;
};

exports.deleteGuestForUser = async (guestId, userId) => {
  const [result] = await db.query(
    `DELETE c FROM convidados c
     JOIN eventos e ON c.evento_id = e.id
     WHERE c.id = ? AND e.user_id = ?`,
    [guestId, userId]
  );
  return result;
};

exports.getEventByIdAndUserId = async (eventId, userId) => {
  const [rows] = await db.query('SELECT * FROM eventos WHERE id = ? AND user_id = ?', [eventId, userId]);
  return rows[0];
};

exports.updateEventForUser = async (eventId, userId, eventData) => {
  // Primeiro, obtenha os dados atuais do evento
  const currentEvent = await exports.getEventByIdAndUserId(eventId, userId);
  
  if (!currentEvent) {
    throw new Error('Event not found or does not belong to the user');
  }

  // Mescle os dados atuais com os novos dados fornecidos
  const updatedData = {
    nome: eventData.nome || currentEvent.nome,
    data: eventData.data || currentEvent.data,
    local: eventData.local || currentEvent.local,
    descricao: eventData.descricao || currentEvent.descricao,
    // Adicione outros campos do evento conforme necessário
  };

  const [result] = await db.query(
    `UPDATE eventos
     SET nome = ?, data = ?, local = ?, descricao = ?
     WHERE id = ? AND user_id = ?`,
    [updatedData.nome, updatedData.data, updatedData.local, updatedData.descricao, eventId, userId]
  );
  
  return result;
};

exports.validateGuestCode = async (telefone, codigo) => {
  const [rows] = await db.query(
    'SELECT * FROM convidados WHERE telefone = ? AND codigo = ?',
    [telefone, codigo]
  );
  return rows[0];
};