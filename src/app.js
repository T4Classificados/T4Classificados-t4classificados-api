require("dotenv").config({ path: "/etc/app.env" });
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const cookieParser = require("cookie-parser");
const campanhaStatusJob = require('./jobs/campanhaStatusJob');
const   importarUsuariosDoArquivoSQL  = require('./xlsx.js');
const app = express();
const port = process.env.PORT || 4000;

// Configuração do CORS
app.use(cors());

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//subirImagensDaPasta('./uploads');

// Criar os diretórios de upload se não existirem
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Configuração do Swagger
app.use("/api-docs", swaggerUi.serve);
app.get(
  "/api-docs",
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// Rotas públicas (sem autenticação)
const publicRoutes = require("./routes/publicRoutes");
app.use("/api/public", publicRoutes);

// Rotas protegidas
const userRoutes = require("./routes/userRoutes");
const anuncioRoutes = require("./routes/anuncioRoutes");
const campanhaRoutes = require('./routes/campanhaRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const contaAfiliadaRoutes = require('./routes/contaAfiliadaRoutes');
const estatisticasRoutes = require('./routes/estatisticasRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Rota de teste
app.get("/test", (req, res) => {
  res.json({ message: "API está funcionando!" });
});

// Prefixo da API
app.use("/api", userRoutes);
app.use("/api/users", userRoutes);
app.use("/api", anuncioRoutes);
app.use('/api/campanhas', campanhaRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/conta-afiliada', contaAfiliadaRoutes);
app.use('/api/estatisticas', estatisticasRoutes);
app.use('/api/admin', adminRoutes);

// Middleware global para logging de erros
app.use((err, req, res, next) => {
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rota 404 para endpoints não encontrados
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint não encontrado" });
});

// Inicia o cronjob
campanhaStatusJob.start();

// Inicializa os jobs agendados
require('./jobs/verificarPagamentosVencidos');

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(
    `Documentação Swagger disponível em http://localhost:${port}/api-docs`
  );
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
