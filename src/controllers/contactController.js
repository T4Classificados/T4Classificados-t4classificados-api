const db = require('../config/database');

exports.submitContactForm = async (req, res) => {
  try {
    const { nomeEmpresa, telefone, mensagem } = req.body;

    // Inserir os dados na tabela contatos
    const [result] = await db.query(
      'INSERT INTO contatos (nome_empresa, telefone, mensagem) VALUES (?, ?, ?)',
      [nomeEmpresa, telefone, mensagem]
    );

    console.log('Dados do formulário de contato salvos:', { id: result.insertId, nomeEmpresa, telefone, mensagem });

    res.status(201).json({
      message: 'Formulário de contato enviado e salvo com sucesso',
      data: { id: result.insertId, nomeEmpresa, telefone, mensagem }
    });
  } catch (error) {
    console.error('Erro ao processar formulário de contato:', error);
    res.status(500).json({ message: 'Erro ao processar formulário de contato' });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contatos ORDER BY data_criacao DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({ message: 'Erro ao buscar contatos' });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM contatos WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Contato não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    res.status(500).json({ message: 'Erro ao buscar contato' });
  }
};