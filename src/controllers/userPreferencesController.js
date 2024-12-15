const userPreferencesModel = require('../models/userPreferencesModel');

exports.getPreferences = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const preferences = await userPreferencesModel.getOrCreate(userId);

    res.json({
      message: 'Preferências obtidas com sucesso',
      preferences
    });
  } catch (error) {
    console.error('Erro ao obter preferências:', error);
    res.status(500).json({ message: 'Erro ao obter preferências' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const updateData = {
      notificacoes_promocoes: !!req.body.notificacoes_promocoes,
      alertas_emprego: !!req.body.alertas_emprego
    };

    await userPreferencesModel.getOrCreate(userId); // Garantir que existe
    const success = await userPreferencesModel.updatePreferences(userId, updateData);

    if (!success) {
      return res.status(400).json({ message: 'Erro ao atualizar preferências' });
    }

    const updatedPreferences = await userPreferencesModel.getPreferences(userId);

    res.json({
      message: 'Preferências atualizadas com sucesso',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({ message: 'Erro ao atualizar preferências' });
  }
}; 