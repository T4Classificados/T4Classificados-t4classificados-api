const eventModel = require('../models/eventModel');
const config = require('../config/config'); // Vamos criar este arquivo de configuração
const dotenv = require('dotenv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

dotenv.config();

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
      imagemUrl: event.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${event.imagem}` : null,
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
        imagemUrl: event.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${event.imagem}` : null,
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
        imagemUrl: updatedEvent.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${updatedEvent.imagem}` : null
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
        imagemUrl: event.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${event.imagem}` : null,
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

exports.getUserEvents = async (req, res) => {
  try {
    const { idUser } = req.params;
    const events = await eventModel.getEventsByUserId(idUser);
    const eventsWithImageUrl = events.map(event => ({
      ...event,
      imagemUrl: event.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${event.imagem}` : null,
      total_convidados: parseInt(event.total_convidados),
      convidados_aceitos: parseInt(event.convidados_aceitos),
      convidados_rejeitados: parseInt(event.convidados_rejeitados),
      convidados_pendentes: parseInt(event.convidados_pendentes)
    }));
    res.json(eventsWithImageUrl);
  } catch (error) {
    console.error('Erro ao buscar eventos do usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar eventos do usuário' });
  }
};

exports.createUserEvent = async (req, res) => {
  try {
    const { idUser } = req.params;
    const { nome, data, local, tipo, privacidade } = req.body;
    const imagem = req.file ? req.file.filename : null;

    const result = await eventModel.createEvent(nome, data, local, tipo, imagem, idUser, privacidade);
    const eventLink = `${config.baseUrl}/evento/${result.eventLink}`;

    res.status(201).json({ 
      message: 'Evento criado com sucesso', 
      eventId: result.insertId,
      eventLink,
      privacidade
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro ao criar evento' });
  }
};

exports.getUserEventById = async (req, res) => {
  try {
    const { idUser, eventId } = req.params;
    const event = await eventModel.getUserEventById(idUser, eventId);
    if (event) {
      const eventWithImageUrl = {
        ...event,
        imagemUrl: event.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${event.imagem}` : null,
        total_convidados: parseInt(event.total_convidados),
        convidados_aceitos: parseInt(event.convidados_aceitos),
        convidados_rejeitados: parseInt(event.convidados_rejeitados),
        convidados_pendentes: parseInt(event.convidados_pendentes)
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

exports.updateUserEvent = async (req, res) => {
  try {
    const { idUser, eventId } = req.params;
    const { nome, data, local, tipo, privacidade } = req.body;
    const imagem = req.file ? req.file.filename : undefined;
    
    const existingEvent = await eventModel.getUserEventById(idUser, eventId);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    
    const updatedEvent = {
      nome: nome || existingEvent.nome,
      data: data || existingEvent.data,
      local: local || existingEvent.local,
      tipo: tipo || existingEvent.tipo,
      imagem: imagem !== undefined ? imagem : existingEvent.imagem,
      privacidade: privacidade || existingEvent.privacidade
    };
    
    const result = await eventModel.updateUserEvent(idUser, eventId, updatedEvent);
    
    if (result.affectedRows > 0) {
      const updatedEventWithUrl = {
        ...updatedEvent,
        id: eventId,
        imagemUrl: updatedEvent.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${updatedEvent.imagem}` : null
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

exports.deleteUserEvent = async (req, res) => {
  try {
    const { idUser, eventId } = req.params;
    const result = await eventModel.deleteUserEvent(idUser, eventId);
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

exports.checkGuestByEventAndPhone = async (req, res) => {
  try {
    const { eventId, telefone } = req.params;
    const guest = await eventModel.checkGuestByEventAndPhone(eventId, telefone);
    
    if (guest) {
      res.json({
        isInvited: true,
        guest: {
          id: guest.id,
          nome: guest.nome,
          telefone: guest.telefone,
          status: guest.status,
          // Adicione outros campos relevantes do convidado aqui
        }
      });
    } else {
      res.json({ isInvited: false });
    }
  } catch (error) {
    console.error('Erro ao verificar convidado:', error);
    res.status(500).json({ message: 'Erro ao verificar convidado' });
  }
};

exports.checkGuestByEventLinkAndPhone = async (req, res) => {
  try {
    const { eventLink, telefone } = req.params;
    const guest = await eventModel.checkGuestByEventLinkAndPhone(eventLink, telefone);
    
    if (guest) {
      // Buscar acompanhantes
      const acompanhantes = await eventModel.getAccompanistsByGuestId(guest.id);

      res.json({
        isInvited: true,
        guest: {
          id: guest.id,
          nome: guest.nome,
          telefone: guest.telefone,
          status: guest.status,
          acompanhantes: acompanhantes || []
        }
      });
    } else {
      res.json({ isInvited: false });
    }
  } catch (error) {
    console.error('Erro ao verificar convidado:', error);
    res.status(500).json({ message: 'Erro ao verificar convidado' });
  }
};

exports.getRecentUserEvents = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Buscando eventos recentes para o usuário:', userId);

    const events = await eventModel.getRecentEventsByUserId(userId);
    console.log('Eventos encontrados:', events);

    if (!events || events.length === 0) {
      return res.status(404).json({ message: 'Nenhum evento recente encontrado para este usuário' });
    }

    const eventsWithImageUrl = events.map(event => ({
      ...event,
      imagemUrl: event.imagem ? `${config.baseUrl}:${process.env.PORT}/uploads/${event.imagem}` : null,
      total_convidados: parseInt(event.total_convidados) || 0,
      convidados_aceitos: parseInt(event.convidados_aceitos) || 0,
      convidados_rejeitados: parseInt(event.convidados_rejeitados) || 0,
      convidados_pendentes: parseInt(event.convidados_pendentes) || 0
    }));
    res.json(eventsWithImageUrl);
  } catch (error) {
    console.error('Erro ao buscar eventos recentes do usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar eventos recentes do usuário' });
  }
};

exports.addGuestByEventLink = async (req, res) => {
  try {
    const { eventLink } = req.params;
    const { nome, telefone, acompanhantes } = req.body;

    const result = await eventModel.addGuestByEventLink(eventLink, { nome, telefone, acompanhantes });
    
    res.status(201).json({
      message: 'Convidado adicionado com sucesso',
      guestId: result.insertId,
      eventoId: result.eventoId,
      randomCode: result.randomCode
    });
  } catch (error) {
    console.error('Erro ao adicionar convidado:', error);
    if (error.message === 'Evento não encontrado') {
      res.status(404).json({ message: 'Evento não encontrado' });
    } else {
      res.status(500).json({ message: 'Erro ao adicionar convidado' });
    }
  }
};

exports.checkGuestByEventLink = async (req, res) => {
  try {
    const { eventLink, telefone } = req.params;
    const guest = await eventModel.checkGuestByEventLink(eventLink, telefone);
    
    if (guest) {
      res.json({
        exists: true,
        guest: {
          id: guest.id,
          nome: guest.nome,
          telefone: guest.telefone,
          status: guest.status,
          codigo: guest.codigo,
          acompanhante: guest.acompanhante === 1, // Convertendo para booleano
          acompanhantes: guest.acompanhantes || [] // Incluindo a lista de acompanhantes
        }
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Erro ao verificar convidado:', error);
    res.status(500).json({ message: 'Erro ao verificar convidado' });
  }
};

exports.generateGuestListPDF = async (req, res) => {
  try {
    const { eventId } = req.params;
    const guests = await eventModel.getAcceptedGuestsByEventId(eventId);
    const event = await eventModel.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    const doc = new PDFDocument();
    const filename = `guest_list_${eventId}.pdf`;
    const filePath = path.join(__dirname, '../../uploads', filename);

    doc.pipe(fs.createWriteStream(filePath));

    // Adicionar conteúdo ao PDF
    doc.fontSize(18).text(`Lista de Convidados - ${event.nome}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Data: ${new Date(event.data).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    guests.forEach((guest, index) => {
      doc.text(`${index + 1}. ${guest.nome} - ${guest.telefone}`);
      if (guest.acompanhantes && guest.acompanhantes.length > 0) {
        guest.acompanhantes.forEach(acompanhante => {
          doc.text(`   - ${acompanhante.nome}`, { indent: 20 });
        });
      }
      doc.moveDown();
    });

    doc.end();

    res.json({
      message: 'PDF gerado com sucesso',
      pdfUrl: `${req.protocol}://${req.get('host')}/uploads/${filename}`
    });
  } catch (error) {
    console.error('Erro ao gerar PDF de convidados:', error);
    res.status(500).json({ message: 'Erro ao gerar PDF de convidados' });
  }
};