const publicidadeModel = require('../models/publicidadeModel');

exports.registrarImpressao = async (req, res) => {
  console.log('=== Iniciando registrarImpressao ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  
  try {
    const { id } = req.params;
    console.log('Publicidade ID:', id);

    const result = await publicidadeModel.registrarMetrica(id, 'impressao');
    console.log('Resultado do registro de impressão:', result);

    res.json({
      message: 'Impressão registrada com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro detalhado em registrarImpressao:', {
      error: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({ message: 'Erro ao registrar impressão' });
  }
};

exports.registrarClique = async (req, res) => {
  console.log('=== Iniciando registrarClique ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  
  try {
    const { id } = req.params;
    console.log('Publicidade ID:', id);

    const result = await publicidadeModel.registrarMetrica(id, 'clique');
    console.log('Resultado do registro de clique:', result);

    res.json({
      message: 'Clique registrado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro detalhado em registrarClique:', {
      error: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({ message: 'Erro ao registrar clique' });
  }
};

exports.getMetricas = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = 'hoje' } = req.query;
    const metricas = await publicidadeModel.getMetricas(id, periodo);
    res.json({
      message: 'Métricas obtidas com sucesso',
      data: metricas
    });
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ message: 'Erro ao obter métricas' });
  }
};

exports.getPlafondStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await publicidadeModel.getPlafondStatus(id);
    res.json({
      message: 'Status do plafond obtido com sucesso',
      data: status
    });
  } catch (error) {
    console.error('Erro ao obter status do plafond:', error);
    res.status(500).json({ message: 'Erro ao obter status do plafond' });
  }
}; 