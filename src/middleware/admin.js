const db = require('../config/database');

const isAdmin = async (req, res, next) => {
  console.log('=== Verificando permissões de admin ===');
  
  try {
    if (!req.userData || !req.userData.userId) {
      console.log('Usuário não autenticado');
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const [rows] = await db.query(
      'SELECT tipo FROM usuarios WHERE id = ?',
      [req.userData.userId]
    );

    if (!rows[0] || rows[0].tipo !== 'admin') {
      console.log('Usuário não é admin:', req.userData.userId);
      return res.status(403).json({ message: 'Acesso negado' });
    }

    console.log('Usuário é admin:', req.userData.userId);
    next();
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    res.status(500).json({ message: 'Erro ao verificar permissões' });
  }
};

module.exports = isAdmin; 