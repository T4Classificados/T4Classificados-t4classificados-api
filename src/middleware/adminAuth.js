const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Verificar se o usuário está autenticado e tem role
        if (!req.userData || !req.userData.role) {
            return res.status(401).json({
                success: false,
                message: 'Não autenticado'
            });
        }

        // Verificar se é admin
        if (req.userData.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({
            success: false,
            message: 'Falha na autenticação'
        });
    }
}; 