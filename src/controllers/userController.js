const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const dotenv = require('dotenv');

dotenv.config();

function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(phoneNumber, message) {
  try {
    const response = await axios.post(process.env.SMS_SERVICE_URL, {
      message: {
        api_key_app: process.env.SMS_API_KEY,
        phone_number: phoneNumber,
        message_body: message,
      },
    });
    console.log('SMS enviado com sucesso:', response.data);
    return true;
  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    return false;
  }
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não está definido. Verifique seu arquivo .env');
  process.exit(1);
}

exports.registerUser = async (req, res) => {
  try {
    const { nome, sobrenome, telefone, senha, role = 'user' } = req.body;

    const existingUser = await userModel.getUserByTelefone(telefone);
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este número de telefone' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const confirmationCode = generateConfirmationCode();

    const result = await userModel.createUser(nome, sobrenome, telefone, hashedPassword, role, confirmationCode);

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
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { telefone, senha } = req.body;

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
      { userId: user.id, telefone: user.telefone, role: user.role, nome: user.nome, sobrenome: user.sobrenome },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      message: 'Login bem-sucedido',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        telefone: user.telefone,
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
        { expiresIn: '1h' }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
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
    const userId = req.userData.userId;
    const user = await userModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Remova informações sensíveis antes de enviar
    const { senha, confirmation_code, ...userInfo } = user;

    res.json({
      message: 'Informações do usuário obtidas com sucesso',
      user: userInfo
    });
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({ message: 'Erro ao obter informações do usuário' });
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