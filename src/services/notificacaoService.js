const axios = require('axios');

class NotificacaoService {
  static async enviarNotificacao(phoneNumber, message) {
    const urlToSendMessage = process.env.URL_TO_SEND_MESSAGE;
    const API_KEY = process.env.API_TELCOSMS_KEY;

    const payload = {
      message: {
        api_key_app: API_KEY,
        phone_number: phoneNumber,
        message_body: message,
      },
    };
    try {
      const message = await fetch(urlToSendMessage, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("SMS enviado com sucesso:", message.sid);
      return true;
    } catch (error) {
      console.error("Erro ao enviar SMS:", error);
      return false;
    }
  }
}

module.exports = NotificacaoService; 