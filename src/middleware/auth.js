const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('Auth Middleware - Headers:', req.headers); // Log para debug
  try {
    // Verificar se o header Authorization existe
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader); // Log para debug
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Acesso negado. Nenhum utilizador autenticado.',
        code: 'NO_TOKEN'
      });
    }

    // Verificar se o formato do token está correto
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Formato de token inválido',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar se o token é válido
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar informações do usuário ao request
    req.userData = { 
      userId: decodedToken.userId, 
      role: decodedToken.role 
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Autenticação falhou - Token inválido ou expirado',
      code: 'INVALID_TOKEN'
    });
  }
};