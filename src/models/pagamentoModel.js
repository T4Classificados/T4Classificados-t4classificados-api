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
                    status,
                    product_id,
                    user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    tipo,
                    referenciaId,
                    pagamento.transaction_id,
                    pagamento.amount,
                    pagamento.status || 'pago',
                    pagamento.product_id || null,
                    pagamento.user_id || null
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
                `SELECT p.*, c.nome as campanha_nome 
                FROM pagamentos p
                LEFT JOIN campanhas c ON p.product_id = c.id
                WHERE p.tipo = ? AND p.referencia_id = ? 
                ORDER BY p.created_at DESC`,
                [tipo, referenciaId]
            );

            return rows.map(row => ({
                ...row,
                custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null,
                produto: row.product_id ? {
                    id: row.product_id,
                    nome: row.campanha_nome
                } : null
            }));
        } catch (error) {
            throw error;
        }
    }

    static async obterPorTransactionId(transactionId) {
        try {
            const [rows] = await db.query(
                `SELECT p.*, c.nome as campanha_nome 
                FROM pagamentos p
                LEFT JOIN campanhas c ON p.product_id = c.id
                WHERE p.transaction_id = ?`,
                [transactionId]
            );

            if (rows.length === 0) return null;

            const pagamento = rows[0];
            return {
                ...pagamento,
                custom_fields: pagamento.custom_fields ? JSON.parse(pagamento.custom_fields) : null,
                produto: pagamento.product_id ? {
                    id: pagamento.product_id,
                    nome: pagamento.campanha_nome
                } : null
            };
        } catch (error) {
            throw error;
        }
    }

    static async listarPorProduto(productId) {
        try {
            const [rows] = await db.query(
                `SELECT p.*, c.nome as campanha_nome 
                FROM pagamentos p
                LEFT JOIN campanhas c ON p.product_id = c.id
                WHERE p.product_id = ?
                ORDER BY p.created_at DESC`,
                [productId]
            );

            return rows.map(row => ({
                ...row,
                custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null,
                produto: {
                    id: row.product_id,
                    nome: row.campanha_nome
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    static async listarPorUsuario(userId) {
        try {
            const [rows] = await db.query(
                `SELECT p.*, c.nome as campanha_nome,
                    u.nome as usuario_nome, u.telefone as usuario_telefone, u.sobrenome as usuario_sobrenome,
                    e.nome as empresa_nome, e.nif as empresa_nif, e.logo_url as empresa_logo
                FROM pagamentos p
                LEFT JOIN campanhas c ON p.product_id = c.id
                LEFT JOIN usuarios u ON p.user_id = u.id
                LEFT JOIN empresas e ON u.empresa_id = e.id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC`,
                [userId]
            );

            return rows.map(row => ({
                ...row,
                custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null,
                produto: row.product_id ? {
                    id: row.product_id,
                    nome: row.campanha_nome
                } : null,
                usuario: row.user_id ? {
                    id: row.user_id,
                    nome: row.usuario_nome,
                    sobrenome: row.usuario_sobrenome,
                    telefone: row.usuario_telefone,
                    empresa: row.empresa_nome ? {
                        nome: row.empresa_nome,
                        nif: row.empresa_nif,
                        logo_url: row.empresa_logo
                    } : null
                } : null
            }));
        } catch (error) {
            throw error;
        }
    }

    static async getTotalPagamentos() {
        const [rows] = await db.query(
            `SELECT COUNT(*) as total
     FROM pagamentos p
     LEFT JOIN campanhas c ON p.product_id = c.id
     LEFT JOIN usuarios u ON p.user_id = u.id
     LEFT JOIN empresas e ON u.empresa_id = e.id`
        );

        return rows[0]?.total || 0;
    }

    static async listarTodos() {
        try {
            const [rows] = await db.query(
                `SELECT p.*, c.nome as campanha_nome,
                    u.nome as usuario_nome, u.telefone as usuario_telefone, u.sobrenome as usuario_sobrenome,
                    e.nome as empresa_nome, e.nif as empresa_nif, e.logo_url as empresa_logo
                FROM pagamentos p
                LEFT JOIN campanhas c ON p.product_id = c.id
                LEFT JOIN usuarios u ON p.user_id = u.id
                LEFT JOIN empresas e ON u.empresa_id = e.id
                ORDER BY p.created_at DESC`
            );

            return rows.map(row => ({
                ...row,
                custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null,
                produto: row.product_id ? {
                    id: row.product_id,
                    nome: row.campanha_nome
                } : null,
                usuario: row.user_id ? {
                    id: row.user_id,
                    nome: row.usuario_nome,
                    sobrenome: row.usuario_sobrenome,
                    telefone: row.usuario_telefone,
                    empresa: row.empresa_nome ? {
                        nome: row.empresa_nome,
                        nif: row.empresa_nif,
                        logo_url: row.empresa_logo
                    } : null
                } : null
            }));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PagamentoModel; 