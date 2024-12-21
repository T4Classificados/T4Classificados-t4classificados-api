const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração base do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define o diretório específico para anúncios
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Cria o diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gera um nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configuração do multer para anúncios
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 8
  },
  fileFilter: (req, file, cb) => {
    // Verifica o tipo do arquivo
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Use apenas JPEG ou PNG.'));
    }
  }
});

module.exports = upload;