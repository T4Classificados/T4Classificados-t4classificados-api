const ContaAfiliadaModel = require('../models/contaAfiliadaModel');
const UsuarioModel = require('../models/usuarioModel');
const db = require('../config/database');

class ContaAfiliadaController {
    static async vincularConta(req, res) {
        try {
            // Verifica se o usuário já tem empresa
            const [usuario] = await db.query(
                'SELECT empresa_id FROM usuarios WHERE id = ?',
                [req.user.id]
            );

            if (usuario[0]?.empresa_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuários com empresa vinculada não podem criar conta afiliada'
                });
            }

            // Verifica se já existe conta com este BI
            const contaExistente = await ContaAfiliadaModel.obterPorBi(req.body.bi);
            if (contaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Já existe uma conta afiliada com este BI'
                });
            }

            // Cria nova conta afiliada
            const contaId = await ContaAfiliadaModel.criar({
                bi: req.body.bi,
                iban: req.body.iban
            });

            // Vincula conta ao usuário
            await UsuarioModel.atualizarContaAfiliada(req.user.id, contaId);

            // Busca os dados atualizados
            const conta = await ContaAfiliadaModel.obterPorId(contaId);

            res.status(201).json({
                success: true,
                message: 'Conta afiliada vinculada com sucesso',
                data: conta
            });
        } catch (error) {
            console.error('Erro ao vincular conta afiliada:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao vincular conta afiliada',
                error: error.message
            });
        }
    }
}

module.exports = ContaAfiliadaController; 