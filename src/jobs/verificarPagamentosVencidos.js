const db = require("../config/database");

const cron = require("node-cron");
const userModel = require("../models/userModel");
const NotificacaoService = require("../services/notificacaoService");
const PagamentoModel = require("../models/pagamentoModel");
const PagamentoService = require("../services/pagamentoService");

function gerarReferenciaPagamento(telefone) {
  // Remove o prefixo +244 e qualquer outro caractere não numérico
  const numeroLimpo = telefone.replace(/\D/g, "").replace(/^244/, "");
  return numeroLimpo;
}

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

async function verificarPagamentosVencidos() {
  try {
    // Busca usuários que estão próximos do vencimento (3 dias antes)
    const [usuariosProximosVencimento] = await db.query(
      `SELECT id, nome, sobrenome, telefone, data_pagamento_mensal, DATEDIFF(data_pagamento_mensal, CURDATE() - INTERVAL 1 DAY) as dias_para_vencer
       FROM usuarios 
       WHERE 
         is_active = true 
         AND data_pagamento_mensal IS NOT NULL`
    );

    // Envia notificação para usuários próximos do vencimento
    for (const usuario of usuariosProximosVencimento) {
      if (usuario.dias_para_vencer === -27) {
        await NotificacaoService.enviarNotificacao(
          usuario.telefone,
          `Olá ${usuario.nome} ${usuario.sobrenome}, sua mensalidade vence em 3 dias.`
        );
      }
      if (usuario.dias_para_vencer === -30) {
        await NotificacaoService.enviarNotificacao(
          usuario.telefone,
          `Olá ${usuario.nome} ${usuario.sobrenome}, sua mensalidade vence hoje. Será enviado um SMS para o número ${usuario.telefone} para solicitar o pagamento assim que vencer.`
        );
      }
      if (usuario.dias_para_vencer === -31) {
        await userModel.desativarUsuario(usuario.id);
    
        const valorAtivacao = "2500.00";
        const dataLimite = new Date();
        dataLimite.setHours(dataLimite.getHours() + 720);

        // Gerar referência no ProxyPay
        await PagamentoService.gerarReferencia(
          {
            amount: valorAtivacao,
            end_datetime: dataLimite.toISOString(),
            custom_fields: {
              callback_url: `${process.env.BASE_URL}/api/public/usuarios/pagamento/callback`,
            },
          },
          gerarReferenciaPagamento(usuario.telefone)
        );

        const entidade = "00940";

        // Montar mensagem SMS
        const mensagem =
          `T4 Classificados\n` +
          `A tua substituicao mensal terminou\n\n` +
          `Escolha os canais abaixo para ativar novamente:\n\n` +
          `Faca no Multicaixa Express, ATM ou Internet banking\n\n` +
          `Escolha a opcao pagamentos, pagamentos por referencia e introduza os dados abaixo:\n\n` +
          `Entidade: ${entidade}\n` +
          `Referencia: ${gerarReferenciaPagamento(usuario.telefone)}\n` +
          `Valor: ${formatarValor(valorAtivacao)} Kz`;

        await NotificacaoService.enviarNotificacao(usuario.telefone, mensagem);

        // Salvar referência na tabela de pagamentos como pendente
        await PagamentoModel.registrar(
          "renovacao_usuario",
          gerarReferenciaPagamento(usuario.telefone),
          {
            reference_id: gerarReferenciaPagamento(usuario.telefone),
            transaction_id: null,
            amount: valorAtivacao,
            status: "pendente",
            user_id: usuario.id
          }
        );

      }
    }
  } catch (error) {
    console.error("Erro ao verificar pagamentos vencidos:", error);
  }
}

// Executa todos os dias à meia-noite
cron.schedule("0 8 * * *", verificarPagamentosVencidos);
// cron.schedule('0 0 * * *', verificarPagamentosVencidos);

module.exports = verificarPagamentosVencidos;
