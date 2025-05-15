const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Processa e salva as imagens enviadas
 * @param {Array} files - Array de arquivos do multer
 * @returns {Promise<Array<string>>} Array com os caminhos das imagens salvas
 */
async function uploadImagens(files) {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const imagens = [];

    try {
        // Garante que o diretório de upload existe
        await fs.mkdir(uploadDir, { recursive: true });

        // Processa cada arquivo
        for (const file of files) {
            const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
            const filePath = path.join(uploadDir, uniqueName);
            
            // Move o arquivo para o diretório de uploads
            await fs.rename(file.path, filePath);
            
            // Adiciona o caminho relativo à lista de imagens
            imagens.push(`/${uploadDir}/${uniqueName}`);
        }

        return imagens;
    } catch (error) {
        // Em caso de erro, tenta limpar arquivos que podem ter sido criados
        for (const imagem of imagens) {
            try {
                await fs.unlink(path.join(process.cwd(), imagem));
            } catch (e) {
                console.error('Erro ao limpar arquivo:', e);
            }
        }
        throw new Error(`Erro no upload de imagens: ${error.message}`);
    }
}

module.exports = {
    uploadImagens
}; 