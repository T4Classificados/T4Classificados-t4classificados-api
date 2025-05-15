const db = require('../config/database');

class EmpresaModel {
    static async criar(empresa) {
        try {
            const [result] = await db.query(
                'INSERT INTO empresas (nome, nif, logo_url) VALUES (?, ?, ?)',
                [empresa.nome, empresa.nif, empresa.logo_url]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async atualizar(id, empresa) {
        try {
            await db.query(
                `UPDATE empresas SET 
                    nome = COALESCE(?, nome),
                    nif = COALESCE(?, nif),
                    logo_url = COALESCE(?, logo_url)
                WHERE id = ?`,
                [empresa.nome, empresa.nif, empresa.logo_url, id]
            );

            const [empresaAtualizada] = await db.query(
                'SELECT * FROM empresas WHERE id = ?',
                [id]
            );

            if (empresaAtualizada.length === 0) {
                return null;
            }

            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return {
                ...empresaAtualizada[0],
                logo_url: empresaAtualizada[0].logo_url ? `${baseUrl}${empresaAtualizada[0].logo_url}` : null
            };
        } catch (error) {
            throw error;
        }
    }

    static async obterPorId(id) {
        try {
            const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
            if (rows.length === 0) return null;

            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            return {
                ...rows[0],
                logo_url: rows[0].logo_url ? `${baseUrl}${rows[0].logo_url}` : null
            };
        } catch (error) {
            throw error;
        }
    }

    static async obterPorNif(nif) {
        try {
            const [rows] = await db.query('SELECT * FROM empresas WHERE nif = ?', [nif]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = EmpresaModel; 