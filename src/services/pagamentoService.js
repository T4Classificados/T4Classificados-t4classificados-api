const axios = require("axios");

class PagamentoService {
  static async gerarReferencia(dados, reference_id) {
    //console.log(`Gerando referência: ${reference_id}`);
    //console.log(dados);
    try {
      const response = await axios.put(
        `https://api.proxypay.co.ao/references/${reference_id}`,
        {
          amount: dados.amount,
          end_datetime: dados.end_datetime,
          custom_fields: {
            callback_url: `http://34.224.40.247:4000/api/public/usuarios/pagamento/callback`,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/vnd.proxypay.v2+json",
            Authorization: `Token bnt621i3ssv0a530srorh147k51an9lp`,
          },
        }
      );

      //console.log("Response", response.data);
      //console.log("Response", response.status);

      if (response.status !== 204) {
        console.log(`Erro ao gerar referência: ${response.statusText}`);
      }

      return response.data; // Axios já faz o parse da resposta automaticamente
    } catch (error) {
      console.error("Erro ao gerar referência:", error);
      throw error;
    }
  }
}

module.exports = PagamentoService;
