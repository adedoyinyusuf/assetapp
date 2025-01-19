const express = require('express');
const next = require('next');
const { Pool } = require('pg');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Create a new pool instance to manage PostgreSQL connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.prepare().then(() => {
  const server = express();
  server.use(express.json());

  // ... (previous routes remain unchanged)

  // Categories routes
  server.get('/api/categories', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
      res.json(rows);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.post('/api/categories', async (req, res) => {
    const { name } = req.body;
    try {
      const { rows } = await pool.query(
        'INSERT INTO categories (name) VALUES ($1) RETURNING *',
        [name]
      );
      res.json(rows[0]);
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.put('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
      const { rows } = await pool.query(
        'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
      );
      if (rows.length === 0) {
        res.status(404).json({ message: 'Category not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.delete('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      res.json({ message: 'Category deleted' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // States routes
  server.get('/api/states', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM states ORDER BY name');
      res.json(rows);
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // LGAs routes
  server.get('/api/states/:stateId/lgas', async (req, res) => {
    const { stateId } = req.params;
    try {
      const { rows } = await pool.query('SELECT * FROM lgas WHERE state_id = $1 ORDER BY name', [stateId]);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching LGAs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Default catch-all handler to allow Next.js to handle all other routes
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

