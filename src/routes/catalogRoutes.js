const express = require('express');
const router = express.Router();
const CatalogController = require('../controllers/catalogController');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Catalogs
 *   description: API para gerenciamento de catálogos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Catalog:
 *       type: object
 *       required:
 *         - link
 *         - image
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do catálogo
 *         link:
 *           type: string
 *           description: Link do catálogo
 *         image:
 *           type: string
 *           description: Nome do arquivo da imagem
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *           description: Status do catálogo
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /catalogs:
 *   post:
 *     summary: Criar novo catálogo
 *     tags: [Catalogs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *               - image
 *             properties:
 *               link:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Catálogo criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro do servidor
 * 
 *   get:
 *     summary: Listar todos os catálogos
 *     tags: [Catalogs]
 *     responses:
 *       200:
 *         description: Lista de catálogos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Catalog'
 */

/**
 * @swagger
 * /catalogs/{id}:
 *   put:
 *     summary: Atualizar um catálogo
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               link:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Catálogo atualizado com sucesso
 *       404:
 *         description: Catálogo não encontrado
 *       500:
 *         description: Erro do servidor
 */

/**
 * @swagger
 * /catalogs/{id}/status:
 *   patch:
 *     summary: Atualizar status do catálogo
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Status inválido
 *       404:
 *         description: Catálogo não encontrado
 *       500:
 *         description: Erro do servidor
 */

router.post('/', upload.single('image'), CatalogController.createCatalog);
router.get('/', CatalogController.getAllCatalogs);
router.put('/:id', upload.single('image'), CatalogController.updateCatalog);
router.patch('/:id/status', CatalogController.updateCatalogStatus);

module.exports = router; 