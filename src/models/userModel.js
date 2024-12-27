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

exports.listarAdmin = async (page = 1, limit = 10, status = 'todos', search = '') => {
    try {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [];

        // Filtro de status
        if (status !== 'todos') {
            whereClause += ' AND u.status = ?';
            params.push(status);
        }

        // Filtro de busca
        if (search) {
            whereClause += ` AND (
                u.nome LIKE ? OR 
                u.telefone LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Query principal
        const [usuarios] = await db.query(
            `SELECT 
                u.id,
                u.nome,
                u.sobrenome,
                u.telefone,
                u.provincia,
                u.municipio,
                u.role,
                u.is_active,
                u.created_at,
                e.nome as empresa_nome,
                e.nif as empresa_nif,
                e.logo_url as empresa_logo,
                ca.iban as conta_afiliada_iban
            FROM usuarios u
            LEFT JOIN empresas e ON u.empresa_id = e.id
            LEFT JOIN contas_afiliadas ca ON u.conta_afiliada_id = ca.id
            WHERE 1=1 ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        // Contagem total para paginação
        const [total] = await db.query(
            `SELECT COUNT(*) as total 
            FROM usuarios u 
            WHERE 1=1 ${whereClause}`,
            params
        );

        // Formatar URLs e estruturar dados
        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
        const usuariosFormatados = usuarios.map(usuario => ({
            id: usuario.id,
            nome: usuario.nome,
            sobrenome: usuario.sobrenome,
            telefone: usuario.telefone,
            provincia: usuario.provincia,
            municipio: usuario.municipio,
            role: usuario.role,
            is_active: usuario.is_active,
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
                total: total[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total[0].total / limit)
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