const db = require('../config/database');
const config = require('../config/config');
const path = require('path');

const formatarContatoParaExibicao = (objetivo, contato) => {
  switch (objetivo) {
    case 'whatsapp':
      // Remove caracteres não numéricos e adiciona prefixo internacional se necessário
      const numero = contato.replace(/\D/g, '');
      return numero.startsWith('55') ? numero : `55${numero}`;
    case 'ligacao':
      // Formata número para exibição (ex: (11) 98765-4321)
      const tel = contato.replace(/\D/g, '');
      return tel.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    case 'site':
      // Garante que a URL tem o protocolo
      return contato.startsWith('http') ? contato : `https://${contato}`;
    default:
      return contato;
  }
};

const getCTATexto = (objetivo) => {
  switch (objetivo) {
    case 'whatsapp':
      return 'Envie uma mensagem no WhatsApp';
    case 'ligacao':
      return 'Ligue agora';
    case 'site':
      return 'Visite o site';
    default:
      return '';
  }
};

exports.createPublicidade = async (userId, dados, imagens) => {
  console.log('=== Iniciando createPublicidade no model ===');
  console.log('Dados recebidos:', { userId, dados, imagens });

  // Garantir que existem custos padrão antes de criar a publicidade
  await exports.garantirCustosPadrao();

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('Transação iniciada');

    // Obter o custo atual para o modelo de cobrança escolhido
    const [custoAtual] = await connection.query(
      `SELECT valor 
       FROM publicidade_custos 
       WHERE tipo = ? AND data_fim IS NULL 
       ORDER BY data_inicio DESC 
       LIMIT 1`,
      [dados.modelo_cobranca || 'cpc']
    );

    if (!custoAtual[0]) {
      throw new Error(`Custo não configurado para o modelo ${dados.modelo_cobranca}`);
    }

    // Inserir publicidade com valores padrão para campos de controle
    const [result] = await connection.query(
      `INSERT INTO publicidades (
        user_id, titulo, objetivo, contato, 
        plafond_maximo, plafond_diario, 
        plafond_consumido, plafond_consumido_hoje,
        data_inicio, data_fim, modelo_cobranca,
        custo_unitario, 
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 'pendente', NOW())`,
      [
        userId,
        dados.titulo,
        dados.objetivo,
        dados.contato,
        dados.plafond_maximo || 0,
        dados.plafond_diario || null,
        dados.data_inicio,
        dados.data_fim,
        dados.modelo_cobranca || 'cpc',
        custoAtual[0].valor
      ]
    );

    const publicidadeId = result.insertId;
    console.log('Publicidade inserida com ID:', publicidadeId);

    // Inserir imagens
    if (imagens && imagens.length > 0) {
      const imageValues = imagens.map((url, index) => [
        publicidadeId, 
        `/uploads/${path.basename(url)}`,
        index + 1
      ]);
      await connection.query(
        'INSERT INTO publicidade_imagens (publicidade_id, url, ordem) VALUES ?',
        [imageValues]
      );
      console.log('Imagens inseridas');
    }

    await connection.commit();
    console.log('Transação confirmada');

    return publicidadeId;
  } catch (error) {
    console.error('Erro na criação da publicidade:', error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Função auxiliar para formatar URLs de imagens
function formatImageUrls(images) {
  if (!images) return [];
  return images.split(',').map(image => {
    // Se a imagem já começa com http ou https, retorna como está
    if (image.startsWith('http')) {
      return image;
    }
    // Se a imagem já começa com /uploads, adiciona apenas a baseUrl
    if (image.startsWith('/uploads')) {
      return `${config.baseUrl}${image}`;
    }
    // Caso contrário, adiciona o caminho completo
    return `${config.baseUrl}/uploads/${image}`;
  });
}

exports.getPublicidades = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT p.*, u.nome as anunciante_nome, 
           GROUP_CONCAT(pi.url ORDER BY pi.ordem) as imagens
    FROM publicidades p
    JOIN usuarios u ON p.user_id = u.id
    LEFT JOIN publicidade_imagens pi ON p.id = pi.publicidade_id
    WHERE 1=1
  `;
  const queryParams = [];

  if (filters.userId) {
    query += ' AND p.user_id = ?';
    queryParams.push(filters.userId);
  }

  if (filters.status) {
    query += ' AND p.status = ?';
    queryParams.push(filters.status);
  }

  query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const [rows] = await db.query(query, queryParams);
  return rows.map(row => ({
    ...row,
    imagens: formatImageUrls(row.imagens)
  }));
};

exports.getPublicidadeById = async (id) => {
  const [rows] = await db.query(
    `SELECT p.*, u.nome as anunciante_nome,
            GROUP_CONCAT(pi.url ORDER BY pi.ordem) as imagens
     FROM publicidades p
     JOIN usuarios u ON p.user_id = u.id
     LEFT JOIN publicidade_imagens pi ON p.id = pi.publicidade_id
     WHERE p.id = ?
     GROUP BY p.id`,
    [id]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    imagens: formatImageUrls(rows[0].imagens)
  };
};

exports.updateStatus = async (id, status, motivo_rejeicao = null) => {
  const [result] = await db.query(
    `UPDATE publicidades 
     SET status = ?, motivo_rejeicao = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, motivo_rejeicao, id]
  );

  return result.affectedRows > 0;
};

exports.deletePublicidade = async (id, userId) => {
  const [result] = await db.query(
    'DELETE FROM publicidades WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};

exports.getPublicidadesPendentes = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT p.*, u.nome as anunciante_nome, u.telefone as anunciante_telefone,
           GROUP_CONCAT(pi.url ORDER BY pi.ordem) as imagens
    FROM publicidades p
    JOIN usuarios u ON p.user_id = u.id
    LEFT JOIN publicidade_imagens pi ON p.id = pi.publicidade_id
    WHERE p.status = 'pendente'
    GROUP BY p.id
    ORDER BY p.created_at ASC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(query, [limit, offset]);
  
  // Contar total de pendentes para paginação
  const [totalRows] = await db.query(
    'SELECT COUNT(*) as total FROM publicidades WHERE status = ?',
    ['pendente']
  );

  return {
    publicidades: rows.map(row => ({
      ...row,
      imagens: formatImageUrls(row.imagens)
    })),
    total: totalRows[0].total
  };
};

exports.solicitarAlteracao = async (id, solicitacao) => {
  const [result] = await db.query(
    `UPDATE publicidades 
     SET status = 'alteracao_solicitada', 
         motivo_alteracao = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [solicitacao, id]
  );

  return result.affectedRows > 0;
};

exports.atualizarPublicidade = async (id, userId, publicidadeData, novasImagens = null) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      titulo,
      objetivo,
      contato,
      plafond_maximo,
      data_inicio,
      data_fim
    } = publicidadeData;

    // Atualizar dados principais
    await connection.query(
      `UPDATE publicidades 
       SET titulo = ?, 
           objetivo = ?,
           contato = ?,
           plafond_maximo = ?,
           data_inicio = ?,
           data_fim = ?,
           status = 'pendente',
           motivo_alteracao = NULL,
           updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [titulo, objetivo, contato, plafond_maximo, data_inicio, data_fim, id, userId]
    );

    // Se houver novas imagens, atualizar
    if (novasImagens) {
      // Remover imagens antigas
      await connection.query(
        'DELETE FROM publicidade_imagens WHERE publicidade_id = ?',
        [id]
      );

      // Inserir novas imagens
      for (let i = 0; i < novasImagens.length; i++) {
        await connection.query(
          `INSERT INTO publicidade_imagens (publicidade_id, url, ordem)
           VALUES (?, ?, ?)`,
          [id, novasImagens[i], i + 1]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.registrarMetrica = async (publicidadeId, tipo, connection = null) => {
  const shouldReleaseConnection = !connection;
  connection = connection || await db.getConnection();

  try {
    // Obter publicidade
    const [publicidade] = await connection.query(
      `SELECT p.*, pc.valor as custo_unitario
       FROM publicidades p
       JOIN publicidade_custos pc ON pc.tipo = LOWER(p.modelo_cobranca)
       WHERE p.id = ? AND pc.data_fim IS NULL`,
      [publicidadeId]
    );

    if (!publicidade[0]) {
      throw new Error('Publicidade não encontrada');
    }

    const pub = publicidade[0];
    
    // Calcular custo da métrica
    let custo = 0;
    if (pub.modelo_cobranca.toLowerCase() === 'cpm' && tipo === 'impressao') {
      custo = pub.custo_unitario / 1000; // CPM é por mil impressões
    } else if (pub.modelo_cobranca.toLowerCase() === 'cpc' && tipo === 'clique') {
      custo = pub.custo_unitario;
    }

    // Verificar limites
    const plafondRestante = pub.plafond_maximo - pub.plafond_consumido;
    if (plafondRestante < custo) {
      throw new Error('Plafond máximo atingido');
    }

    // Verificar limite diário
    const hoje = new Date().toISOString().split('T')[0];
    let plafondDiarioRestante = null;
    
    if (pub.plafond_diario) {
      if (pub.ultima_atualizacao_diaria !== hoje) {
        // Resetar contador diário
        await connection.query(
          `UPDATE publicidades 
           SET plafond_consumido_hoje = 0,
               ultima_atualizacao_diaria = ?
           WHERE id = ?`,
          [hoje, publicidadeId]
        );
        pub.plafond_consumido_hoje = 0;
      }

      plafondDiarioRestante = pub.plafond_diario - pub.plafond_consumido_hoje;
      if (plafondDiarioRestante < custo) {
        throw new Error('Limite diário atingido');
      }
    }

    await connection.beginTransaction();

    // Registrar métrica
    await connection.query(
      `INSERT INTO publicidade_metricas (publicidade_id, tipo, custo)
       VALUES (?, ?, ?)`,
      [publicidadeId, tipo, custo]
    );

    // Atualizar plafonds
    await connection.query(
      `UPDATE publicidades 
       SET plafond_consumido = plafond_consumido + ?,
           plafond_consumido_hoje = plafond_consumido_hoje + ?
       WHERE id = ?`,
      [custo, custo, publicidadeId]
    );

    await connection.commit();
    return { custo, plafondRestante: plafondRestante - custo };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (shouldReleaseConnection) {
      connection.release();
    }
  }
};

exports.getMetricas = async (publicidadeId, periodo = 'hoje') => {
  let dateFilter = '';
  const params = [publicidadeId];

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

  const [rows] = await db.query(
    `SELECT 
       COUNT(CASE WHEN tipo = 'impressao' THEN 1 END) as total_impressoes,
       COUNT(CASE WHEN tipo = 'clique' THEN 1 END) as total_cliques,
       SUM(custo) as custo_total,
       DATE(data_hora) as data
     FROM publicidade_metricas pm
     WHERE publicidade_id = ? ${dateFilter}
     GROUP BY DATE(data_hora)
     ORDER BY data DESC`,
    params
  );

  return rows;
};

exports.getPlafondStatus = async (publicidadeId) => {
  const [rows] = await db.query(
    `SELECT 
       p.*,
       (p.plafond_maximo - p.plafond_consumido) as plafond_restante,
       CASE 
         WHEN p.ultima_atualizacao_diaria = CURDATE() THEN p.plafond_consumido_hoje
         ELSE 0
       END as consumo_hoje,
       CASE 
         WHEN p.ultima_atualizacao_diaria = CURDATE() THEN (p.plafond_diario - p.plafond_consumido_hoje)
         ELSE p.plafond_diario
       END as plafond_diario_restante
     FROM publicidades p
     WHERE p.id = ?`,
    [publicidadeId]
  );

  return rows[0];
};

exports.getPublicidadeParaExibicao = async (id) => {
  const [rows] = await db.query(
    `SELECT p.*, u.nome as anunciante_nome,
            GROUP_CONCAT(pi.url ORDER BY pi.ordem) as imagens
     FROM publicidades p
     JOIN usuarios u ON p.user_id = u.id
     LEFT JOIN publicidade_imagens pi ON p.id = pi.publicidade_id
     WHERE p.id = ? AND p.status = 'aprovado'
       AND p.data_inicio <= CURDATE()
       AND p.data_fim >= CURDATE()
     GROUP BY p.id`,
    [id]
  );

  if (!rows[0]) return null;

  const publicidade = {
    ...rows[0],
    imagens: formatImageUrls(rows[0].imagens),
    acao: {
      tipo: rows[0].objetivo,
      texto: rows[0].cta_texto,
      url: getAcaoURL(rows[0].objetivo, rows[0].contato)
    }
  };

  return publicidade;
};

const getAcaoURL = (objetivo, contato) => {
  switch (objetivo) {
    case 'whatsapp':
      return `https://wa.me/${contato}`;
    case 'ligacao':
      return `tel:${contato.replace(/\D/g, '')}`;
    case 'site':
      return contato;
    default:
      return '';
  }
};

exports.getPublicidadesAnunciante = async (userId, filtros = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT p.*,
           GROUP_CONCAT(pi.url ORDER BY pi.ordem) as imagens,
           COUNT(DISTINCT CASE WHEN pm.tipo = 'impressao' THEN pm.id END) as total_impressoes,
           COUNT(DISTINCT CASE WHEN pm.tipo = 'clique' THEN pm.id END) as total_cliques,
           (p.plafond_maximo - p.plafond_consumido) as saldo_restante
    FROM publicidades p
    LEFT JOIN publicidade_imagens pi ON p.id = pi.publicidade_id
    LEFT JOIN publicidade_metricas pm ON p.id = pm.publicidade_id
    WHERE p.user_id = ?
  `;
  const queryParams = [userId];

  // Filtrar por status
  if (filtros.status) {
    query += ' AND p.status = ?';
    queryParams.push(filtros.status);
  }

  // Filtrar por período
  if (filtros.periodo) {
    switch (filtros.periodo) {
      case 'ativas':
        query += ' AND p.status = "aprovado" AND p.data_inicio <= CURDATE() AND p.data_fim >= CURDATE()';
        break;
      case 'pendentes':
        query += ' AND (p.status = "pendente" OR p.status = "alteracao_solicitada")';
        break;
      case 'encerradas':
        query += ' AND (p.data_fim < CURDATE() OR p.status = "finalizado")';
        break;
    }
  }

  query += ` GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);

  const [rows] = await db.query(query, queryParams);

  // Contar total para paginação
  const [totalRows] = await db.query(
    'SELECT COUNT(*) as total FROM publicidades WHERE user_id = ?',
    [userId]
  );

  return {
    publicidades: rows.map(row => ({
      ...row,
      imagens: formatImageUrls(row.imagens)
    })),
    total: totalRows[0].total
  };
};

exports.getDesempenhoCampanha = async (publicidadeId, periodo = 'total') => {
  let dateFilter = '';
  const params = [publicidadeId];

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
      p.*,
      (p.plafond_maximo - p.plafond_consumido) as saldo_restante,
      COUNT(DISTINCT CASE WHEN pm.tipo = 'impressao' THEN pm.id END) as total_impressoes,
      COUNT(DISTINCT CASE WHEN pm.tipo = 'clique' THEN pm.id END) as total_cliques,
      SUM(pm.custo) as custo_total,
      CASE 
        WHEN COUNT(DISTINCT CASE WHEN pm.tipo = 'impressao' THEN pm.id END) > 0 THEN
          (COUNT(DISTINCT CASE WHEN pm.tipo = 'clique' THEN pm.id END) * 100.0) / 
          COUNT(DISTINCT CASE WHEN pm.tipo = 'impressao' THEN pm.id END)
        ELSE 0
      END as taxa_cliques
    FROM publicidades p
    LEFT JOIN publicidade_metricas pm ON p.id = pm.publicidade_id
    WHERE p.id = ? ${dateFilter}
    GROUP BY p.id`;

  const [rows] = await db.query(query, params);
  return rows[0];
};

exports.renovarCampanha = async (id, userId, dadosRenovacao) => {
  const {
    plafond_adicional,
    nova_data_fim,
    plafond_diario
  } = dadosRenovacao;

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verificar se a campanha existe e pertence ao usuário
    const [campanha] = await connection.query(
      'SELECT * FROM publicidades WHERE id = ? AND user_id = ? AND status = "aprovado"',
      [id, userId]
    );

    if (!campanha[0]) {
      throw new Error('Campanha não encontrada ou não disponível para renovação');
    }

    // Atualizar plafond e data
    const updates = [];
    const params = [];

    if (plafond_adicional) {
      updates.push('plafond_maximo = plafond_maximo + ?');
      params.push(plafond_adicional);
    }

    if (nova_data_fim) {
      updates.push('data_fim = ?');
      params.push(nova_data_fim);
    }

    if (plafond_diario !== undefined) {
      updates.push('plafond_diario = ?');
      params.push(plafond_diario);
    }

    if (updates.length > 0) {
      await connection.query(
        `UPDATE publicidades 
         SET ${updates.join(', ')},
             updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [...params, id, userId]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getCustoAtual = async (tipo) => {
  const [rows] = await db.query(
    `SELECT valor 
     FROM publicidade_custos 
     WHERE tipo = ? AND data_fim IS NULL 
     ORDER BY data_inicio DESC 
     LIMIT 1`,
    [tipo]
  );
  return rows[0]?.valor;
};

exports.atualizarCusto = async (tipo, novoValor) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Finalizar custo atual
    await connection.query(
      `UPDATE publicidade_custos 
       SET data_fim = CURDATE()
       WHERE tipo = ? AND data_fim IS NULL`,
      [tipo]
    );

    // Inserir novo custo
    await connection.query(
      `INSERT INTO publicidade_custos (tipo, valor, data_inicio)
       VALUES (?, ?, CURDATE())`,
      [tipo, novoValor]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Adicionar função para garantir custos padrão
exports.garantirCustosPadrao = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar se já existem custos configurados
    const [custosExistentes] = await connection.query(
      `SELECT tipo FROM publicidade_custos WHERE data_fim IS NULL`
    );

    // Se não existir custo para CPC, criar
    if (!custosExistentes.find(c => c.tipo === 'cpc')) {
      await connection.query(
        `INSERT INTO publicidade_custos (tipo, valor, data_inicio)
         VALUES ('cpc', 1, CURDATE())`
      );
    }

    // Se não existir custo para CPM, criar
    if (!custosExistentes.find(c => c.tipo === 'cpm')) {
      await connection.query(
        `INSERT INTO publicidade_custos (tipo, valor, data_inicio)
         VALUES ('cpm', 0.50, CURDATE())`
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getPublicidadesPublicas = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT 
      p.id, 
      p.titulo, 
      p.objetivo, 
      p.contato,
      u.nome as anunciante_nome,
      GROUP_CONCAT(pi.url ORDER BY pi.ordem) as imagens
    FROM publicidades p
    JOIN usuarios u ON p.user_id = u.id
    LEFT JOIN publicidade_imagens pi ON p.id = pi.publicidade_id
    WHERE p.status = 'aprovado'
      AND p.data_inicio <= CURDATE()
      AND p.data_fim >= CURDATE()
      AND p.plafond_maximo > p.plafond_consumido
      AND (p.plafond_diario IS NULL OR p.plafond_consumido_hoje < p.plafond_diario)
    GROUP BY p.id
    ORDER BY RAND()
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(query, [limit, offset]);

  // Contar total para paginação
  const [totalRows] = await db.query(
    `SELECT COUNT(*) as total 
     FROM publicidades p
     WHERE p.status = 'aprovado'
       AND p.data_inicio <= CURDATE()
       AND p.data_fim >= CURDATE()
       AND p.plafond_maximo > p.plafond_consumido
       AND (p.plafond_diario IS NULL OR p.plafond_consumido_hoje < p.plafond_diario)`
  );

  return {
    publicidades: rows.map(row => ({
      ...row,
      imagens: formatImageUrls(row.imagens)
    })),
    total: totalRows[0].total
  };
}; 