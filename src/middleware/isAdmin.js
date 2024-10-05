module.exports = (req, res, next) => {
  if (req.userData && req.userData.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
  }
};