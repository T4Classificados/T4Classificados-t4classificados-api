CREATE TABLE IF NOT EXISTS denuncias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  anuncio_id INT NOT NULL,
  motivo VARCHAR(50) NOT NULL,
  descricao TEXT,
  status ENUM('pendente', 'resolvido', 'rejeitado') DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (anuncio_id) REFERENCES anuncios(id) ON DELETE CASCADE
); 