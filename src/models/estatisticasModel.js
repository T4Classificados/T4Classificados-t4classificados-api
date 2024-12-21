const db = require('../config/database');

exports.getAnuncioEstatisticas = async (anuncioId, userId) => {
  const [rows] = await db.query(
    `SELECT 
       a.*,
       COUNT(DISTINCT v.ip) as visitantes_unicos,
       COUNT(c.id) as total_contatos
     FROM anuncios a
     LEFT JOIN visualizacoes v ON a.id = v.anuncio_id
     LEFT JOIN contatos c ON a.id = c.anuncio_id
     WHERE a.id = ? AND a.user_id = ?
     GROUP BY a.id`,
    [anuncioId, userId]
  );

  return rows[0];
};

exports.getPublicidadeEstatisticas = async (publicidadeId, userId) => {
  const [rows] = await db.query(
    `SELECT 
       p.*,
       COUNT(CASE WHEN pm.tipo = 'impressao' THEN 1 END) as total_impressoes,
       COUNT(CASE WHEN pm.tipo = 'clique' THEN 1 END) as total_cliques,
       SUM(pm.custo) as custo_total,
       (p.plafond_maximo - p.plafond_consumido) as saldo_restante
     FROM publicidades p
     LEFT JOIN publicidade_metricas pm ON p.id = pm.publicidade_id
     WHERE p.id = ? AND p.user_id = ?
     GROUP BY p.id`,
    [publicidadeId, userId]
  );

  return rows[0];
};

exports.getEstatisticasGerais = async () => {
  const [rows] = await db.query(
    `SELECT 
       (SELECT COUNT(*) FROM usuarios) as total_usuarios,
       (SELECT COUNT(*) FROM anuncios) as total_anuncios,
       (SELECT COUNT(*) FROM publicidades WHERE status = 'aprovado') as publicidades_ativas,
       (SELECT COUNT(*) FROM contatos) as total_contatos,
       (SELECT COUNT(DISTINCT ip) FROM visualizacoes) as visitantes_unicos`
  );

  return rows[0];
};
  