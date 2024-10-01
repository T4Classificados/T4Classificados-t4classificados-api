const exampleModel = require('../models/exampleModel');

exports.getExample = async (req, res) => {
  try {
    const result = await exampleModel.getExample();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar exemplo' });
  }
};