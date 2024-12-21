const estatisticasModel = require('../models/estatisticasModel');

exports.getAnuncioEstatisticas = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData.userId;

    // Verificar se o anúncio pertence ao usuário
    const estatisticas = await estatisticasModel.getAnuncioEstatisticas(id, userId);

    res.json({
      message: 'Estatísticas obtidas com sucesso',
      data: estatisticas
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do anúncio:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};

exports.getPublicidadeEstatisticas = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData.userId;

    // Verificar se a publicidade pertence ao usuário
    const estatisticas = await estatisticasModel.getPublicidadeEstatisticas(id, userId);

    res.json({
      message: 'Estatísticas obtidas com sucesso',
      data: estatisticas
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas da publicidade:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};

exports.getEstatisticasGerais = async (req, res) => {
  try {
    const estatisticas = await estatisticasModel.getEstatisticasGerais();

    res.json({
      message: 'Estatísticas gerais obtidas com sucesso',
      data: estatisticas
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas gerais:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas gerais' });
  }
}; 