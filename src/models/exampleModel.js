const db = require('../config/database');

exports.getExample = async () => {
  const [rows] = await db.query('SELECT * FROM example_table');
  return rows;
};