-- Primeiro remover os índices se existirem (ignora erro se não existirem)
DROP INDEX IF EXISTS idx_anuncios_stats ON anuncios;
DROP INDEX IF EXISTS idx_anuncios_categoria ON anuncios;

-- Adicionar coluna created_at se não existir
ALTER TABLE anuncios 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar as colunas de estatísticas
ALTER TABLE anuncios 
ADD COLUMN visualizacoes INT DEFAULT 0,
ADD COLUMN chamadas INT DEFAULT 0,
ADD COLUMN mensagens_whatsapp INT DEFAULT 0,
ADD COLUMN compartilhamentos INT DEFAULT 0,
ADD COLUMN ultima_atualizacao_stats TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Criar os índices
CREATE INDEX idx_anuncios_stats ON anuncios(usuario_id, created_at);
CREATE INDEX idx_anuncios_categoria ON anuncios(categoria);

-- Garantir que não existam valores nulos
UPDATE anuncios 
SET 
    visualizacoes = 0 WHERE visualizacoes IS NULL;
UPDATE anuncios 
SET 
    chamadas = 0 WHERE chamadas IS NULL;
UPDATE anuncios 
SET 
    mensagens_whatsapp = 0 WHERE mensagens_whatsapp IS NULL;
UPDATE anuncios 
SET 
    compartilhamentos = 0 WHERE compartilhamentos IS NULL; 