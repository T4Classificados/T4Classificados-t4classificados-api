const db = require('../config/database');

class PagamentoCampanhaModel {
    static async registrar(pagamento) {
        try {
            const [result] = await db.query(
                `INSERT INTO pagamentos_campanha (
                    campanha_id,
                    transaction_id,
                    amount,
                    fee,
                    entity_id,
                    terminal_id,
                    terminal_location,
                    terminal_type,
                    datetime,
                    period_start_datetime,
                    period_end_datetime,
                    parameter_id,
                    period_id,
                    product_id,
                    terminal_period_id,
                    terminal_transaction_id,
                    custom_fields
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pagamento.reference_id,
                    pagamento.transaction_id,
                    pagamento.amount,
                    pagamento.fee,
                    pagamento.entity_id,
                    pagamento.terminal_id,
                    pagamento.terminal_location,
                    pagamento.terminal_type,
                    pagamento.datetime,
                    pagamento.period_start_datetime,
                    pagamento.period_end_datetime,
                    pagamento.parameter_id,
                    pagamento.period_id,
                    pagamento.product_id,
                    pagamento.terminal_period_id,
                    pagamento.terminal_transaction_id,
                    JSON.stringify(pagamento.custom_fields)
                ]
            );

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obterPorCampanha(campanhaId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM pagamentos_campanha WHERE campanha_id = ? ORDER BY created_at DESC',
                [campanhaId]
            );

            return rows.map(row => ({
                ...row,
                custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null
            }));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PagamentoCampanhaModel; 