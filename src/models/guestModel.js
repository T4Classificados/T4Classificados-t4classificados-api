const db = require('../config/database');
const crypto = require('crypto');

function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.createGuest = async (nome, telefone, acompanhantes, eventoId, confirmationToken) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await db.query(
      'INSERT INTO convidados (nome, telefone, evento_id, confirmation_token) VALUES (?, ?, ?, ?)',
      [nome, telefone, eventoId, confirmationToken]
    );

    const guestId = result.insertId;

    // Inserir acompanhantes apenas se houver algum
    if (acompanhantes && acompanhantes.length > 0) {
      const acompanhantesValues = acompanhantes.map(acompanhante => [guestId, acompanhante]);
      await db.query(
        'INSERT INTO acompanhantes (convidado_id, nome) VALUES ?',
        [acompanhantesValues]
      );
    }

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  const { nome, telefone, eventoId, status } = guestData;
  
  const query = `
    UPDATE convidados 
    SET nome = ?, telefone = ?, evento_id = ?, status = ? 
    WHERE id = ?
  `;
  const params = [nome, telefone, eventoId, status, id];

  const [result] = await db.query(query, params);
  return result;
};

exports.deleteGuest = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Primeiro, excluímos os acompanhantes
    await connection.query('DELETE FROM acompanhantes WHERE convidado_id = ?', [id]);

    // Em seguida, excluímos o convidado
    const [result] = await connection.query('DELETE FROM convidados WHERE id = ?', [id]);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

  const [guests] = await db.query(query, [userId]);

  // Buscar acompanhantes para cada convidado
  for (let guest of guests) {
    const [acompanhantes] = await db.query(
      'SELECT * FROM acompanhantes WHERE convidado_id = ?',
      [guest.id]
    );
    guest.acompanhantes = acompanhantes;
    guest.acompanhante = guest.acompanhante === 1; // Convertendo para booleano
  }

  return guests;
};

exports.createGuestForUser = async (userId, guestData) => {
  const { nome, telefone, acompanhantes, eventoId, confirmationToken } = guestData;
  const randomCode = generateRandomCode();
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO convidados (nome, telefone, evento_id, confirmation_token, status, codigo) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, telefone, eventoId, confirmationToken, 'pendente', randomCode]
    );

    const guestId = result.insertId;

    // Inserir acompanhantes apenas se houver algum
    if (acompanhantes && acompanhantes.length > 0) {
      const acompanhantesValues = acompanhantes.map(acompanhante => [guestId, acompanhante]);
      await connection.query(
        'INSERT INTO acompanhantes (convidado_id, nome) VALUES ?',
        [acompanhantesValues]
      );
    }

    await connection.commit();
    return { ...result, randomCode };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getGuestByIdAndUserId = async (guestId, userId) => {
  const [rows] = await db.query(`
    SELECT c.*, e.nome as evento_nome, e.data as evento_data, e.local as evento_local
    FROM convidados c
    JOIN eventos e ON c.evento_id = e.id
    WHERE c.id = ? AND e.user_id = ?
  `, [guestId, userId]);

  if (rows.length === 0) {
    return null;
  }

  const guest = rows[0];

  // Buscar acompanhantes para o convidado
  const [acompanhantes] = await db.query(
    'SELECT * FROM acompanhantes WHERE convidado_id = ?',
    [guestId]
  );
  guest.acompanhantes = acompanhantes;
  guest.acompanhante = guest.acompanhante === 1; // Convertendo para booleano

  return guest;
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
    eventoId: guestData.eventoId || currentGuest.evento_id,
    status: guestData.status || currentGuest.status,
    acompanhante: guestData.acompanhante !== undefined ? guestData.acompanhante : currentGuest.acompanhante
  };

  const [result] = await db.query(
    `UPDATE convidados c
     JOIN eventos e ON c.evento_id = e.id
     SET c.nome = ?, c.telefone = ?, c.evento_id = ?, c.status = ?, c.acompanhante = ?
     WHERE c.id = ? AND e.user_id = ?`,
    [updatedData.nome, updatedData.telefone, updatedData.eventoId, updatedData.status, updatedData.acompanhante, guestId, userId]
  );
  
  return result;
};

exports.deleteGuestForUser = async (guestId, userId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Primeiro, excluímos os acompanhantes
    await connection.query(
      `DELETE a FROM acompanhantes a
       JOIN convidados c ON a.convidado_id = c.id
       JOIN eventos e ON c.evento_id = e.id
       WHERE c.id = ? AND e.user_id = ?`,
      [guestId, userId]
    );

    // Em seguida, excluímos o convidado
    const [result] = await connection.query(
      `DELETE c FROM convidados c
       JOIN eventos e ON c.evento_id = e.id
       WHERE c.id = ? AND e.user_id = ?`,
      [guestId, userId]
    );

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

exports.addAccompanist = async (guestId, nome) => {
  const [result] = await db.query(
    'INSERT INTO acompanhantes (convidado_id, nome) VALUES (?, ?)',
    [guestId, nome]
  );
  return result;
};

exports.listAccompanists = async (guestId) => {
  const [rows] = await db.query(
    'SELECT * FROM acompanhantes WHERE convidado_id = ?',
    [guestId]
  );
  return rows;
};

exports.deleteAccompanist = async (guestId, accompanistId) => {
  const [result] = await db.query(
    'DELETE FROM acompanhantes WHERE id = ? AND convidado_id = ?',
    [accompanistId, guestId]
  );
  return result;
};

exports.deleteAllAccompanists = async (guestId) => {
  const [result] = await db.query(
    'DELETE FROM acompanhantes WHERE convidado_id = ?',
    [guestId]
  );
  return result;
};