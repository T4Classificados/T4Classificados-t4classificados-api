const CatalogModel = require('../models/catalogModel');
const fs = require('fs').promises;
const path = require('path');

class CatalogController {
  async createCatalog(req, res) {
    try {
      const { link } = req.body;
      const image = req.file ? req.file.filename : null;

      if (!link || !image) {
        return res.status(400).json({ message: 'Link e imagem são obrigatórios' });
      }

      const result = await CatalogModel.createCatalog(link, image);

      res.status(201).json({
        message: 'Catálogo criado com sucesso',
        catalogId: result.insertId
      });
    } catch (error) {
      console.error('Erro ao criar catálogo:', error);
      res.status(500).json({ message: 'Erro ao criar catálogo' });
    }
  }

  async getAllCatalogs(req, res) {
    try {
      const catalogs = await CatalogModel.getAllCatalogs();
      res.json(catalogs);
    } catch (error) {
      console.error('Erro ao listar catálogos:', error);
      res.status(500).json({ message: 'Erro ao listar catálogos' });
    }
  }

  async updateCatalog(req, res) {
    try {
      const { id } = req.params;
      const { link } = req.body;
      const image = req.file ? req.file.filename : null;

      const catalog = await CatalogModel.getCatalogById(id);
      if (!catalog) {
        return res.status(404).json({ message: 'Catálogo não encontrado' });
      }

      // Se houver uma nova imagem, deletar a antiga
      if (image && catalog.image) {
        const oldImagePath = path.join(__dirname, '../../uploads', catalog.image);
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.error('Erro ao deletar imagem antiga:', error);
        }
      }

      const result = await CatalogModel.updateCatalog(
        id,
        link || catalog.link,
        image || catalog.image
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Catálogo não encontrado' });
      }

      res.json({ message: 'Catálogo atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar catálogo:', error);
      res.status(500).json({ message: 'Erro ao atualizar catálogo' });
    }
  }

  async updateCatalogStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido. Use "active" ou "inactive"' });
      }

      const catalog = await CatalogModel.getCatalogById(id);
      if (!catalog) {
        return res.status(404).json({ message: 'Catálogo não encontrado' });
      }

      const result = await CatalogModel.updateCatalogStatus(id, status);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Catálogo não encontrado' });
      }

      res.json({ message: 'Status do catálogo atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar status do catálogo:', error);
      res.status(500).json({ message: 'Erro ao atualizar status do catálogo' });
    }
  }
}

module.exports = new CatalogController(); 