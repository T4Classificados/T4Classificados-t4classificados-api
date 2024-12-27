const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Não autenticado'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Garantir que o role seja incluído
        req.userData = {
            userId: decoded.userId,
            telefone: decoded.telefone,
            role: decoded.role || 'user'
        };

        // Manter compatibilidade com código existente
        req.user = {
            id: decoded.userId,
            telefone: decoded.telefone,
            role: decoded.role || 'user'
        };

        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
        });
    }
};