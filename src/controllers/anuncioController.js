const AnuncioModel = require('../models/anuncioModel');
const db = require('../config/database');

class AnuncioController {
  static async criar(req, res) {
    try {
      const dados = req.body;
      dados.usuario_id = req.userData.userId;

      // Processar imagem principal
      if (req.files && req.files.imagem_principal && req.files.imagem_principal.length > 0) {
        const imagemPrincipalPath = '/uploads/' + req.files.imagem_principal[0].filename;
        dados.imagem_principal = imagemPrincipalPath;
      }

      // Processar imagens adicionais
      const imagens = [];
      if (req.files && req.files.imagens) {
        req.files.imagens.forEach(file => {
          imagens.push('/uploads/' + file.filename);
        });
      }


      // Criar o anúncio
      const anuncioId = await AnuncioModel.criar(dados);

      // Salvar as imagens adicionais
      if (imagens.length > 0) {
        await AnuncioModel.salvarImagens(anuncioId, imagens);
      }

      res.status(201).json({
        success: true,
        message: 'Anúncio criado com sucesso',
        data: {
          id: anuncioId,
          imagens: imagens,
          imagem_principal: dados.imagem_principal
        }
      });
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar anúncio',
        error: error.message
      });
    }
  }

  static async listar(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      let anuncios;

      // Se for admin, lista todos os anúncios
      if (req.userData && req.userData.role === "admin") {
        anuncios = await AnuncioModel.listarTodos(page, limit);
      } else {
        // Se não for admin, lista apenas anúncios públicos
        anuncios = await AnuncioModel.listarPorUsuario(
          req.userData.userId,
          page,
          limit
        );
      }

      res.json({
        success: true,
        data: anuncios,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async listarPublicos(req, res) {
    try {
      const { page = 1, limit = 10, categoria, provincia } = req.query;
      const filtros = {};
      
      if (categoria) filtros.categoria = categoria;
      if (provincia) filtros.provincia = provincia;

      const anuncios = await AnuncioModel.listarPublicos(page, limit, filtros);
      
      res.json({
        success: true,
        data: anuncios
      });
    } catch (error) {
      console.error('Erro ao listar anúncios:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar anúncios',
        error: error.message
      });
    }
  }

  static async obterPorId(req, res) {
    try {
      const { id } = req.params;
      const anuncio = await AnuncioModel.obterPorId(id);
      
      if (!anuncio) {
        return res.status(404).json({
          success: false,
          message: 'Anúncio não encontrado'
        });
      }

      res.json({
        success: true,
        data: anuncio
      });
    } catch (error) {
      console.error('Erro ao obter anúncio:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter anúncio',
        error: error.message
      });
    }
  }

  static async atualizar(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;
      
      // Se houver novas imagens, atualiza a imagem principal
      if (req.files && req.files.length > 0) {
        dados.imagem_principal = req.files[0].path;
      }
      
      await AnuncioModel.atualizar(id, dados);

      if (!atualizado) {
        return res.status(404).json({
          success: false,
          message: "Anúncio não encontrado",
        });
      }

      res.json({
        success: true,
        message: "Anúncio atualizado com sucesso",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async excluir(req, res) {
    try {
      const { id } = req.params;

      // Verificar se o usuário está autenticado
      if (!req.userData) {
        return res.status(401).json({
          success: false,
          message: "Não autenticado",
        });
      }

      let excluido;

      // Se for admin, pode excluir qualquer anúncio
      if (req.userData.role === "admin") {
        excluido = await AnuncioModel.excluirAdmin(id);
      } else {
        // Se não for admin, só pode excluir seus próprios anúncios
        excluido = await AnuncioModel.excluir(id, req.userData.userId);
      }

      if (!excluido) {
        return res.status(404).json({
          success: false,
          message: "Anúncio não encontrado ou sem permissão para excluir",
        });
      }

      res.json({
        success: true,
        message: "Anúncio excluído com sucesso",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async registrarInteracao(req, res) {
    try {
      const { id } = req.params;
      const { tipo } = req.body;

      // Validar tipo de interação
      const tiposValidos = ['visualizacao', 'chamada', 'mensagem', 'compartilhamento'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de interação inválido'
        });
      }

      // Mapear tipo para campo no banco
      const camposPorTipo = {
        'visualizacao': 'visualizacoes',
        'chamada': 'chamadas',
        'mensagem': 'mensagens_whatsapp',
        'compartilhamento': 'compartilhamentos'
      };

      const campo = camposPorTipo[tipo];
      
      // Atualizar o contador apropriado
      const [result] = await db.query(
        `UPDATE anuncios SET ${campo} = ${campo} + 1 WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Anúncio não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Interação registrada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao registrar interação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar interação',
        error: error.message
      });
    }
  }

  static async alterarStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userData.userId;

        const atualizado = await AnuncioModel.alterarStatus(id, userId, status);

        if (!atualizado) {
            return res.status(404).json({
                success: false,
                message: 'Anúncio não encontrado ou sem permissão para alterar'
            });
        }

        res.json({
            success: true,
            message: 'Status do anúncio atualizado com sucesso'
        });
    } catch (error) {
        if (error.message === 'Status inválido') {
            return res.status(400).json({
                success: false,
                message: 'Status inválido'
            });
        }

        console.error('Erro ao alterar status do anúncio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao alterar status do anúncio',
            error: error.message
        });
    }
  }

  static async buscarSimilares(req, res) {
    try {
        const { id } = req.params;
        const { limit = 4 } = req.query;

        const anuncios = await AnuncioModel.buscarSimilares(id, parseInt(limit));

        res.json({
            success: true,
            data: anuncios
        });
    } catch (error) {
        console.error('Erro ao buscar anúncios similares:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar anúncios similares',
            error: error.message
        });
    }
  }

  static async buscarSimilaresDoUsuario(req, res) {
    try {
        const { id } = req.params;
        const { limit = 4 } = req.query;

        const anuncios = await AnuncioModel.buscarSimilaresDoUsuario(id, parseInt(limit));

        res.json({
            success: true,
            data: anuncios
        });
    } catch (error) {
        console.error('Erro ao buscar anúncios similares do usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar anúncios similares do usuário',
            error: error.message
        });
    }
  }
}

module.exports = AnuncioController; 