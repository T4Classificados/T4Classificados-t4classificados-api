const estatisticaModel = require('../models/estatisticaModel');
const PDFDocument = require('pdfkit');

exports.getEstatisticasAnuncio = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = 'total', formato } = req.query;
    const userId = req.userData.userId;

    // Verificar se o anúncio pertence ao usuário
    const [anuncio] = await db.query(
      'SELECT user_id FROM anuncios WHERE id = ?',
      [id]
    );

    if (!anuncio || anuncio[0].user_id !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    // Buscar estatísticas e anúncios semelhantes em paralelo
    const [estatisticas, anunciosSemelhantes] = await Promise.all([
      estatisticaModel.getEstatisticasAnuncio(id, periodo),
      estatisticaModel.getAnunciosSemelhantes(id, 5)
    ]);

    if (formato === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=estatisticas-anuncio-${id}.pdf`);
      
      doc.pipe(res);
      
      // Cabeçalho
      doc.fontSize(20).text('Relatório de Estatísticas', { align: 'center' });
      doc.moveDown();
      
      // Dados de estatísticas
      doc.fontSize(16).text('Métricas de Desempenho', { underline: true });
      doc.moveDown();
      
      estatisticas.forEach(stat => {
        doc.fontSize(12).text(`Data: ${stat.data}`);
        doc.fontSize(10)
           .text(`Partilhas: ${stat.total_partilhas}`)
           .text(`Ligações: ${stat.total_ligacoes}`)
           .text(`WhatsApp: ${stat.total_whatsapp}`);
        doc.moveDown();
      });

      // Anúncios semelhantes
      doc.addPage();
      doc.fontSize(16).text('Anúncios Semelhantes', { underline: true });
      doc.moveDown();

      anunciosSemelhantes.forEach(anuncio => {
        doc.fontSize(12).text(`Título: ${anuncio.titulo}`);
        doc.fontSize(10)
           .text(`Categoria: ${anuncio.categoria_nome}`)
           .text(`Localização: ${anuncio.cidade_nome}, ${anuncio.estado_nome}`)
           .text(`Preço: R$ ${anuncio.preco.toFixed(2)}`);
        doc.moveDown();
      });
      
      doc.end();
    } else {
      res.json({
        message: 'Estatísticas obtidas com sucesso',
        data: {
          estatisticas,
          anuncios_semelhantes: anunciosSemelhantes
        }
      });
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};

exports.getEstatisticasPublicidade = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = 'total' } = req.query;
    const userId = req.userData.userId;

    // Verificar se a publicidade pertence ao usuário
    const [publicidade] = await db.query(
      'SELECT user_id FROM publicidades WHERE id = ?',
      [id]
    );

    if (!publicidade || publicidade[0].user_id !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const estatisticas = await estatisticaModel.getEstatisticasPublicidade(id, periodo);

    res.json({
      message: 'Estatísticas obtidas com sucesso',
      data: estatisticas
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};

exports.getEstatisticasGerais = async (req, res) => {
  try {
    const { periodo = 'total' } = req.query;
    
    // Verificar se o usuário é administrador
    if (!req.userData.isAdmin) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    const estatisticas = await estatisticaModel.getEstatisticasGerais(periodo);
    const desempenhoZonas = await estatisticaModel.getDesempenhoZonasPublicidade(periodo);

    res.json({
      message: 'Estatísticas obtidas com sucesso',
      data: {
        geral: estatisticas,
        zonas_publicidade: desempenhoZonas
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
};

exports.getAnunciosSemelhantes = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // Verificar se o anúncio existe
    const [anuncio] = await db.query(
      'SELECT id FROM anuncios WHERE id = ? AND status = "ativo"',
      [id]
    );

    if (!anuncio[0]) {
      return res.status(404).json({ message: 'Anúncio não encontrado' });
    }

    const anunciosSemelhantes = await estatisticaModel.getAnunciosSemelhantes(id, parseInt(limit));

    res.json({
      message: 'Anúncios semelhantes obtidos com sucesso',
      data: {
        total: anunciosSemelhantes.length,
        anuncios: anunciosSemelhantes.map(anuncio => ({
          id: anuncio.id,
          titulo: anuncio.titulo,
          descricao: anuncio.descricao,
          preco: anuncio.preco,
          categoria: {
            nome: anuncio.categoria_nome,
            subcategoria: anuncio.subcategoria_nome
          },
          localizacao: {
            cidade: anuncio.cidade_nome,
            estado: anuncio.estado_nome
          },
          anunciante: anuncio.anunciante_nome,
          imagens: anuncio.imagens,
          relevancia_score: anuncio.relevancia_score,
          created_at: anuncio.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao obter anúncios semelhantes:', error);
    res.status(500).json({ message: 'Erro ao obter anúncios semelhantes' });
  }
}; 