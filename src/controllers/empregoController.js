const empregoModel = require('../models/empregoModel');

exports.getEmpregos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      categoria: req.query.categoria,
      modalidade: req.query.modalidade
    };

    const empregos = await empregoModel.getEmpregos(filters, page, limit);

    res.json({
      message: 'Empregos obtidos com sucesso',
      data: empregos
    });
  } catch (error) {
    console.error('Erro ao listar empregos:', error);
    res.status(500).json({ message: 'Erro ao listar empregos' });
  }
};

exports.getEmpregoById = async (req, res) => {
  try {
    const emprego = await empregoModel.getEmpregoById(req.params.id);
    
    if (!emprego) {
      return res.status(404).json({ message: 'Emprego não encontrado' });
    }

    res.json({
      message: 'Emprego obtido com sucesso',
      data: emprego
    });
  } catch (error) {
    console.error('Erro ao obter emprego:', error);
    res.status(500).json({ message: 'Erro ao obter emprego' });
  }
};

exports.createEmprego = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const empregoId = await empregoModel.createEmprego(userId, req.body);
    const emprego = await empregoModel.getEmpregoById(empregoId);

    res.status(201).json({
      message: 'Emprego criado com sucesso',
      data: emprego
    });
  } catch (error) {
    console.error('Erro ao criar emprego:', error);
    res.status(500).json({ message: 'Erro ao criar emprego' });
  }
};

exports.updateEmprego = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const empregoId = req.params.id;
    
    const success = await empregoModel.updateEmprego(empregoId, userId, req.body);
    
    if (!success) {
      return res.status(404).json({ message: 'Emprego não encontrado ou sem permissão' });
    }

    const emprego = await empregoModel.getEmpregoById(empregoId);

    res.json({
      message: 'Emprego atualizado com sucesso',
      data: emprego
    });
  } catch (error) {
    console.error('Erro ao atualizar emprego:', error);
    res.status(500).json({ message: 'Erro ao atualizar emprego' });
  }
};

exports.deleteEmprego = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const success = await empregoModel.deleteEmprego(req.params.id, userId);

    if (!success) {
      return res.status(404).json({ message: 'Emprego não encontrado ou sem permissão' });
    }

    res.json({ message: 'Emprego removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover emprego:', error);
    res.status(500).json({ message: 'Erro ao remover emprego' });
  }
};

exports.getEmpregosPublic = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      categoria: req.query.categoria,
      modalidade: req.query.modalidade,
      nivel_experiencia: req.query.nivel_experiencia
    };

    const empregos = await empregoModel.getEmpregos(filters, page, limit);

    res.json({
      message: 'Empregos obtidos com sucesso',
      data: empregos,
      pagination: {
        page,
        limit,
        total: empregos.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar empregos:', error);
    res.status(500).json({ message: 'Erro ao listar empregos' });
  }
}; 