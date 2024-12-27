const db = require('../config/database');

class UsuarioModel {
    static async atualizarEmpresa(userId, empresaId) {
        try {
            await db.query(
                'UPDATE usuarios SET empresa_id = ? WHERE id = ?',
                [empresaId, userId]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async atualizarContaAfiliada(userId, contaAfiliadaId) {
        try {
            await db.query(
                'UPDATE usuarios SET conta_afiliada_id = ? WHERE id = ?',
                [contaAfiliadaId, userId]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UsuarioModel; 