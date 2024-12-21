const publicidadeModel = require('../models/publicidadeModel');

exports.getPublicidades = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filtros = {
      periodo: req.query.periodo, // ativas, pendentes, encerradas
      status: req.query.status
    };

    const { publicidades, total } = await publicidadeModel.getPublicidadesAnunciante(
      userId,
      filtros,
      page,
      limit
    );

    res.json({
      message: 'Publicidades obtidas com sucesso',
      data: publicidades,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar publicidades:', error);
    res.status(500).json({ message: 'Erro ao listar publicidades' });
  }
};

exports.getDesempenhoCampanha = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = 'total' } = req.query;
    const userId = req.userData.userId;

    // Verificar se a publicidade pertence ao usuário
    const publicidade = await publicidadeModel.getPublicidadeById(id);
    if (!publicidade || publicidade.user_id !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const desempenho = await publicidadeModel.getDesempenhoCampanha(id, periodo);

    res.json({
      message: 'Desempenho obtido com sucesso',
      data: desempenho
    });
  } catch (error) {
    console.error('Erro ao obter desempenho:', error);
    res.status(500).json({ message: 'Erro ao obter desempenho' });
  }
};

exports.renovarCampanha = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData.userId;
    const {
      plafond_adicional,
      nova_data_fim,
      plafond_diario
    } = req.body;

    // Validações
    if (nova_data_fim) {
      const dataFim = new Date(nova_data_fim);
      const hoje = new Date();
      if (dataFim <= hoje) {
        return res.status(400).json({ 
          message: 'Nova data de término deve ser futura' 
        });
      }
    }

    if (plafond_adicional && plafond_adicional <= 0) {
      return res.status(400).json({ 
        message: 'Plafond adicional deve ser maior que zero' 
      });
    }

    const success = await publicidadeModel.renovarCampanha(id, userId, {
      plafond_adicional,
      nova_data_fim,
      plafond_diario
    });

    res.json({
      message: 'Campanha renovada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao renovar campanha:', error);
    res.status(500).json({ 
      message: error.message || 'Erro ao renovar campanha' 
    });
  }
}; 