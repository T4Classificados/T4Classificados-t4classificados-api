const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');



function extractTelefonesAndNomes(sqlFilePath, outputFilePath) {
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  // Regex para capturar números de telefone (9 dígitos começando com 9)
  const telefoneRegex = /['"]?(9\d{8})['"]?/g;
  
  // Regex para capturar os dados (nome, sobrenome e telefone) em inserts
  const insertRegex = /INSERT INTO\s+\S+\s*\(([^)]+)\)\s+VALUES\s+([\s\S]*?);/gi;

  const rows = [];
  let match;
  
  // Vamos procurar todos os INSERTs no arquivo SQL
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const columnLine = match[1];
    const valuesBlock = match[2];

    // Quebramos as colunas e valores do INSERT
    const columns = columnLine
      .split(',')
      .map(c => c.trim().replace(/[`"'']/g, '').toLowerCase());

    const valueRegex = /\(([^)]+)\)/g;
    let valueMatch;
    
    // Vamos procurar todas as tuplas de valores no INSERT
    while ((valueMatch = valueRegex.exec(valuesBlock)) !== null) {
      const rawValues = valueMatch[1];

      // Dividimos os valores corretamente, respeitando aspas
      const values = rawValues
        .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
        .map(v => v.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1'));

      const row = {};
      columns.forEach((col, index) => {
        row[col] = values[index]?.toLowerCase() === 'null' ? '' : values[index];
      });

      // Buscamos o telefone e o nome
      const telefoneEntry = Object.entries(row).find(([key]) =>
        key.includes('telefone') || key === 'tel'
      );
      const nomeEntry = Object.entries(row).find(([key]) =>
        key.includes('nome') || key === 'nome' || key === 'sobrenome'
      );

      // Se encontramos um número de telefone, vamos adicionar à lista
      if (telefoneEntry && telefoneEntry[1] && telefoneEntry[1].trim()) {
        rows.push({
          Nome: nomeEntry ? nomeEntry[1] : '', // Se não encontrar nome, deixa vazio
          Telefone: telefoneEntry[1].trim(),
        });
      }
    }
  }

  // Criamos a planilha Excel
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Telefones e Nomes');

  // Salvamos a planilha
  XLSX.writeFile(workbook, outputFilePath);
  console.log(`✅ Total exportado: ${rows.length} registros (com nome e telefone) para ${outputFilePath}`);
}






const sqlPath = path.join(__dirname, 'usuarios_backup.sql');
const excelPath = path.join(__dirname, 'usuarios.xlsx');

extractTelefonesAndNomes(sqlPath, excelPath);
