const [usuariosProximosVencimento] = await db.query(`
    SELECT id, nome, telefone
    FROM usuarios
    WHERE 
        is_active = true
        AND data_pagamento_mensal IS NOT NULL
        AND DATE(data_pagamento_mensal) = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
`);