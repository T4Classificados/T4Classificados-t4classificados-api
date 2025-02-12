const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const dotenv = require('dotenv');
const PagamentoModel = require('../models/pagamentoModel');

dotenv.config();


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* async function sendSMS(phoneNumber, smsMessage) {
  try {
    const message = await client.messages.create({
      body: smsMessage,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: phoneNumber,
    });
    console.log("SMS enviado com sucesso:", message.sid);
    return true;
  } catch (error) {
    console.error("Erro ao enviar SMS:", error);
    return false;
  }
} */

  async function sendSMS(phoneNumber, smsMessage) {
    const urlToSendMessage = process.env.URL_TO_SEND_MESSAGE;
    const API_KEY = process.env.API_TELCOSMS_KEY;

    const payload = {
      message: {
        api_key_app: API_KEY,
        phone_number: phoneNumber,
        message_body: smsMessage,
      },
    };
    try {
      const message = await fetch(urlToSendMessage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log("SMS enviado com sucesso:", message.sid);
      return true;
    } catch (error) {
      console.error("Erro ao enviar SMS:", error);
      return false;
    }
  }

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não está definido. Verifique seu arquivo .env');
  process.exit(1);
}

exports.register = async (req, res) => {
  try {
    const { 
      nome, 
      sobrenome,
      telefone, 
      role,
      senha,
      provincia,
      municipio, 
      bilhete
    } = req.body;

    // Verificar se usuário já existe
    const existingUser = await userModel.getUserByTelefone(telefone);
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este telefone' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const confirmationCode = generateConfirmationCode();

    const result = await userModel.createUser(
      nome,
      sobrenome,
      telefone,
      hashedPassword,
      provincia,
      municipio,
      role,
      confirmationCode,
      bilhete
    );

    // Enviar SMS com o código de confirmação
    
    const smsMessage = `Seu código de confirmação é: ${confirmationCode}`;
    const smsSent = await sendSMS(telefone, smsMessage);

    if (smsSent) {
      res.status(201).json({ 
        message: 'Usuário cadastrado com sucesso. Por favor, verifique seu telefone para o código de confirmação.', 
        userId: result.insertId 
      });
    } else {
      res.status(201).json({ 
        message: 'Usuário cadastrado com sucesso, mas houve um problema ao enviar o SMS. Por favor, tente novamente mais tarde.', 
        userId: result.insertId 
      });
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro no registro do usuário' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { telefone, senha, lembrar } = req.body;

    const user = await userModel.getUserByTelefone(telefone);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Conta não ativada. Por favor, verifique seu SMS e ative sua conta.' });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, telefone: user.telefone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: lembrar ? '30d' : '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Configurar cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    if (lembrar) {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos
    }

    // Salvar tokens nos cookies
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({ 
      message: 'Login bem-sucedido',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        telefone: user.telefone,
        provincia: user.provincia,
        municipio: user.municipio,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

exports.confirmAccount = async (req, res) => {
  try {
    const { telefone, confirmationCode } = req.body;

    const user = await userModel.getUserByTelefone(telefone);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.confirmation_code !== confirmationCode) {
      return res.status(400).json({ message: 'Código de confirmação inválido' });
    }

    if (user.is_active) {
      return res.status(400).json({ message: 'Conta já está ativa' });
    }

    await userModel.activateUser(user.id);

   
    const smsMessage =  "A tua conta foi criada com sucesso. Podes publicar anúncios todos os dias sem pagar nada";
    const smsSent = await sendSMS(telefone, smsMessage);

    if (smsSent) {
      res.status(201).json({ 
        message: 'Conta ativada com sucesso', 
        userId: user.id 
      });
    } else {
      res.status(201).json({ 
        message: 'Conta ativada com sucesso, mas houve um problema ao enviar o SMS. Por favor, tente novamente mais tarde.', 
        userId: user.id 
      });
    }

    res.json({ message: 'Conta ativada com sucesso' });
  } catch (error) {
    console.error('Erro ao confirmar conta:', error);
    res.status(500).json({ message: 'Erro ao confirmar conta' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token não fornecido' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
      }

      const user = await userModel.getUserById(decoded.userId);

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const accessToken = jwt.sign(
        { userId: user.id, telefone: user.telefone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '720h' }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "720h" }
      );

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          nome: user.nome,
          sobrenome: user.sobrenome,
          telefone: user.telefone,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    res.status(500).json({ message: 'Erro ao atualizar token' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const [rows] = await db.query(
      `SELECT 
        u.*,
        e.nome as empresa_nome,
        e.nif as empresa_nif,
        e.logo_url as empresa_logo,
        GROUP_CONCAT(DISTINCT c.id) as campanha_ids,
        GROUP_CONCAT(DISTINCT c.tipo_exibicao) as campanha_tipos,
        GROUP_CONCAT(DISTINCT c.espaco_exibicao) as campanha_espaco_exibicao,
        GROUP_CONCAT(DISTINCT c.status) as campanha_status,
        GROUP_CONCAT(DISTINCT c.created_at) as campanha_datas
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      LEFT JOIN campanhas c ON e.id = c.empresa_id
      WHERE u.id = ?
      GROUP BY u.id`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const user = rows[0];
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

    // Busca detalhes das campanhas se existirem
    let campanhas = [];
    if (user.campanha_ids) {
      const campanhaIds = user.campanha_ids.split(',');
      const [campanhasRows] = await db.query(
        `SELECT c.*, GROUP_CONCAT(ci.url_imagem) as imagens
        FROM campanhas c
        LEFT JOIN campanha_imagens ci ON c.id = ci.campanha_id
        WHERE c.id IN (?)
        GROUP BY c.id`,
        [campanhaIds]
      );

      campanhas = campanhasRows.map(campanha => ({
        id: campanha.id,
        tipo_exibicao: campanha.tipo_exibicao,
        espaco_exibicao: campanha.espaco_exibicao,
        descricao: campanha.descricao,
        logo_url: campanha.logo_url ? `${baseUrl}${campanha.logo_url}` : null,
        botao_texto: campanha.botao_texto,
        num_visualizacoes: campanha.num_visualizacoes,
        valor_visualizacao: campanha.valor_visualizacao,
        total_pagar: campanha.total_pagar,
        status: campanha.status,
        created_at: campanha.created_at,
        updated_at: campanha.updated_at,
        imagens: campanha.imagens 
          ? campanha.imagens.split(',').map(img => `${baseUrl}${img}`)
          : []
      }));
    }

    // Formata os dados do usuário
    const userData = {
      id: user.id,
      nome: user.nome,
      sobrenome: user.sobrenome,
      telefone: user.telefone,
      provincia: user.provincia,
      municipio: user.municipio,
      bilhete: user.bilhete,
      role: user.role,
      genero: user.genero,
      is_active: user.is_active,
      foto_url: user.foto_url ? `${baseUrl}${user.foto_url}` : null,
      created_at: user.created_at,
      empresa: user.empresa_id ? {
        id: user.empresa_id,
        nome: user.empresa_nome,
        nif: user.empresa_nif,
        logo_url: user.empresa_logo ? `${baseUrl}${user.empresa_logo}` : null,
        campanhas: campanhas
      } : null
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações do usuário',
      error: error.message
    });
  }
};

exports.resendConfirmationCode = async (req, res) => {
  try {
    const { telefone } = req.body;

    const user = await userModel.getUserByTelefone(telefone);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.is_active) {
      return res.status(400).json({ message: 'Conta já está ativa' });
    }

    const confirmationCode = generateConfirmationCode();
    await userModel.updateConfirmationCode(user.id, confirmationCode);

    // Enviar SMS com o novo código de confirmação
    const smsMessage = `Seu novo código de confirmação é: ${confirmationCode}`;
    const smsSent = await sendSMS(telefone, smsMessage);

    if (smsSent) {
      res.json({ message: 'Novo código de confirmação enviado com sucesso' });
    } else {
      res.status(500).json({ message: 'Erro ao enviar o código de confirmação por SMS' });
    }
  } catch (error) {
    console.error('Erro ao reenviar código de confirmação:', error);
    res.status(500).json({ message: 'Erro ao reenviar código de confirmação' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { telefone } = req.body;
    const user = await userModel.getUserByTelefone(telefone);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const resetCode = generateConfirmationCode();
    await userModel.updateResetCode(user.id, resetCode);

    // Enviar SMS com o código de redefinição
    const smsMessage = `Seu código para redefinição de senha é: ${resetCode}`;
    const smsSent = await sendSMS(telefone, smsMessage);

    if (smsSent) {
      res.json({ message: 'Código de redefinição de senha enviado com sucesso' });
    } else {
      res.status(500).json({ message: 'Erro ao enviar o código de redefinição por SMS' });
    }
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    res.status(500).json({ message: 'Erro ao solicitar redefinição de senha' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { telefone, resetCode, newPassword } = req.body;
    const user = await userModel.getUserByTelefone(telefone);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.reset_code !== resetCode) {
      return res.status(400).json({ message: 'Código de redefinição inválido' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(user.id, hashedPassword);
    await userModel.clearResetCode(user.id);

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.userData.userId;

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    if (senhaAtual === novaSenha) {
      return res.status(400).json({ message: 'A nova senha deve ser diferente da senha atual' });
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    await userModel.updatePassword(userId, hashedPassword);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
};

exports.logout = async (req, res) => {
  try {
    // Limpar cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ message: 'Erro ao fazer logout' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const updateData = req.body;

    // Verificar se o usuário existe
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const success = await userModel.updateUser(userId, updateData);

    if (!success) {
      return res.status(400).json({ 
        message: 'Nenhuma alteração realizada. Verifique se os campos enviados são válidos para atualização.' 
      });
    }

    // Buscar usuário atualizado
    const updatedUser = await userModel.getUserById(userId);
    const { senha, confirmation_code, reset_code, ...userInfo } = updatedUser;

    res.json({
      message: 'Informações atualizadas com sucesso',
      user: userInfo
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar informações do usuário' });
  }
};

exports.listarAdmin = async (req, res) => {
    try {
        const { 
            status = 'todos',
            search = '' 
        } = req.query;

        const usuarios = await userModel.listarAdmin(
            status,
            search
        );

        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar usuários',
            error: error.message
        });
    }
};

exports.alterarStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const atualizado = await userModel.alterarStatus(id, is_active);
        
        if (!atualizado) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Status do usuário atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao alterar status do usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao alterar status do usuário',
            error: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
  try {
    const updateData = {
      nome: req.body.nome,
      sobrenome: req.body.sobrenome,
      provincia: req.body.provincia,
      municipio: req.body.municipio,
      bilhete: req.body.bilhete,
      genero: req.body.genero
    };

    const updated = await userModel.updateUser(req.userData.userId, updateData);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum dado válido para atualização'
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: error.message
    });
  }
};

exports.atualizarFoto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se o usuário tem permissão (é o próprio usuário ou é admin)
        if (req.userData.userId != id && req.userData.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Sem permissão para atualizar foto de outro usuário'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma foto enviada'
            });
        }

        const fotoUrl = '/uploads/' + req.file.filename;
        
        // Atualizar foto no banco de dados
        const atualizado = await userModel.atualizarFoto(id, fotoUrl);
        
        if (!atualizado) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
        
        res.json({
            success: true,
            message: 'Foto atualizada com sucesso',
            data: {
                foto_url: `${baseUrl}${fotoUrl}`
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar foto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar foto',
            error: error.message
        });
    }
};

exports.processarCallbackPagamento = async (req, res) => {
    try {
      const pagamento = {
        reference_id: req.body.reference_id,
        transaction_id: req.body.transaction_id,
        amount: req.body.amount,
      };

      if (!pagamento.reference_id) {
        return res.status(400).json({
          success: false,
          message: "Dados incompletos no callback",
        });
      }

      // Atualiza o status do usuário
      const sucesso = await userModel.ativarConta(pagamento.reference_id);

      if (!sucesso) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      // Registra o pagamento
      await PagamentoModel.registrar(
        "ativacao",
        pagamento.reference_id,
        pagamento
      );

      res.json({
        success: true,
        message: "Pagamento registrado e conta ativada com sucesso",
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