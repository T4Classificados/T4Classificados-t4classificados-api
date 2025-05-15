const { S3Client } = require('@aws-sdk/client-s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'auto', 
  endpoint: `https://0ae4ba9ab7fdee082d2c9aefdfc94eb6.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:'59df27882b2fbb34560c0dd1de890101',
    secretAccessKey:'c431a3064dfa4d740a657e00b417a55cd680a7680a00691c77c88135cd456da6',
  },
});

class CloudflareService {
  constructor() {
    this.bucketName = 'api-storage';
    this.publicUrlBase = 'https://pub-31856bf2e3ef499b9f07d34b426752ae.r2.dev';
  }

  async uploadFile(fieldname, file) {
    const key = `${fieldname}/${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    return key; // Agora retorna apenas a chave
  }

  async getSignedUrl(key) {
    return `${this.publicUrlBase}/${key}`;
  }

  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Arquivo "${key}" removido com sucesso do Cloudflare R2.`);
  }
}
module.exports = { CloudflareService };