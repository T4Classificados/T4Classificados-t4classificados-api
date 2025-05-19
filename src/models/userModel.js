const db = require('../config/database');

exports.createUser = async (nome, sobrenome, telefone, senha, provincia, municipio, role = 'user', confirmationCode, bilhete = null) => {
  const [result] = await db.query(
    'INSERT INTO usuarios (nome, sobrenome, telefone, senha, provincia, municipio, role, confirmation_code, is_active, bilhete) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, sobrenome, telefone, senha, provincia, municipio, role, confirmationCode, false, bilhete]
  );
  return result;
};

exports.getUserByTelefone = async (telefone) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE telefone = ?', [telefone]);
  return rows[0];
};

exports.getUserById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
        u.*,
        e.id as empresa_id,
        e.nome as empresa_nome,
        e.nif as empresa_nif,
        e.logo_url as empresa_logo
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

  return {
    ...user,
    foto_url: user.foto_url ? `${baseUrl}${user.foto_url}` : null
  };
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
  const allowedFields = ['nome', 'sobrenome', 'genero', 'provincia', 'municipio', 'role', 'bilhete'];

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

exports.listarAdmin = async (status = 'todos', search = '', page = 1, limit = 10) => {
  try {
    const safePage = Math.max(1, parseInt(page));
    const safeLimit = Math.max(1, parseInt(limit));
    const offset = (safePage - 1) * safeLimit;

    const whereConditions = [];
    const params = [];

    // Filtrar pelo campo is_active baseado no status
    if (status !== 'all') {
      // Mapear os valores em inglês para os valores numéricos
      let isActiveValue;
      if (status === 'active') {
        isActiveValue = 1;
      } else if (status === 'inactive') {
        isActiveValue = 0;
      } else {
        // Se for passado diretamente o valor numérico
        isActiveValue = Number(status);
      }

      // Verificar se o valor é válido (0 ou 1)
      if (isActiveValue === 1 || isActiveValue === 0) {
        whereConditions.push('u.is_active = ?');
        params.push(isActiveValue);
      } else {
        console.log('Valor de status inválido, ignorando filtro:', status);
      }
    }

    // Filtro de busca pelo nome ou telefone
    if (search) {
      const searchWords = search.toLowerCase().trim().split(/\s+/);
      const wordConditions = [];

      searchWords.forEach(() => {
        wordConditions.push(`(
        LOWER(CONCAT(u.nome, ' ', u.sobrenome)) COLLATE utf8mb4_unicode_ci LIKE ? OR
        LOWER(u.telefone) COLLATE utf8mb4_unicode_ci LIKE ?
      )`);
      });

      whereConditions.push(wordConditions.join(' AND '));

      searchWords.forEach(word => {
        const term = `%${word}%`;
        params.push(term, term);
      });
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const queryUsuarios = `
      SELECT 
        u.id, u.nome, u.sobrenome, u.telefone, u.provincia, u.municipio,
        u.genero, u.bilhete, u.role, u.is_active, u.foto_url, u.created_at,
        e.nome AS empresa_nome, e.nif AS empresa_nif, e.logo_url AS empresa_logo,
        ca.iban AS conta_afiliada_iban
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      LEFT JOIN contas_afiliadas ca ON u.conta_afiliada_id = ca.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryTotal = `
      SELECT COUNT(*) as total
      FROM usuarios u
      ${whereClause}
    `;

    const [usuarios] = await db.query(queryUsuarios, [...params, safeLimit, offset]);
    const [totalResult] = await db.query(queryTotal, params);
    const total = totalResult[0].total;

    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

    const usuariosFormatados = usuarios.map(usuario => ({
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      telefone: usuario.telefone,
      provincia: usuario.provincia,
      municipio: usuario.municipio,
      genero: usuario.genero,
      bilhete: usuario.bilhete,
      role: usuario.role,
      is_active: !!usuario.is_active,
      foto_url: usuario.foto_url ? `${baseUrl}${usuario.foto_url}` : null,
      created_at: usuario.created_at,
      empresa: usuario.empresa_nome ? {
        nome: usuario.empresa_nome,
        nif: usuario.empresa_nif,
        logo_url: usuario.empresa_logo ? `${baseUrl}${usuario.empresa_logo}` : null
      } : null,
      conta_afiliada: usuario.conta_afiliada_iban ? {
        iban: usuario.conta_afiliada_iban
      } : null
    }));

    return {
      usuarios: usuariosFormatados,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit)
      }
    };
  } catch (error) {
    throw error;
  }
};



exports.alterarStatus = async (id, is_active) => {
  try {
    const [result] = await db.query(
      'UPDATE usuarios SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

exports.atualizarFoto = async (userId, fotoUrl) => {
  try {
    const [result] = await db.query(
      'UPDATE usuarios SET foto_url = ? WHERE id = ?',
      [fotoUrl, userId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

exports.ativarConta = async (userId) => {
  const phone = `+244${userId}`
  try {
    const [result] = await db.query(
      `UPDATE usuarios 
            SET 
                is_active = true,
                data_pagamento_mensal = NOW()
            WHERE 
                telefone = ?`,
      [phone]
    );

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

exports.updatePaymentDate = async (userId, paymentDate) => {
  try {
    const [result] = await db.query(
      'UPDATE usuarios SET data_pagamento_mensal = ? WHERE id = ?',
      [paymentDate, userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erro ao atualizar data de pagamento:', error);
    throw error;
  }
};

exports.desativarUsuario = async (userId) => {
  try {
    const [result] = await db.query(
      'UPDATE usuarios SET is_active = false WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    throw error;
  }
};