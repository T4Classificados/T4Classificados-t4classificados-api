const db = require('../config/database');

// Estatísticas para donos de anúncios
exports.getEstatisticasAnuncio = async (anuncioId, periodo = 'total') => {
  let dateFilter = '';
  const params = [anuncioId];

  switch (periodo) {
    case 'hoje':
      dateFilter = 'AND DATE(data_hora) = CURDATE()';
      break;
    case 'semana':
      dateFilter = 'AND data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      break;
    case 'mes':
      dateFilter = 'AND data_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      break;
  }

  const query = `
    SELECT 
      COUNT(CASE WHEN tipo = 'partilha' THEN 1 END) as total_partilhas,
      COUNT(CASE WHEN tipo = 'ligacao' THEN 1 END) as total_ligacoes,
      COUNT(CASE WHEN tipo = 'whatsapp' THEN 1 END) as total_whatsapp,
      DATE(data_hora) as data
    FROM anuncio_metricas
    WHERE anuncio_id = ? ${dateFilter}
    GROUP BY DATE(data_hora)
    ORDER BY data DESC`;

  const [rows] = await db.query(query, params);
  return rows;
};

// Estatísticas para anunciantes (publicidade)
exports.getEstatisticasPublicidade = async (publicidadeId, periodo = 'total') => {
  let dateFilter = '';
  const params = [publicidadeId];

  switch (periodo) {
    case 'hoje':
      dateFilter = 'AND DATE(data_hora) = CURDATE()';
      break;
    case 'semana':
      dateFilter = 'AND data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      break;
    case 'mes':
      dateFilter = 'AND data_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      break;
  }

  const query = `
    SELECT 
      COUNT(CASE WHEN tipo = 'clique' THEN 1 END) as total_cliques,
      SUM(custo) as custo_total,
      DATE(data_hora) as data
    FROM publicidade_metricas
    WHERE publicidade_id = ? ${dateFilter}
    GROUP BY DATE(data_hora)
    ORDER BY data DESC`;

  const [rows] = await db.query(query, params);
  return rows;
};

// Estatísticas para administradores
exports.getEstatisticasGerais = async (periodo = 'total') => {
  let dateFilter = '';
  
  switch (periodo) {
    case 'hoje':
      dateFilter = 'AND DATE(created_at) = CURDATE()';
      break;
    case 'semana':
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      break;
    case 'mes':
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      break;
  }

  // Anúncios ativos
  const [anunciosAtivos] = await db.query(
    `SELECT COUNT(*) as total FROM anuncios 
     WHERE status = 'ativo' ${dateFilter}`
  );

  // Novos usuários
  const [novosUsuarios] = await db.query(
    `SELECT COUNT(*) as total FROM usuarios 
     WHERE 1=1 ${dateFilter}`
  );

  // Métricas de tráfego e interações
  const [metricas] = await db.query(`
    SELECT 
      COUNT(CASE WHEN tipo = 'ligacao' THEN 1 END) as total_ligacoes,
      COUNT(CASE WHEN tipo = 'whatsapp' THEN 1 END) as total_whatsapp
    FROM anuncio_metricas
    WHERE 1=1 ${dateFilter}`
  );

  // Métricas de publicidade
  const [metricasPublicidade] = await db.query(`
    SELECT 
      COUNT(CASE WHEN tipo = 'impressao' THEN 1 END) as total_impressoes,
      COUNT(CASE WHEN tipo = 'clique' THEN 1 END) as total_cliques,
      SUM(custo) as receita_total
    FROM publicidade_metricas
    WHERE 1=1 ${dateFilter}`
  );

  return {
    anuncios_ativos: anunciosAtivos[0].total,
    novos_usuarios: novosUsuarios[0].total,
    trafego: {
      ...metricas[0]
    },
    publicidade: {
      ...metricasPublicidade[0]
    }
  };
};

// Desempenho das zonas de publicidade
exports.getDesempenhoZonasPublicidade = async (periodo = 'total') => {
  let dateFilter = '';
  
  switch (periodo) {
    case 'hoje':
      dateFilter = 'AND DATE(pm.data_hora) = CURDATE()';
      break;
    case 'semana':
      dateFilter = 'AND pm.data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      break;
    case 'mes':
      dateFilter = 'AND pm.data_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      break;
  }

  const query = `
    SELECT 
      p.zona_publicidade,
      COUNT(CASE WHEN pm.tipo = 'impressao' THEN 1 END) as total_impressoes,
      COUNT(CASE WHEN pm.tipo = 'clique' THEN 1 END) as total_cliques,
      SUM(pm.custo) as receita_total,
      CASE 
        WHEN COUNT(CASE WHEN pm.tipo = 'impressao' THEN 1 END) > 0 THEN
          (COUNT(CASE WHEN pm.tipo = 'clique' THEN 1 END) * 100.0) / 
          COUNT(CASE WHEN pm.tipo = 'impressao' THEN 1 END)
        ELSE 0
      END as taxa_cliques
    FROM publicidades p
    LEFT JOIN publicidade_metricas pm ON p.id = pm.publicidade_id
    WHERE 1=1 ${dateFilter}
    GROUP BY p.zona_publicidade
    ORDER BY receita_total DESC`;

  const [rows] = await db.query(query);
  return rows;
};

// Adicionar nova função para buscar anúncios semelhantes
exports.getAnunciosSemelhantes = async (anuncioId, limit = 5) => {
  // Primeiro, buscar informações do anúncio atual
  const [anuncioAtual] = await db.query(
    `SELECT categoria_id, subcategoria_id, cidade_id, estado_id, preco
     FROM anuncios 
     WHERE id = ?`,
    [anuncioId]
  );

  if (!anuncioAtual[0]) {
    throw new Error('Anúncio não encontrado');
  }

  const anuncio = anuncioAtual[0];

  // Buscar anúncios semelhantes usando múltiplos critérios
  const query = `
    SELECT 
      a.*,
      u.nome as anunciante_nome,
      c.nome as categoria_nome,
      sc.nome as subcategoria_nome,
      cid.nome as cidade_nome,
      e.nome as estado_nome,
      GROUP_CONCAT(DISTINCT ai.url) as imagens,
      (
        CASE 
          WHEN a.categoria_id = ? THEN 30
          ELSE 0
        END +
        CASE 
          WHEN a.subcategoria_id = ? THEN 20
          ELSE 0
        END +
        CASE 
          WHEN a.cidade_id = ? THEN 30
          ELSE 
            CASE 
              WHEN a.estado_id = ? THEN 15
              ELSE 0
            END
        END +
        CASE 
          WHEN ABS(a.preco - ?) <= (? * 0.2) THEN 20
          WHEN ABS(a.preco - ?) <= (? * 0.4) THEN 10
          ELSE 0
        END
      ) as relevancia_score
    FROM anuncios a
    JOIN usuarios u ON a.user_id = u.id
    JOIN categorias c ON a.categoria_id = c.id
    LEFT JOIN subcategorias sc ON a.subcategoria_id = sc.id
    JOIN cidades cid ON a.cidade_id = cid.id
    JOIN estados e ON a.estado_id = e.id
    LEFT JOIN anuncio_imagens ai ON a.id = ai.anuncio_id
    WHERE a.id != ? 
      AND a.status = 'ativo'
      AND (
        a.categoria_id = ? OR
        a.subcategoria_id = ? OR
        a.cidade_id = ? OR
        a.estado_id = ? OR
        ABS(a.preco - ?) <= (? * 0.4)
      )
    GROUP BY a.id
    HAVING relevancia_score > 0
    ORDER BY relevancia_score DESC, a.created_at DESC
    LIMIT ?`;

  const [anuncios] = await db.query(query, [
    anuncio.categoria_id,
    anuncio.subcategoria_id,
    anuncio.cidade_id,
    anuncio.estado_id,
    anuncio.preco,
    anuncio.preco,
    anuncio.preco,
    anuncio.preco,
    anuncioId,
    anuncio.categoria_id,
    anuncio.subcategoria_id,
    anuncio.cidade_id,
    anuncio.estado_id,
    anuncio.preco,
    anuncio.preco,
    limit
  ]);

  return anuncios.map(anuncio => ({
    ...anuncio,
    imagens: anuncio.imagens ? anuncio.imagens.split(',') : []
  }));
}; 