CREATE TABLE IF NOT EXISTS anuncios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo_transacao VARCHAR(50) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    preco_negociavel BOOLEAN DEFAULT false,
    provincia VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    zona VARCHAR(100),
    descricao TEXT,
    whatsapp VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Disponível',
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS anuncio_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id INT,
    url_imagem VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (anuncio_id) REFERENCES anuncios(id) ON DELETE CASCADE
);

CREATE INDEX idx_anuncios_usuario ON anuncios(usuario_id);
CREATE INDEX idx_anuncios_status ON anuncios(status); 