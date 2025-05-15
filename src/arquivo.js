const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { CloudflareService } = require('./utils/cloudflare');
const db = require('./config/database');

async function listarTodasImagensPrincipais() {
    const [rows] = await db.query('SELECT url_imagem FROM campanha_imagens');
    return rows.map(row => {
        if (!row.url_imagem) return null;
        const partes = row.url_imagem.split('/');
        return partes[partes.length - 1];
    }).filter(Boolean);
}

async function atualizarImagemNoBanco(nomeArquivo, novaUrl) {
    try {
        const likeQuery = `%${nomeArquivo}`;
        const [result] = await db.query(
            'UPDATE campanha_imagens SET url_imagem = ? WHERE url_imagem LIKE ?',
            [novaUrl, likeQuery]
        );

        if (result.affectedRows > 0) {
            console.log(`🔄 Atualizado no banco: ${nomeArquivo}`);
        } else {
            console.warn(`⚠️ Nenhum registro atualizado para: ${nomeArquivo}`);
        }
    } catch (error) {
        console.error(`❌ Erro ao atualizar no banco para ${nomeArquivo}:`, error.message);
    }
}

async function subirImagensDaPasta(pastaLocal, destino = 'campanha_imagens') {
    const cloudflareService = new CloudflareService();
    const imagensDoBanco = await listarTodasImagensPrincipais();
    const arquivosLocais = fs.readdirSync(pastaLocal);
    let enviados = 0;

    for (const arquivo of arquivosLocais) {
        const caminhoCompleto = path.join(pastaLocal, arquivo);

        if (
            fs.statSync(caminhoCompleto).isFile() &&
            imagensDoBanco.includes(arquivo)
        ) {
            const buffer = fs.readFileSync(caminhoCompleto);
            const mimetype = mime.lookup(caminhoCompleto);

            if (!mimetype || !mimetype.startsWith('image/')) {
                console.log(`Ignorando arquivo não imagem: ${arquivo}`);
                continue;
            }

            const file = {
                originalname: arquivo,
                mimetype: mimetype,
                buffer: buffer,
            };

            try {
                const url = await cloudflareService.uploadFile(destino, file);
                  const imagemUrl = await cloudflareService.getSignedUrl(url);
                await atualizarImagemNoBanco(arquivo, imagemUrl);
                enviados++;
            } catch (error) {
                console.error(`❌ Erro ao enviar ${arquivo}:`, error.message);
            }
        }
    }

    console.log(`✨ Total de imagens enviadas e atualizadas: ${enviados}`);
}

module.exports = { subirImagensDaPasta };
