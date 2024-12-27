CREATE TABLE contas_afiliadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bi VARCHAR(20) NOT NULL UNIQUE,
    iban VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Adicionar coluna conta_afiliada_id na tabela usuarios (opcional)
ALTER TABLE usuarios ADD COLUMN conta_afiliada_id INT NULL;
ALTER TABLE usuarios ADD FOREIGN KEY (conta_afiliada_id) REFERENCES contas_afiliadas(id); 