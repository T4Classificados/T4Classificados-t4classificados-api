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

const app = express();
const port = process.env.PORT || 9000;

// Configuração do CORS
app.use(cors());

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
const empregoRoutes = require("./routes/empregoRoutes");
const publicidadeRoutes = require('./routes/publicidadeRoutes');
const painelAnuncianteRoutes = require('./routes/painelAnuncianteRoutes');
const estatisticasRoutes = require('./routes/estatisticasRoutes');
const denunciaRoutes = require('./routes/denunciaRoutes');

// Rota de teste
app.get("/test", (req, res) => {
  res.json({ message: "API está funcionando!" });
});

// Prefixo da API
app.use("/api", userRoutes);
app.use("/api", anuncioRoutes);
app.use("/api", empregoRoutes);
app.use("/api", publicidadeRoutes);
app.use("/api", denunciaRoutes);

// Registrar as rotas
app.use('/api/usuarios', userRoutes);
app.use('/api/anuncios', anuncioRoutes);
app.use('/api/empregos', empregoRoutes);
app.use('/api/publicidades', publicidadeRoutes);
app.use('/api/painel', painelAnuncianteRoutes);
app.use('/api/estatisticas', estatisticasRoutes);
app.use('/api/denuncias', denunciaRoutes);

// Middleware global para logging de erros
app.use((err, req, res, next) => {
  /* console.error('=== Erro global capturado ===');
  console.error('Erro:', err);
  console.error('Stack:', err.stack);
  console.error('URL:', req.originalUrl);
  console.error('Método:', req.method);
  console.error('Body:', req.body);
  console.error('Query:', req.query);
  console.error('Params:', req.params);
   */
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rota 404 para endpoints não encontrados
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint não encontrado" });
});

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
