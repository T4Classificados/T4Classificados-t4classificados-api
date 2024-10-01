const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não está definido. Verifique seu arquivo .env');
  process.exit(1);
}

exports.registerUser = async (req, res) => {
  try {
    const { nome, sobrenome, telefone, senha, role = 'user' } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await userModel.getUserByTelefone(telefone);
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este número de telefone' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar novo usuário
    const result = await userModel.createUser(nome, sobrenome, telefone, hashedPassword, role);

    res.status(201).json({ 
      message: 'Usuário cadastrado com sucesso', 
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { telefone, senha } = req.body;

    // Buscar usuário pelo telefone
    const user = await userModel.getUserByTelefone(telefone);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, telefone: user.telefone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login bem-sucedido',
      token,
      user: {
        nome: user.nome,
        sobrenome: user.sobrenome,
        telefone: user.telefone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};