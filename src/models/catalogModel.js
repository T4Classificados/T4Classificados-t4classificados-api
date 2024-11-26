const db = require('../config/database');

class CatalogModel {
  async createCatalog(link, image, status = 'active') {
    const query = 'INSERT INTO catalogs (link, image, status) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [link, image, status]);
    return result;
  }

  async getAllCatalogs() {
    const query = 'SELECT *, CONCAT(?, image) as image_url FROM catalogs ORDER BY created_at DESC';
    const baseUrl = process.env.BASE_URL || 'http://localhost';
    const port = process.env.PORT || 5000;
    const imageUrl = `${baseUrl}:${port}/uploads/`;
    const [catalogs] = await db.execute(query, [imageUrl]);
    return catalogs;
  }

  async getCatalogById(id) {
    const query = 'SELECT *, CONCAT(?, image) as image_url FROM catalogs WHERE id = ?';
    const baseUrl = process.env.BASE_URL || 'http://localhost';
    const port = process.env.PORT || 5000;
    const imageUrl = `${baseUrl}:${port}/uploads/`;
    const [catalogs] = await db.execute(query, [imageUrl, id]);
    return catalogs[0];
  }

  async updateCatalog(id, link, image) {
    const query = 'UPDATE catalogs SET link = ?, image = ? WHERE id = ?';
    const [result] = await db.execute(query, [link, image, id]);
    return result;
  }

  async updateCatalogStatus(id, status) {
    const query = 'UPDATE catalogs SET status = ? WHERE id = ?';
    const [result] = await db.execute(query, [status, id]);
    return result;
  }

  async deleteCatalog(id) {
    const query = 'DELETE FROM catalogs WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result;
  }
}

module.exports = new CatalogModel(); 