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

    // Verificar se já existe um convidado com este telefone para este evento
    const guestExists = await eventModel.checkGuestExistsByEventLinkAndPhone(eventLink, telefone);
    if (guestExists) {
      return res.status(400).json({ message: 'Já existe um convidado com este número de telefone para este evento' });
    }

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
    } else if (error.message === 'Já existe um convidado com este número de telefone para este evento') {
      res.status(400).json({ message: error.message });
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

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Criar um buffer para armazenar o PDF
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      let base64Data = pdfData.toString('base64');
      let pdfDataUri = `data:application/pdf;base64,${base64Data}`;

      res.json({
        message: 'PDF gerado com sucesso',
        pdfDataUri: pdfDataUri
      });
    });

    // Adicionar fundo colorido
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f0f0');

    // Adicionar ícone do ConvidaFacil
    const iconPath = path.join(__dirname, "../../assets/convidafacil_icon.png");
    doc.image(iconPath, 50, 45, { width: 50 });

    // Adicionar título e informações do evento
    doc.font('Helvetica-Bold').fontSize(23).fillColor('#333333').text('Lista de convidados', 115, 50);
    doc.fontSize(16).text(event.nome, 115, 80);
    doc.font('Helvetica').fontSize(10).fillColor('#666666').text(`Data: ${new Date(event.data).toLocaleDateString()} - Hora: ${new Date(event.data).toLocaleTimeString()}`, 115, 120);

    // Adicionar linha decorativa
    doc.moveTo(50, 150).lineTo(550, 150).stroke('#cccccc');

    // Adicionar tabela de convidados
    const tableTop = 180;
    let currentTop = tableTop;

    // Cabeçalho da tabela com a cor #4b0082
    doc.rect(40, currentTop - 10, 520, 30).fill('#4b0082');
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff');
    doc.text('Nº', 50, currentTop);
    doc.text('Nome', 100, currentTop);
    doc.text('Telefone', 350, currentTop);
    
    currentTop += 30;

    // Linhas da tabela
    doc.font('Helvetica').fontSize(12).fillColor('#666666');
    guests.forEach((guest, index) => {
      if (currentTop > 700) {
        doc.addPage();
        currentTop = 50;
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f0f0');
      }

      // Alternar cores de fundo para as linhas
      if (index % 2 === 0) {
        doc.rect(40, currentTop - 5, 520, 25).fill('#e6e6e6');
      }

      doc.fillColor('#333333');
      doc.text(index + 1, 50, currentTop);
      doc.text(guest.nome, 100, currentTop);
      doc.text(guest.telefone, 350, currentTop);
      currentTop += 25;

      // Adicionar acompanhantes
      if (guest.acompanhantes && guest.acompanhantes.length > 0) {
        doc.fillColor('#666666').fontSize(10);
        doc.text('Acompanhantes:', 120, currentTop);
        currentTop += 15;
        guest.acompanhantes.forEach((acompanhante, acompIndex) => {
          if (currentTop > 700) {
            doc.addPage();
            currentTop = 50;
            doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f0f0');
          }
          doc.text(`${acompIndex + 1}. ${acompanhante.nome}`, 140, currentTop);
          currentTop += 15;
        });
        currentTop += 5; // Espaço extra após os acompanhantes
      }
    });

    // Adicionar rodapé
    doc.font('Helvetica').fontSize(9).fillColor('#999999');
    const text = "Gerado por ConviteFacil (www.convitefacil.com)";
    const textWidth = doc.widthOfString(text);
    const pageWidth = doc.page.width;
    const x = (pageWidth - textWidth) / 2;

    doc
      .fillColor("#4b0082")
      .text(text, x, 670)
      .link(x, 670, textWidth, 10, "https://www.convitefacil.com");

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF de convidados:', error);
    res.status(500).json({ message: 'Erro ao gerar PDF de convidados' });
  }
};