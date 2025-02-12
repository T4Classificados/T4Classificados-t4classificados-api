CREATE TABLE pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('campanha', 'ativacao') NOT NULL,
    referencia_id INT NOT NULL COMMENT 'ID da campanha ou usuário',
    transaction_id VARCHAR(100),
    amount DECIMAL(10,2),
    fee DECIMAL(10,2),
    entity_id VARCHAR(100),
    terminal_id VARCHAR(100),
    terminal_location VARCHAR(255),
    terminal_type VARCHAR(50),
    datetime TIMESTAMP,
    period_start_datetime TIMESTAMP,
    period_end_datetime TIMESTAMP,
    parameter_id VARCHAR(100),
    period_id VARCHAR(100),
    product_id VARCHAR(100),
    terminal_period_id VARCHAR(100),
    terminal_transaction_id VARCHAR(100),
    custom_fields TEXT,
    status ENUM('pendente', 'pago', 'falhou', 'reembolsado') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_pagamentos_referencia ON pagamentos(tipo, referencia_id);
CREATE INDEX idx_pagamentos_transaction ON pagamentos(transaction_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status); 