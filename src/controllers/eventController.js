const eventModel = require('../models/eventModel');
const config = require('../config/config'); // Vamos criar este arquivo de configuração

exports.createEvent = async (req, res) => {
  try {
    const { nome, data, local, tipo } = req.body;
    const imagem = req.file ? req.file.filename : null;
    const userId = req.userData.userId; // Obtém o ID do usuário do token

    const result = await eventModel.createEvent(nome, data, local, tipo, imagem, userId);
    const eventLink = `${config.baseUrl}/evento/${result.eventLink}`;

    res.status(201).json({ 
      message: 'Evento criado com sucesso', 
      eventId: result.insertId,
      eventLink
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro ao criar evento' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await eventModel.getAllEvents();
    const eventsWithImageUrl = events.map(event => ({
      ...event,
      imagemUrl: event.imagem ? `${config.baseUrl}/uploads/${event.imagem}` : null,
      user: {
        id: event.user_id,
        nome: event.user_nome,
        sobrenome: event.user_sobrenome,
        telefone: event.user_telefone
      }
    }));
    res.json(eventsWithImageUrl);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({ message: 'Erro ao buscar eventos' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('ID do evento solicitado:', id); // Adicione este log
    const event = await eventModel.getEventById(id);
    console.log('Evento retornado pelo modelo:', event); // Adicione este log
    if (event) {
      const eventWithImageUrl = {
        ...event,
        imagemUrl: event.imagem ? `${config.baseUrl}/uploads/${event.imagem}` : null,
        user: {
          id: event.user_id,
          nome: event.user_nome,
          sobrenome: event.user_sobrenome,
          telefone: event.user_telefone
        }
      };
      res.json(eventWithImageUrl);
    } else {
      res.status(404).json({ message: 'Evento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ message: 'Erro ao buscar evento' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, data, local, tipo } = req.body;
    const imagem = req.file ? req.file.filename : undefined;
    
    // Primeiro, obtemos o evento existente
    const existingEvent = await eventModel.getEventById(id);
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    // Criamos um objeto com os dados atualizados, mantendo os valores originais se não fornecidos
    const updatedEvent = {
      nome: nome || existingEvent.nome,
      data: data || existingEvent.data,
      local: local || existingEvent.local,
      tipo: tipo || existingEvent.tipo,
      imagem: imagem !== undefined ? imagem : existingEvent.imagem
    };
    
    const result = await eventModel.updateEvent(id, updatedEvent);
    
    if (result.affectedRows > 0) {
      const updatedEventWithUrl = {
        ...updatedEvent,
        id: id,
        imagemUrl: updatedEvent.imagem ? `${config.baseUrl}/uploads/${updatedEvent.imagem}` : null
      };
      res.json({ message: 'Evento atualizado com sucesso', event: updatedEventWithUrl });
    } else {
      res.status(404).json({ message: 'Evento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ message: 'Erro ao atualizar evento' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventModel.deleteEvent(id);
    if (result.affectedRows > 0) {
      res.json({ message: 'Evento excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Evento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    res.status(500).json({ message: 'Erro ao excluir evento' });
  }
};

exports.getEventStatistics = async (req, res) => {
  try {
    const statistics = await eventModel.getEventStatistics();
    if (statistics) {
      res.json(statistics);
    } else {
      res.status(404).json({ message: 'Não foi possível obter as estatísticas' });
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};

exports.getUserEventStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verifique se o usuário tem permissão para acessar essas estatísticas
    if (req.userData.role !== 'admin' && req.userData.userId !== parseInt(userId)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const statistics = await eventModel.getUserEventStatistics(userId);
    if (statistics) {
      res.json(statistics);
    } else {
      res.status(404).json({ message: 'Não foi possível obter as estatísticas do usuário' });
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas do usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas do usuário' });
  }
};

exports.getEventByLink = async (req, res) => {
  try {
    const { eventLink } = req.params;
    const event = await eventModel.getEventByLink(eventLink);
    if (event) {
      const eventWithImageUrl = {
        ...event,
        imagemUrl: event.imagem ? `${config.baseUrl}/uploads/${event.imagem}` : null,
        user: {
          id: event.user_id,
          nome: event.user_nome,
          sobrenome: event.user_sobrenome,
          telefone: event.user_telefone
        }
      };
      res.json(eventWithImageUrl);
    } else {
      res.status(404).json({ message: 'Evento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ message: 'Erro ao buscar evento' });
  }
};