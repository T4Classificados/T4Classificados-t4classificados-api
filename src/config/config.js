const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  baseUrl: process.env.BASE_URL || `http://54.172.252.55:${process.env.PORT || 5000}`
};