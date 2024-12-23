
DROP TABLE IF EXISTS `anuncios`;
CREATE TABLE IF NOT EXISTS `anuncios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `modalidade` varchar(100) NOT NULL,
  `descricao` text,
  `visibilidade` enum('publico','privado') DEFAULT 'publico',
  `disponivel_whatsapp` tinyint(1) DEFAULT '0',
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `notificacoes_promocoes` tinyint(1) DEFAULT '0',
  `alertas_emprego` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bg_0900_as_cs NOT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bg_0900_as_cs NOT NULL,
  `senha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bg_0900_as_cs NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmation_code` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_bg_0900_as_cs DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `role` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_bg_0900_as_cs DEFAULT 'gestor',
  `reset_code` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_bg_0900_as_cs DEFAULT NULL,
  `genero` enum('masculino','feminino','outro') COLLATE utf8mb4_bg_0900_as_cs NOT NULL,
  `provincia` varchar(100) COLLATE utf8mb4_bg_0900_as_cs NOT NULL,
  `zona` varchar(100) COLLATE utf8mb4_bg_0900_as_cs NOT NULL,
  `tipo_conta` enum('pessoal','empresarial') COLLATE utf8mb4_bg_0900_as_cs NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `telefone` (`telefone`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bg_0900_as_cs;
COMMIT;
