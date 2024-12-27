const db = require('../config/database');

class ContaAfiliadaModel {
    static async criar(contaAfiliada) {
        try {
            const [result] = await db.query(
                'INSERT INTO contas_afiliadas (bi, iban) VALUES (?, ?)',
                [contaAfiliada.bi, contaAfiliada.iban]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async atualizar(id, contaAfiliada) {
        try {
            await db.query(
                `UPDATE contas_afiliadas SET 
                    bi = COALESCE(?, bi),
                    iban = COALESCE(?, iban)
                WHERE id = ?`,
                [contaAfiliada.bi, contaAfiliada.iban, id]
            );

            const [contaAtualizada] = await db.query(
                'SELECT * FROM contas_afiliadas WHERE id = ?',
                [id]
            );

            return contaAtualizada[0];
        } catch (error) {
            throw error;
        }
    }

    static async obterPorId(id) {
        try {
            const [rows] = await db.query('SELECT * FROM contas_afiliadas WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async obterPorBi(bi) {
        try {
            const [rows] = await db.query('SELECT * FROM contas_afiliadas WHERE bi = ?', [bi]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ContaAfiliadaModel; 