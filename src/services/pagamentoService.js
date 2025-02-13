const fetch = require('node-fetch');

class PagamentoService {
  static async gerarReferencia(dados, reference_id) {
    try {
      const response = await fetch(
        `${process.env.PROXYPAY_API_URL}/references/${reference_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/vnd.proxypay.v2+json",
            Authorization: `Token ${process.env.PROXYPAY_TOKEN}`,
          },
          body: JSON.stringify({
            amount: dados.amount,
            end_datetime: dados.end_datetime,
            custom_fields: {
              callback_url: `${process.env.BASE_URL}/api/public/usuarios/pagamento/callback`,
            },
          }),
        }
      );

      if (!response.ok) {
        console.log(`Erro ao gerar referência: ${response.statusText}`);
      }

      return response.text(reference_id); // ProxyPay retorna a referência como texto
    } catch (error) {
      console.error("Erro ao gerar referência:", error);
      throw error;
    }
  }
}

module.exports = PagamentoService; 