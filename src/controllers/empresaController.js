const EmpresaModel = require('../models/empresaModel');
const UsuarioModel = require('../models/usuarioModel');
const { uploadImagens } = require('../utils/upload');
const db = require('../config/database');

class EmpresaController {
    static async vincularEmpresa(req, res) {
        try {
            // Verifica se o usuário já tem conta afiliada
            const [usuario] = await db.query(
                'SELECT conta_afiliada_id FROM usuarios WHERE id = ?',
                [req.user.id]
            );

            if (usuario[0]?.conta_afiliada_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuários com conta afiliada não podem vincular empresa'
                });
            }

            // Verifica se já existe empresa com este NIF
            const empresaExistente = await EmpresaModel.obterPorNif(req.body.nif);
            if (empresaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Já existe uma empresa cadastrada com este NIF'
                });
            }

            const logo = req.files?.logo ? await uploadImagens([req.files.logo[0]]) : null;
            
            // Cria nova empresa
            const empresaId = await EmpresaModel.criar({
                nome: req.body.nome,
                nif: req.body.nif,
                logo_url: logo ? logo[0] : null
            });

            // Vincula empresa ao usuário
            await UsuarioModel.atualizarEmpresa(req.user.id, empresaId);

            // Busca os dados atualizados
            const empresa = await EmpresaModel.obterPorId(empresaId);

            res.status(201).json({
                success: true,
                message: 'Empresa vinculada com sucesso',
                data: empresa
            });
        } catch (error) {
            console.error('Erro ao vincular empresa:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao vincular empresa',
                error: error.message
            });
        }
    }
}

module.exports = EmpresaController; 