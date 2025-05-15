CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sobrenome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    confirmation_code VARCHAR(6),
    reset_code VARCHAR(6),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_telefone ON usuarios(telefone); 