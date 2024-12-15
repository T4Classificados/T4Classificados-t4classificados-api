const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5000'
};