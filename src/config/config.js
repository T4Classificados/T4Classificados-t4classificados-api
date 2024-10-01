const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`
};