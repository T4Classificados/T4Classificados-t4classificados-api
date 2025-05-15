const db = require('../config/database');

exports.getPreferences = async (userId) => {
  const [rows] = await db.query(
    'SELECT * FROM user_preferences WHERE user_id = ?',
    [userId]
  );
  return rows[0];
};

exports.createPreferences = async (userId, preferences) => {
  const { notificacoes_promocoes, alertas_emprego } = preferences;
  
  const [result] = await db.query(
    `INSERT INTO user_preferences 
     (user_id, notificacoes_promocoes, alertas_emprego) 
     VALUES (?, ?, ?)`,
    [userId, notificacoes_promocoes, alertas_emprego]
  );
  
  return result.insertId;
};

exports.updatePreferences = async (userId, preferences) => {
  const { notificacoes_promocoes, alertas_emprego } = preferences;
  
  const [result] = await db.query(
    `UPDATE user_preferences 
     SET notificacoes_promocoes = ?, 
         alertas_emprego = ?,
         updated_at = NOW()
     WHERE user_id = ?`,
    [notificacoes_promocoes, alertas_emprego, userId]
  );
  
  return result.affectedRows > 0;
};

exports.getOrCreate = async (userId) => {
  let preferences = await exports.getPreferences(userId);
  
  if (!preferences) {
    await exports.createPreferences(userId, {
      notificacoes_promocoes: false,
      alertas_emprego: false
    });
    preferences = await exports.getPreferences(userId);
  }
  
  return preferences;
}; 