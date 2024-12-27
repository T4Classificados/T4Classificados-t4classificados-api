DROP TABLE IF EXISTS campanha_imagens;
DROP TABLE IF EXISTS campanhas;

CREATE TABLE campanhas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    empresa_id INT NOT NULL,
    tipo_exibicao ENUM('computador', 'telemóvel', 'ambos') NOT NULL,
    espaco VARCHAR(100) NOT NULL,
    descricao TEXT,
    logo_url VARCHAR(255),
    botao_texto VARCHAR(50),
    num_visualizacoes INT NOT NULL,
    valor_visualizacao DECIMAL(10,2) NOT NULL,
    total_pagar DECIMAL(10,2),
    status ENUM('pendente', 'ativa', 'pausada', 'concluida', 'rejeitada') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE campanha_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campanha_id INT NOT NULL,
    url_imagem VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE CASCADE
);

CREATE INDEX idx_campanhas_usuario ON campanhas(usuario_id);
CREATE INDEX idx_campanhas_status ON campanhas(status); 