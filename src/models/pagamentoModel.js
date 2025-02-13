const db = require('../config/database');

class PagamentoModel {
    static async registrar(tipo, referenciaId, pagamento) {
        try {
            const [result] = await db.query(
                `INSERT INTO pagamentos (
                    tipo,
                    referencia_id,
                    transaction_id,
                    amount,
                    status
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    tipo,
                    referenciaId,
                    pagamento.transaction_id,
                    pagamento.amount,
                    pagamento.status || 'pago'
                ]
            );

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obterPorReferencia(tipo, referenciaId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM pagamentos WHERE tipo = ? AND referencia_id = ? ORDER BY created_at DESC',
                [tipo, referenciaId]
            );

            return rows.map(row => ({
                ...row,
                custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null
            }));
        } catch (error) {
            throw error;
        }
    }

    static async obterPorTransactionId(transactionId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM pagamentos WHERE transaction_id = ?',
                [transactionId]
            );

            if (rows.length === 0) return null;

            const pagamento = rows[0];
            return {
                ...pagamento,
                custom_fields: pagamento.custom_fields ? JSON.parse(pagamento.custom_fields) : null
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PagamentoModel; 