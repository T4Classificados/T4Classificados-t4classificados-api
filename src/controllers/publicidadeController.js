const publicidadeModel = require('../models/publicidadeModel');
const { validateURL, validatePhoneNumber } = require('../utils/validators');
const path = require('path');
const fs = require('fs').promises;

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES = 8;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

exports.createPublicidade = async (req, res) => {
  console.log('=== Iniciando createPublicidade ===');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('User data:', req.userData);
  
  try {
    const {
      titulo,
      objetivo,
      contato,
      plafond_maximo,
      plafond_diario,
      data_inicio,
      data_fim,
      modelo_cobranca
    } = req.body;

    // Validações básicas
    if (!titulo || !objetivo || !contato) {
      console.log('Erro de validação: campos obrigatórios faltando');
      return res.status(400).json({ 
        message: 'Título, objetivo e contato são obrigatórios' 
      });
    }

    // Validar plafond
    const plafondMaximo = parseFloat(plafond_maximo);
    const plafondDiario = plafond_diario ? parseFloat(plafond_diario) : null;

    if (isNaN(plafondMaximo) || plafondMaximo <= 0) {
      return res.status(400).json({ message: 'Plafond máximo inválido' });
    }

    if (plafondDiario !== null && (isNaN(plafondDiario) || plafondDiario <= 0)) {
      return res.status(400).json({ message: 'Plafond diário inválido' });
    }

    // Validar objetivo e contato
    switch (objetivo) {
      case 'whatsapp':
      case 'ligacao':
        if (!validatePhoneNumber(contato)) {
          return res.status(400).json({ 
            message: 'Número de telefone inválido' 
          });
        }
        break;
      case 'site':
        if (!validateURL(contato)) {
          return res.status(400).json({ 
            message: 'URL do site inválida' 
          });
        }
        break;
      default:
        return res.status(400).json({ 
          message: 'Objetivo inválido' 
        });
    }

    // Validar imagens
    if (!req.files || req.files.length === 0) {
      console.log('Erro de validação: nenhuma imagem enviada');
      return res.status(400).json({ 
        message: 'É necessário enviar pelo menos uma imagem' 
      });
    }

    if (req.files.length > MAX_IMAGES) {
      return res.status(400).json({ message: `Máximo de ${MAX_IMAGES} imagens permitidas` });
    }

    // Validar imagens
    for (const file of req.files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Formato de imagem inválido. Use JPEG ou PNG' });
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({ message: 'Tamanho máximo por imagem é 2MB' });
      }
    }

    // Validar datas
    const hoje = new Date();
    const dataInicio = new Date(data_inicio);
    const dataFim = new Date(data_fim);

    if (dataInicio < hoje) {
      return res.status(400).json({ message: 'Data de início deve ser futura' });
    }

    if (dataFim <= dataInicio) {
      return res.status(400).json({ message: 'Data de término deve ser posterior à data de início' });
    }

    console.log('Processando imagens...');
    const imagens = req.files.map(file => `/uploads/publicidade/${file.filename}`);
    console.log('Imagens processadas:', imagens);

    const publicidadeId = await publicidadeModel.createPublicidade(
      req.userData.userId,
      {
        titulo,
        objetivo,
        contato,
        plafond_maximo: plafondMaximo,
        plafond_diario: plafondDiario,
        data_inicio,
        data_fim,
        modelo_cobranca: modelo_cobranca || 'cpc'
      },
      imagens
    );

    const publicidade = await publicidadeModel.getPublicidadeById(publicidadeId);

    res.status(201).json({
      message: 'Publicidade criada com sucesso',
      data: publicidade
    });
  } catch (error) {
    console.error('Erro detalhado em createPublicidade:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      files: req.files
    });
    res.status(500).json({ message: 'Erro ao criar publicidade' });
  }
};

exports.getPublicidades = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      status
    } = req.query;

    const filters = {
      status,
      userId: req.userData?.userId
    };

    const publicidades = await publicidadeModel.getPublicidades(filters, parseInt(page), parseInt(limit));
    res.json(publicidades);
  } catch (error) {
    console.error('Erro ao listar publicidades:', error);
    res.status(500).json({ message: 'Erro ao listar publicidades' });
  }
};

exports.aprovarPublicidade = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await publicidadeModel.updateStatus(id, 'aprovado');

    if (!success) {
      return res.status(404).json({ message: 'Publicidade não encontrada' });
    }

    res.json({ message: 'Publicidade aprovada com sucesso' });
  } catch (error) {
    console.error('Erro ao aprovar publicidade:', error);
    res.status(500).json({ message: 'Erro ao aprovar publicidade' });
  }
};

exports.rejeitarPublicidade = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ message: 'Motivo da rejeição é obrigatório' });
    }

    const success = await publicidadeModel.updateStatus(id, 'rejeitado', motivo);

    if (!success) {
      return res.status(404).json({ message: 'Publicidade não encontrada' });
    }

    res.json({ message: 'Publicidade rejeitada com sucesso' });
  } catch (error) {
    console.error('Erro ao rejeitar publicidade:', error);
    res.status(500).json({ message: 'Erro ao rejeitar publicidade' });
  }
};

exports.getPublicidadesPendentes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { publicidades, total } = await publicidadeModel.getPublicidadesPendentes(page, limit);

    res.json({
      message: 'Publicidades pendentes obtidas com sucesso',
      data: publicidades,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar publicidades pendentes:', error);
    res.status(500).json({ message: 'Erro ao listar publicidades pendentes' });
  }
};

exports.solicitarAlteracao = async (req, res) => {
  try {
    const { id } = req.params;
    const { solicitacao } = req.body;

    if (!solicitacao) {
      return res.status(400).json({ message: 'Descrição das alterações solicitadas é obrigatória' });
    }

    const success = await publicidadeModel.solicitarAlteracao(id, solicitacao);

    if (!success) {
      return res.status(404).json({ message: 'Publicidade não encontrada' });
    }

    res.json({ 
      message: 'Solicitação de alteração enviada com sucesso',
      solicitacao
    });
  } catch (error) {
    console.error('Erro ao solicitar alteração:', error);
    res.status(500).json({ message: 'Erro ao solicitar alteração' });
  }
};

exports.atualizarPublicidade = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData.userId;
    const {
      titulo,
      objetivo,
      contato,
      plafond_maximo,
      data_inicio,
      data_fim
    } = req.body;

    // Validações
    const hoje = new Date();
    const dataInicio = new Date(data_inicio);
    const dataFim = new Date(data_fim);

    if (dataInicio < hoje) {
      return res.status(400).json({ message: 'Data de início deve ser futura' });
    }

    if (dataFim <= dataInicio) {
      return res.status(400).json({ message: 'Data de término deve ser posterior à data de início' });
    }

    // Validar objetivo e contato
    if (objetivo === 'site' && !validateURL(contato)) {
      return res.status(400).json({ message: 'URL do site inválida' });
    }

    // Processar novas imagens se houver
    let novasImagens = null;
    if (req.files && req.files.length > 0) {
      if (req.files.length > MAX_IMAGES) {
        return res.status(400).json({ message: `Máximo de ${MAX_IMAGES} imagens permitidas` });
      }

      // Validar novas imagens
      for (const file of req.files) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return res.status(400).json({ message: 'Formato de imagem inválido. Use JPEG ou PNG' });
        }

        if (file.size > MAX_IMAGE_SIZE) {
          return res.status(400).json({ message: 'Tamanho máximo por imagem é 2MB' });
        }
      }

      novasImagens = req.files.map(file => `/uploads/publicidade/${file.filename}`);
    }

    const success = await publicidadeModel.atualizarPublicidade(
      id,
      userId,
      {
        titulo,
        objetivo,
        contato,
        plafond_maximo,
        data_inicio,
        data_fim
      },
      novasImagens
    );

    if (!success) {
      return res.status(404).json({ message: 'Publicidade não encontrada ou sem permissão' });
    }

    res.json({ message: 'Publicidade atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar publicidade:', error);
    res.status(500).json({ message: 'Erro ao atualizar publicidade' });
  }
};

exports.getPublicidadeParaExibicao = async (req, res) => {
  try {
    const { id } = req.params;
    const publicidade = await publicidadeModel.getPublicidadeParaExibicao(id);

    if (!publicidade) {
      return res.status(404).json({ message: 'Publicidade não encontrada ou não disponível' });
    }

    res.json({
      message: 'Publicidade obtida com sucesso',
      data: publicidade
    });
  } catch (error) {
    console.error('Erro ao obter publicidade:', error);
    res.status(500).json({ message: 'Erro ao obter publicidade' });
  }
};

exports.getPublicidadesAnunciante = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filtros = {
      periodo: req.query.periodo
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
    console.error('Erro ao listar publicidades do anunciante:', error);
    res.status(500).json({ message: 'Erro ao listar publicidades' });
  }
};

exports.getDesempenhoCampanha = async (req, res) => {
  try {
    const { id } = req.params;
    const periodo = req.query.periodo || 'total';
    const userId = req.userData.userId;

    // Verificar se a publicidade pertence ao usuário
    const publicidade = await publicidadeModel.getPublicidadeById(id);
    if (!publicidade || publicidade.user_id !== userId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const metricas = await publicidadeModel.getDesempenhoCampanha(id, periodo);

    res.json({
      message: 'Métricas obtidas com sucesso',
      data: metricas
    });
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ message: 'Erro ao obter métricas' });
  }
};

exports.renovarCampanha = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData.userId;
    const { plafond_adicional, nova_data_fim, plafond_diario } = req.body;

    // Validações
    if (!plafond_adicional && !nova_data_fim && plafond_diario === undefined) {
      return res.status(400).json({ 
        message: 'É necessário fornecer pelo menos um parâmetro para renovação' 
      });
    }

    if (plafond_adicional && plafond_adicional <= 0) {
      return res.status(400).json({ message: 'Plafond adicional deve ser maior que zero' });
    }

    if (nova_data_fim) {
      const dataFim = new Date(nova_data_fim);
      const hoje = new Date();
      if (dataFim <= hoje) {
        return res.status(400).json({ message: 'Nova data de término deve ser futura' });
      }
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
    res.status(500).json({ message: error.message || 'Erro ao renovar campanha' });
  }
};

exports.getPublicidadesPublicas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await publicidadeModel.getPublicidadesPublicas(page, limit);

    // Formatar os dados para retornar apenas as informações necessárias
    const publicidadesFormatadas = result.publicidades.map(pub => ({
      id: pub.id,
      titulo: pub.titulo,
      objetivo: pub.objetivo,
      contato: pub.contato,
      anunciante_nome: pub.anunciante_nome,
      imagens: pub.imagens
    }));

    res.json({
      success: true,
      data: publicidadesFormatadas,
      pagination: {
        page,
        limit,
        total: result.total
      }
    });
  } catch (error) {
    console.error('Erro ao buscar publicidades públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar publicidades'
    });
  }
};

exports.getDenuncias = async (req, res) => {
  try {
    const {
      status = 'pendente',
      tipo_anuncio = 'anuncio',
      page = 1,
      limit = 10
    } = req.query;

    const denuncias = await publicidadeModel.getDenuncias(
      status,
      tipo_anuncio,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: denuncias,
      pagination: {
        page,
        limit,
        total: denuncias.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar denuncias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar denuncias'
    });
  }
};
 