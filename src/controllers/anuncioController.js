const anuncioModel = require('../models/anuncioModel');
const fs = require('fs').promises;
const path = require('path');

exports.createAnuncio = async (req, res) => {
  try {
    const {
      titulo,
      categoria,
      modalidade,
      descricao,
      visibilidade,
      disponivel_whatsapp
    } = req.body;

    const userId = req.userData.userId;
    
    // Processar imagens
    const imagens = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const anuncioId = await anuncioModel.createAnuncio(
      titulo,
      categoria,
      modalidade,
      descricao,
      visibilidade,
      disponivel_whatsapp === 'true',
      imagens,
      userId
    );

    res.status(201).json({
      message: 'Anúncio criado com sucesso',
      anuncioId
    });
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    res.status(500).json({ message: 'Erro ao criar anúncio' });
  }
};

exports.getAnuncios = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      categoria,
      modalidade,
      userId 
    } = req.query;

    const filters = {
      categoria,
      modalidade,
      userId
    };

    const anuncios = await anuncioModel.getAnuncios(filters, parseInt(page), parseInt(limit));
    res.json(anuncios);
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    res.status(500).json({ message: 'Erro ao buscar anúncios' });
  }
};

exports.getAnuncioById = async (req, res) => {
  try {
    const anuncio = await anuncioModel.getAnuncioById(req.params.id);
    
    if (!anuncio) {
      return res.status(404).json({ message: 'Anúncio não encontrado' });
    }

    res.json(anuncio);
  } catch (error) {
    console.error('Erro ao buscar anúncio:', error);
    res.status(500).json({ message: 'Erro ao buscar anúncio' });
  }
};

exports.updateAnuncio = async (req, res) => {
  try {
    const anuncioId = req.params.id;
    const userId = req.userData.userId;
    const updateData = req.body;

    const success = await anuncioModel.updateAnuncio(anuncioId, userId, updateData);

    if (!success) {
      return res.status(404).json({ message: 'Anúncio não encontrado ou sem permissão' });
    }

    res.json({ message: 'Anúncio atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    res.status(500).json({ message: 'Erro ao atualizar anúncio' });
  }
};

exports.deleteAnuncio = async (req, res) => {
  try {
    const anuncioId = req.params.id;
    const userId = req.userData.userId;

    // Buscar anúncio para obter imagens
    const anuncio = await anuncioModel.getAnuncioById(anuncioId);
    if (!anuncio) {
      return res.status(404).json({ message: 'Anúncio não encontrado' });
    }

    const success = await anuncioModel.deleteAnuncio(anuncioId, userId);

    if (!success) {
      return res.status(404).json({ message: 'Anúncio não encontrado ou sem permissão' });
    }

    // Deletar arquivos de imagem
    if (anuncio.imagens) {
      for (const imagemUrl of anuncio.imagens) {
        const imagemPath = path.join(__dirname, '../../', imagemUrl);
        try {
          await fs.unlink(imagemPath);
        } catch (err) {
          console.error('Erro ao deletar imagem:', err);
        }
      }
    }

    res.json({ message: 'Anúncio deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar anúncio:', error);
    res.status(500).json({ message: 'Erro ao deletar anúncio' });
  }
};

exports.getAnunciosPublic = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      categoria: req.query.categoria,
      modalidade: req.query.modalidade,
      visibilidade: 'publico' // Garante que só retorna anúncios públicos
    };

    const anuncios = await anuncioModel.getAnuncios(filters, page, limit);

    res.json({
      message: 'Anúncios obtidos com sucesso',
      data: anuncios,
      pagination: {
        page,
        limit,
        total: anuncios.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar anúncios:', error);
    res.status(500).json({ message: 'Erro ao listar anúncios' });
  }
}; 