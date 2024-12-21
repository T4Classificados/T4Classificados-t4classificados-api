const denunciaModel = require('../models/denunciaModel');
const anuncioModel = require('../models/anuncioModel');

exports.criarDenuncia = async (req, res) => {
  try {
    const { anuncio_id, motivo, descricao } = req.body;

    // Validações básicas
    if (!anuncio_id || !motivo) {
      return res.status(400).json({
        success: false,
        message: 'ID do anúncio e motivo são obrigatórios'
      });
    }

    // Verificar se o anúncio existe
    const anuncio = await anuncioModel.getAnuncioById(anuncio_id);
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anúncio não encontrado'
      });
    }

    const denunciaId = await denunciaModel.criarDenuncia({
      anuncio_id,
      motivo,
      descricao
    });

    res.status(201).json({
      success: true,
      message: 'Denúncia registrada com sucesso',
      data: {
        id: denunciaId,
        anuncio_id,
        motivo,
        descricao,
        status: 'pendente'
      }
    });
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar denúncia'
    });
  }
};

exports.getDenunciasPorAnuncio = async (req, res) => {
  try {
    const { anuncioId } = req.params;
    const denuncias = await denunciaModel.getDenunciasPorAnuncio(anuncioId);

    res.json({
      success: true,
      data: denuncias
    });
  } catch (error) {
    console.error('Erro ao buscar denúncias do anúncio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar denúncias do anúncio'
    });
  }
};

exports.listarDenuncias = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const { denuncias, total } = await denunciaModel.listarDenuncias({
      status,
      page,
      limit
    });

    res.json({
      success: true,
      data: denuncias,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar denúncias'
    });
  }
}; 