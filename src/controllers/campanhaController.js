const CampanhaModel = require('../models/campanhaModel');
const { uploadImagens } = require('../utils/upload');
const PagamentoModel = require('../models/pagamentoModel');
const PagamentoService = require('../services/pagamentoService');
const NotificacaoService = require('../services/notificacaoService');
const db = require('../config/database');
const { CloudflareService } = require('../utils/cloudflare');

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}



class CampanhaController {
  static async criar(req, res) {

    try {
      // Processa as imagens se existirem
      const dados = req.body;

      const cloudflareService = new CloudflareService();
      if (req.files && req.files.logo && req.files.logo.length > 0) {
        const imagemPrincipalKey = await cloudflareService.uploadFile('campanha_logos', req.files.logo[0]);
        const imagemPrincipalUrl = await cloudflareService.getSignedUrl(imagemPrincipalKey);
        dados.logo_url_key = imagemPrincipalKey;
        dados.logo_url = imagemPrincipalUrl;
      }

      // Processar imagens adicionais
      const imagens = [];
      const imagensKeys = [];

      if (req.files && req.files.imagens) {
        // Para cada imagem adicional, fazer upload para o Cloudflare R2
        for (const file of req.files.imagens) {
          const imagemKey = await cloudflareService.uploadFile('campanha_imagens', file);
          const imagemUrl = await cloudflareService.getSignedUrl(imagemKey);
          imagens.push(imagemUrl);
          imagensKeys.push(imagemKey);
        }
      }


      // Busca o telefone do usuário
      const [usuario] = await db.query(
        "SELECT telefone FROM usuarios WHERE id = ?",
        [req.userData.userId]
      );

      if (!usuario[0]) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Gera reference_id único de 9 dígitos
      const timestamp = Date.now().toString().slice(-5); // Últimos 5 dígitos do timestamp
      const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0"); // 4 dígitos aleatórios
      const reference_id = timestamp + randomNum; // Combina para ter 9 dígitos únicos

      // Prepara os dados da campanha
      const campanha = {
        nome: req.body.nome || null,
        tipo_exibicao: req.body.tipo_exibicao,
        espaco_exibicao: req.body.espaco_exibicao,
        descricao: req.body.descricao,
        logo_url: dados.logo_url ? dados.logo_url : undefined,
        botao_texto: req.body.botao_texto,
        num_visualizacoes: parseInt(req.body.num_visualizacoes),
        valor_visualizacao: parseFloat(req.body.valor_visualizacao).toFixed(3),
        total_pagar: parseFloat(req.body.total_pagar).toFixed(3),
        status: "Pendente",
        reference_id: reference_id,
        channel_value: req.body.channel_value,
      };

      try {
        // Cria a campanha
        const campanhaId = await CampanhaModel.criar(
          req.userData.userId,
          campanha
        );

        if (imagensKeys.length > 0) {
          // Modificar o modelo para salvar as chaves das imagens também
          await CampanhaModel.salvarImagens(campanhaId, imagens, imagensKeys);
        }
        // Configura prazo de pagamento
        const dataLimite = new Date();
        dataLimite.setHours(dataLimite.getHours() + 720); // 30 dias

        // Gera referência no ProxyPay
        await PagamentoService.gerarReferencia(
          {
            amount: campanha.total_pagar,
            end_datetime: dataLimite.toISOString(),
            custom_fields: {
              callback_url: `${process.env.BASE_URL}/api/public/campanhas/pagamento/callback`,
            },
          },
          reference_id // Usa o telefone como reference_id
        );

        const entidade = "00940";

        // Monta mensagem SMS
        const mensagem =
          `T4 Classificados\n` +
          `Dados para pagamento da campanha patrocinada\n\n` +
          `Faca no Multicaixa Express, ATM ou Internet banking\n\n` +
          `Escolha a opcao pagamentos, pagamentos por referencia e introduza os dados abaixo:\n\n` +
          `Entidade: ${entidade}\n` +
          `Referencia: ${reference_id}\n` + // Usa o telefone como referência
          `Valor: ${formatarValor(campanha.total_pagar)} Kz`;

        // Envia notificação
        await NotificacaoService.enviarNotificacao(
          usuario[0].telefone,
          mensagem
        )

        // Registra o pagamento como pendente
        await PagamentoModel.registrar("criacao_campanha", reference_id, {
          transaction_id: null,
          amount: parseFloat(campanha.total_pagar),
          status: "pendente",
          product_id: campanhaId,
          user_id: req.userData.userId
        });

        const campanhaCreated = await CampanhaModel.obterPorId(
          campanhaId,
          req.userData.userId
        );

        res.status(201).json({
          success: true,
          message:
            "Campanha criada com sucesso. Verifique seu telefone para instruções de pagamento.",
          data: {
            ...campanhaCreated,
            pagamento: {
              entidade,
              referencia: reference_id, // Usa o telefone como referência
              valor: campanha.total_pagar,
              dataLimite: dataLimite.toLocaleDateString("pt-AO"),
            },
          },
        });
      } catch (error) {
        if (error.message === "Usuário não possui empresa vinculada") {
          return res.status(400).json({
            success: false,
            message:
              "É necessário vincular uma empresa antes de criar uma campanha",
          });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar campanha',
        error: error.message
      });
    }
  }

  static async listar(req, res) {
    try {
      const campanhas = await CampanhaModel.listar(req.userData.userId);

      res.json({
        success: true,
        data: campanhas
      });
    } catch (error) {
      console.error('Erro ao listar campanhas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar campanhas',
        error: error.message
      });
    }
  }
  static async listarPublicos(req, res) {
    try {
      const { categoria, provincia } = req.query;
      const filtros = {};

      if (categoria) filtros.categoria = categoria;
      if (provincia) filtros.provincia = provincia;

      const campanha = await CampanhaModel.listarPublico();

      res.json({
        success: true,
        data: campanha
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
      const campanha = await CampanhaModel.obterPorId(id, req.userData.userId);

      if (!campanha) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada'
        });
      }

      res.json({
        success: true,
        data: campanha
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter campanha',
        error: error.message
      });
    }
  }

  static async atualizar(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      // Processa as imagens se existirem
      let imagens = undefined;
      let logo = undefined;

      try {
        if (req.files?.imagens) {
          imagens = await uploadImagens(req.files.imagens);
        }
        if (req.files?.logo) {
          logo = await uploadImagens([req.files.logo[0]]);
        }
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao processar imagens',
          error: uploadError.message
        });
      }

      // Prepara os dados para atualização
      const dadosAtualizacao = {
        tipo_exibicao: req.body.tipo_exibicao,
        espaco_exibicao: req.body.espaco_exibicao,
        descricao: req.body.descricao,
        botao_texto: req.body.botao_texto,
        num_visualizacoes: req.body.num_visualizacoes ? parseInt(req.body.num_visualizacoes) : undefined,
        valor_visualizacao: req.body.valor_visualizacao ? parseFloat(req.body.valor_visualizacao) : undefined,
        total_pagar: req.body.total_pagar ? parseFloat(req.body.total_pagar) : undefined,
        imagens: imagens,
        logo_url: logo ? logo[0] : undefined,
        usuario_id: req.userData.userId,
        preco_negociavel: req.body.preco_negociavel === 'true'
      };

      // Remove campos undefined
      Object.keys(dadosAtualizacao).forEach(key =>
        dadosAtualizacao[key] === undefined && delete dadosAtualizacao[key]
      );

      // Atualiza a campanha
      const campanhaAtualizada = await CampanhaModel.atualizar(id, req.userData.userId, dadosAtualizacao);

      if (!campanhaAtualizada) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Campanha atualizada com sucesso',
        data: campanhaAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar campanha',
        error: error.message
      });
    }
  }

  static async excluir(req, res) {
    try {
      const { id } = req.params;

      // Busca a campanha antes de excluir para retornar seus dados
      const campanha = await CampanhaModel.obterPorId(id, req.userData.userId);
      if (!campanha) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada'
        });
      }

      // Tenta excluir
      const excluido = await CampanhaModel.excluir(id, req.userData.userId);
      if (!excluido) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Campanha excluída com sucesso',
        data: campanha
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir campanha',
        error: error.message
      });
    }
  }

  static async promoverNovamente(req, res) {
    try {
      const { id } = req.params;

      // Primeiro busca a campanha
      const campanhaExistente = await CampanhaModel.obterPorId(
        id,
        req.userData.userId
      );
      if (!campanhaExistente) {
        return res.status(404).json({
          success: false,
          message: "Campanha não encontrada",
        });
      }
      if (campanhaExistente.status === "Ativa") {
        return res.status(400).json({
          success: false,
          message: "Campanha já está ativa",
        });
      }

      if (campanhaExistente.status === "Pendente") {
        return res.status(400).json({
          success: false,
          message: "Campanha está pendente",
        });
      }

      if (campanhaExistente.status === "Cancelada") {
        return res.status(400).json({
          success: false,
          message: "Campanha está cancelada",
        });
      }

      // Busca o telefone do usuário
      const [usuario] = await db.query(
        "SELECT telefone FROM usuarios WHERE id = ?",
        [req.userData.userId]
      );

      if (!usuario[0]) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Gera reference_id único de 9 dígitos
      const timestamp = Date.now().toString().slice(-5); // Últimos 5 dígitos do timestamp
      const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0"); // 4 dígitos aleatórios
      const reference_id = timestamp + randomNum; // Combina para ter 9 dígitos únicos

      // Cria uma nova campanha baseada na existente
      const novaCampanha = {
        nome: campanhaExistente.nome || null,
        tipo_exibicao: campanhaExistente.tipo_exibicao,
        espaco_exibicao: campanhaExistente.espaco_exibicao,
        descricao: campanhaExistente.descricao,
        logo_url: campanhaExistente.logo_url?.replace(
          `${process.env.BASE_URL || "http://localhost:4000"}`,
          ""
        ),
        botao_texto: campanhaExistente.botao_texto,
        num_visualizacoes: campanhaExistente.num_visualizacoes,
        valor_visualizacao: campanhaExistente.valor_visualizacao,
        total_pagar: campanhaExistente.total_pagar,
        status: "Pendente",
        reference_id: reference_id,
        imagens: campanhaExistente.imagens?.map((img) =>
          img.replace(
            `${process.env.BASE_URL || "http://localhost:4000"}`,
            ""
          )
        ),
      };

      // Cria a nova campanha
      const novaCampanhaId = await CampanhaModel.criar(
        req.userData.userId,
        novaCampanha
      );

      // Configura prazo de pagamento
      const dataLimite = new Date();
      dataLimite.setHours(dataLimite.getHours() + 720); // 30 dias

      // Gera referência no ProxyPay
      await PagamentoService.gerarReferencia(
        {
          amount: novaCampanha.total_pagar,
          end_datetime: dataLimite.toISOString(),
          custom_fields: {
            callback_url: `${process.env.BASE_URL}/api/public/campanhas/pagamento/callback`,
          },
        },
        reference_id // Usa o telefone como reference_id
      );

      const entidade = "00940";

      // Monta mensagem SMS
      const mensagem =
        `T4 Classificados\n` +
        `Dados para pagamento de renovacao de campanha patrocinada\n\n` +
        `Faca no Multicaixa Express, ATM ou Internet banking\n\n` +
        `Escolha a opcao pagamentos, pagamentos por referencia e introduza os dados abaixo:\n\n` +
        `Entidade: ${entidade}\n` +
        `Referencia: ${reference_id}\n` + // Usa o telefone como referência
        `Valor: ${formatarValor(novaCampanha.total_pagar)} Kz`;

      // Envia notificação
      await NotificacaoService.enviarNotificacao(
        usuario[0].telefone,
        mensagem
      );

      // Registra o pagamento como pendente
      await PagamentoModel.registrar("renovacao_campanha", reference_id, {
        reference_id, // Usa o telefone como reference_id
        transaction_id: null,
        amount: parseFloat(novaCampanha.total_pagar),
        status: "pendente",
        product_id: novaCampanhaId,
        user_id: req.userData.userId,
      });

      const campanhaPromovida = await CampanhaModel.obterPorId(
        novaCampanhaId,
        req.userData.userId
      );

      res.status(201).json({
        success: true,
        message:
          "Campanha promovida novamente com sucesso. Verifique seu telefone para instruções de pagamento.",
        data: {
          ...campanhaPromovida,
          pagamento: {
            entidade,
            referencia: reference_id,
            valor: novaCampanha.total_pagar,
            dataLimite: dataLimite.toLocaleDateString("pt-AO"),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao promover campanha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao promover campanha',
        error: error.message
      });
    }
  }

  static async listarAdmin(req, res) {
    try {
      const {
        status = 'todos'
      } = req.query;

      const campanhas = await CampanhaModel.listarAdmin(
        status
      );

      res.json({
        success: true,
        data: campanhas
      });
    } catch (error) {
      console.error('Erro ao listar campanhas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar campanhas',
        error: error.message
      });
    }
  }

  static async registrarInteracao(req, res) {
    try {
      const { id } = req.params;
      const { tipo } = req.body;

      if (!['view', 'chamada', 'clique'].includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de interação inválido'
        });
      }

      const sucesso = await CampanhaModel.incrementarEstatistica(id, tipo);

      if (!sucesso) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada'
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

  static async confirmarPagamento(req, res) {
    try {
      const { id } = req.params;

      const sucesso = await CampanhaModel.confirmarPagamento(id);

      if (!sucesso) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada ou já ativada'
        });
      }

      res.json({
        success: true,
        message: 'Pagamento confirmado e campanha ativada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao confirmar pagamento',
        error: error.message
      });
    }
  }

  static async processarCallbackPagamento(req, res) {
    try {
      const pagamento = {
        reference_id: req.body.reference_id,
        transaction_id: req.body.transaction_id,
        amount: req.body.amount,
        //user_id: req.userData.userId
      };

      if (!pagamento.reference_id) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos no callback'
        });
      }

      // Atualiza o status da campanha usando o reference_id
      const sucesso = await CampanhaModel.atualizarStatusPagamento(
        pagamento.reference_id,
        'Ativa',
        pagamento.transaction_id
      );

      const campanha = await CampanhaModel.obterPorReferenceId(pagamento.reference_id);

      if (!sucesso) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada'
        });
      }

      // Registra o pagamento
      pagamento.user_id = campanha.usuario_id;
      pagamento.product_id = campanha.id;

      await PagamentoModel.registrar(
        "criacao_campanha",
        pagamento.reference_id,
        pagamento
      );

      res.json({
        success: true,
        message: 'Pagamento registrado e status atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao processar callback de pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar callback de pagamento',
        error: error.message
      });
    }
  }

  static async registrarVisualizacao(req, res) {
    try {
      const { campanhaId } = req.params;

      const sucesso = await CampanhaModel.incrementarVisualizacao(campanhaId);

      if (!sucesso) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada ou não está ativa'
        });
      }

      res.json({
        success: true,
        message: 'Visualização registrada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar visualização',
        error: error.message
      });
    }
  }

  static async registrarChamada(req, res) {
    try {
      const { campanhaId } = req.params;

      const sucesso = await CampanhaModel.incrementarEstatistica(campanhaId, 'chamada');

      if (!sucesso) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada ou não está ativa'
        });
      }

      res.json({
        success: true,
        message: 'Chamada registrada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao registrar chamada:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar chamada',
        error: error.message
      });
    }
  }

  static async registrarClique(req, res) {
    try {
      const { campanhaId } = req.params;

      const sucesso = await CampanhaModel.incrementarEstatistica(campanhaId, 'clique');

      if (!sucesso) {
        return res.status(404).json({
          success: false,
          message: 'Campanha não encontrada ou não está ativa'
        });
      }

      res.json({
        success: true,
        message: 'Clique registrado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar clique',
        error: error.message
      });
    }
  }
}

module.exports = CampanhaController; 