const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./config/database');


function extractValuesFromSql(sql) {
    const valuesBlockRegex = /INSERT INTO .*? VALUES\s*(.*);/gis;
    const valuesRowRegex = /\(([^()]+)\)/g;

    const entries = [];

    let blockMatch;
    while ((blockMatch = valuesBlockRegex.exec(sql)) !== null) {
        const block = blockMatch[1];

        let rowMatch;
        while ((rowMatch = valuesRowRegex.exec(block)) !== null) {
            const row = rowMatch[1]
                .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
                .map(v => {
                    const trimmed = v.trim();
                    if (trimmed.toUpperCase() === 'NULL') return null;
                    return trimmed.replace(/^'(.*)'$/, '$1');
                });

            entries.push(row);
        }
    }

    console.log("🔍 Total de linhas extraídas:", entries.length);
    return entries;
}

const FIELDS = {
    nome: 0,
    sobrenome: 1,
    telefone: 2,
    senha: 3,
    confirmation_code: 4,
    is_active: 5,
    role: 8,
    provincia: 10,
    municipio: 11,
    bilhete: 14,
};

async function userExists(telefone) {
    const raw = telefone.replace(/\D/g, ''); // remove não numéricos
    const telVariantes = [
        raw,
        raw.startsWith('244') ? `+${raw}` : `+244${raw}`,
        raw.startsWith('+244') ? raw : `+244${raw}`,
    ];

    const [rows] = await db.query(
        `SELECT id FROM usuarios WHERE REPLACE(REPLACE(REPLACE(telefone, ' ', ''), '+', ''), '-', '') IN (?, ?, ?) LIMIT 1`,
        telVariantes.map(t => t.replace(/\D/g, '')) // compara sem símbolos
    );

    return rows.length > 0;
}
function formatarTelefone(telefone) {

    const digitos = telefone.replace(/\D/g, '');
  
    if (digitos.startsWith('244')) {
      return `+${digitos}`;
    } else if (digitos.length === 9) {
      return `+244${digitos}`;
    }
  
    // caso o telefone esteja num formato inválido
    return null;
  }


async function insertUser(user) {
    const query = `
      INSERT INTO usuarios 
      (nome, sobrenome, telefone, senha, confirmation_code, is_active, role, provincia, municipio, bilhete)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(query, [
        user.nome,
        user.sobrenome,
        user.telefone,
        user.senha,
        user.confirmation_code,
        user.is_active,
        user.role,
        user.provincia,
        user.municipio,
        user.bilhete,
    ]);
}

async function main() {
    try {
        const filePath = path.join(__dirname, 'usuarios_backup.sql');
        const sql = fs.readFileSync(filePath, 'utf8');

        const rows = extractValuesFromSql(sql);
        let insertedCount = 0;

        
        for (const row of rows) {
            console.log(row)

            const telefoneFormatado = formatarTelefone(row[FIELDS.telefone]);
        
            const user = {
                nome: row[FIELDS.nome] || null,
                sobrenome: row[FIELDS.sobrenome] || null,
                telefone: telefoneFormatado,
                senha: row[FIELDS.senha] || '1234',
                confirmation_code: row[FIELDS.confirmation_code] || null,
                is_active: row[FIELDS.is_active] === '1' ? 1 : 0,
                role: row[FIELDS.role] || 'user',
                provincia: row[FIELDS.provincia] || "Luanda",
                municipio: 'Talatona',
                bilhete: row[FIELDS.bilhete] || null,
            };

            if (!user.telefone || !user.confirmation_code) {
                console.warn(`❌ Ignorado: Faltando telefone ou código de confirmação.`);
                continue;
            }

            const exists = await userExists(user.telefone, user.confirmation_code);
            if (exists) {
                console.log(`ℹ️ Já existe: ${user.telefone}`);
                continue;
            }

            user.senha = await bcrypt.hash(user.senha, 10);

            await insertUser(user);
            console.log(`✅ Inserido: ${user.nome} (${user.telefone})`);
            insertedCount++;
        }

        console.log(`\n✨ Total inseridos: ${insertedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

main();
