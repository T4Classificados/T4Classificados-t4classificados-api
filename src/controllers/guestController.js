const guestModel = require('../models/guestModel');
const crypto = require('crypto');

exports.createGuest = async (req, res) => {
  try {
    const { nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId } = req.body;
    const confirmationToken = this.generateConfirmationToken();
    const result = await guestModel.createGuest(nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken);
    
    // Buscar informações do evento
    const eventInfo = await guestModel.getEventInfo(eventoId);

    // Buscar informações do convidado recém-criado
    const guestInfo = await guestModel.getGuestById(result.insertId);

    // Aqui você enviaria um e-mail com o link de confirmação
    const confirmationLink = `https://seusite.com/confirmar-presenca/${confirmationToken}`;
    
    res.status(201).json({ 
      message: 'Convidado adicionado com sucesso', 
      guestId: result.insertId,
      confirmationLink, // Retorne o link apenas para fins de teste. Em produção, você enviaria por e-mail.
      convidado: guestInfo, // Incluindo as informações do convidado na resposta
      evento: eventInfo, // Incluindo as informações do evento na resposta
      randomCode: result.randomCode // Incluindo o código aleatório na resposta
    });
  } catch (error) {
    console.error('Erro ao adicionar convidado:', error);
    res.status(500).json({ message: 'Erro ao adicionar convidado' });
  }
};

exports.getAllGuests = async (req, res) => {
  try {
    const guests = await guestModel.getAllGuests();
    res.json(guests);
  } catch (error) {
    console.error('Erro ao buscar convidados:', error);
    res.status(500).json({ message: 'Erro ao buscar convidados' });
  }
};

exports.getGuestById = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await guestModel.getGuestById(id);
    if (guest) {
      res.json({
        ...guest,
        codigo: guest.codigo // Incluindo o código na resposta
      });
    } else {
      res.status(404).json({ message: 'Convidado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar convidado:', error);
    res.status(500).json({ message: 'Erro ao buscar convidado' });
  }
};

exports.updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Primeiro, obtemos o convidado existente
    const existingGuest = await guestModel.getGuestById(id);
    
    if (!existingGuest) {
      return res.status(404).json({ message: 'Convidado não encontrado' });
    }
    
    // Criamos um objeto com os dados atualizados, mantendo os valores originais se não fornecidos
    const updatedGuest = {
      nome: updateData.nome || existingGuest.nome,
      telefone: updateData.telefone || existingGuest.telefone,
      acompanhante: updateData.acompanhante !== undefined ? updateData.acompanhante : existingGuest.acompanhante,
      numeroAcompanhantes: updateData.numeroAcompanhantes !== undefined ? updateData.numeroAcompanhantes : existingGuest.numero_acompanhantes,
      tipoAcompanhante: updateData.tipoAcompanhante || existingGuest.tipo_acompanhante,
      eventoId: updateData.eventoId || existingGuest.evento_id,
      status: updateData.status || existingGuest.status
    };

    const result = await guestModel.updateGuest(id, updatedGuest);
    if (result.affectedRows > 0) {
      res.json({ message: 'Convidado atualizado com sucesso', guest: updatedGuest });
    } else {
      res.status(404).json({ message: 'Convidado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar convidado:', error);
    res.status(500).json({ message: 'Erro ao atualizar convidado' });
  }
};

exports.deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await guestModel.deleteGuest(id);
    if (result.affectedRows > 0) {
      res.json({ message: 'Convidado excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Convidado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir convidado:', error);
    res.status(500).json({ message: 'Erro ao excluir convidado' });
  }
};

exports.confirmPresence = async (req, res) => {
  try {
    const { token } = req.params;
    const { status } = req.body; // 'aceito' ou 'rejeitado'

    const guest = await guestModel.getGuestByToken(token);

    if (!guest) {
      return res.status(404).json({ message: 'Token inválido ou expirado' });
    }

    if (guest.status !== 'pendente') {
      return res.status(400).json({ message: 'Presença já confirmada ou rejeitada' });
    }

    const result = await guestModel.updateGuestStatus(guest.id, status);

    if (result.affectedRows > 0) {
      res.json({ message: 'Presença confirmada com sucesso' });
    } else {
      res.status(500).json({ message: 'Erro ao confirmar presença' });
    }
  } catch (error) {
    console.error('Erro ao confirmar presença:', error);
    res.status(500).json({ message: 'Erro ao confirmar presença' });
  }
};

exports.generateConfirmationToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

exports.updateGuestStatusByTelefone = async (req, res) => {
  try {
    const { telefone } = req.params;
    const { status } = req.body;

    if (!['aceito', 'rejeitado', 'pendente'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use aceito, rejeitado ou pendente.' });
    }

    const guest = await guestModel.getGuestByTelefone(telefone);

    if (!guest) {
      return res.status(404).json({ message: 'Convidado não encontrado' });
    }

    const result = await guestModel.updateGuestStatusByTelefone(telefone, status);

    if (result.affectedRows > 0) {
      res.json({ message: 'Status do convite atualizado com sucesso' });
    } else {
      res.status(500).json({ message: 'Erro ao atualizar status do convite' });
    }
  } catch (error) {
    console.error('Erro ao atualizar status do convite:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do convite' });
  }
};

exports.getGuestsByUserId = async (req, res) => {
  try {
    const { idUser } = req.params;
    console.log('Buscando convidados para o usuário:', idUser);

    if (!idUser) {
      return res.status(400).json({ message: 'ID do usuário não fornecido' });
    }

    const guests = await guestModel.getGuestsByUserId(idUser);
    console.log('Convidados encontrados:', guests);
    
    if (guests.length === 0) {
      return res.json({ message: 'Nenhum convidado encontrado para este usuário', guests: [] });
    }

    const guestsWithEventInfo = guests.map(guest => ({
      id: guest.id,
      nome: guest.nome,
      telefone: guest.telefone,
      acompanhante: guest.acompanhante,
      numeroAcompanhantes: guest.numero_acompanhantes,
      tipoAcompanhante: guest.tipo_acompanhante,
      status: guest.status,
      codigo: guest.codigo, // Incluindo o código na resposta
      evento: {
        id: guest.evento_id,
        nome: guest.evento_nome,
        event_link: guest.event_link
      }
    }));

    res.json(guestsWithEventInfo);
  } catch (error) {
    console.error('Erro ao buscar convidados do usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar convidados do usuário' });
  }
};

exports.createGuestForUser = async (req, res) => {
  try {
    const { idUser } = req.params;
    const { nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId } = req.body;
    const confirmationToken = crypto.randomBytes(20).toString('hex');
    
    const guestData = { nome, telefone, acompanhante, numeroAcompanhantes, tipoAcompanhante, eventoId, confirmationToken };
    const result = await guestModel.createGuestForUser(idUser, guestData);
    
    const newGuest = await guestModel.getGuestByIdAndUserId(result.insertId, idUser);
    
    res.status(201).json({
      message: 'Convidado adicionado com sucesso',
      guest: newGuest,
      randomCode: result.randomCode // Incluindo o código aleatório na resposta
    });
  } catch (error) {
    console.error('Erro ao adicionar convidado:', error);
    res.status(500).json({ message: 'Erro ao adicionar convidado' });
  }
};

exports.getGuestByIdAndUserId = async (req, res) => {
  try {
    const { idUser, guestId } = req.params;
    const guest = await guestModel.getGuestByIdAndUserId(guestId, idUser);
    if (guest) {
      res.json({
        ...guest,
        codigo: guest.codigo // Incluindo o código na resposta
      });
    } else {
      res.status(404).json({ message: 'Convidado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar convidado:', error);
    res.status(500).json({ message: 'Erro ao buscar convidado' });
  }
};

exports.updateGuestForUser = async (req, res) => {
  try {
    const { idUser, guestId } = req.params;
    const updateData = req.body;
    
    const result = await guestModel.updateGuestForUser(guestId, idUser, updateData);
    if (result.affectedRows > 0) {
      const updatedGuest = await guestModel.getGuestByIdAndUserId(guestId, idUser);
      res.json({ message: 'Convidado atualizado com sucesso', guest: updatedGuest });
    } else {
      res.status(404).json({ message: 'Convidado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar convidado:', error);
    res.status(500).json({ message: 'Erro ao atualizar convidado' });
  }
};

exports.deleteGuestForUser = async (req, res) => {
  try {
    const { idUser, guestId } = req.params;
    const result = await guestModel.deleteGuestForUser(guestId, idUser);
    if (result.affectedRows > 0) {
      res.json({ message: 'Convidado excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Convidado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir convidado:', error);
    res.status(500).json({ message: 'Erro ao excluir convidado' });
  }
};

exports.validateGuestCode = async (req, res) => {
  try {
    const { telefone, codigo } = req.body;

    if (!telefone || !codigo) {
      return res.status(400).json({ message: 'Telefone e código são obrigatórios' });
    }

    const guest = await guestModel.validateGuestCode(telefone, codigo);

    if (guest) {
      res.json({
        valid: true,
        message: 'Código válido',
        guest: {
          id: guest.id,
          nome: guest.nome,
          telefone: guest.telefone,
          status: guest.status,
          evento_id: guest.evento_id,
          codigo: guest.codigo // Incluindo o código na resposta
        }
      });
    } else {
      res.json({
        valid: false,
        message: 'Código inválido ou convidado não encontrado'
      });
    }
  } catch (error) {
    console.error('Erro ao validar código do convidado:', error);
    res.status(500).json({ message: 'Erro ao validar código do convidado' });
  }
};