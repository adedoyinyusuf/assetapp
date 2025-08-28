const express = require('express');
const next = require('next');
const { Pool } = require('pg');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './asset-management-app' });
const handle = app.getRequestHandler();

// Create a new pool instance to manage PostgreSQL connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:11220099@localhost:5432/asset_mgt_db',
});

app.prepare().then(() => {
  const server = express();
  server.use(express.json());

  // Assets routes
  server.get('/api/assets', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT a.*, c.name as category, s.name as state, l.name as lga 
        FROM assets a
        JOIN categories c ON a.category_id = c.id
        JOIN states s ON a.state_id = s.id
        JOIN lgas l ON a.lga_id = l.id
        ORDER BY a.name
      `);
      res.json(rows.map(row => ({
        id: row.id,
        name: row.name,
        purchaseDate: row.purchase_date,
        purchaseValue: parseFloat(row.purchase_value),
        salvageValue: parseFloat(row.salvage_value),
        usefulLife: row.useful_life,
        category: row.category,
        state: row.state,
        lga: row.lga,
        category_id: row.category_id,
        state_id: row.state_id,
        lga_id: row.lga_id
      })));
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.post('/api/assets', async (req, res) => {
    const { name, purchaseValue, purchaseDate, usefulLife, salvageValue, category_id, state_id, lga_id } = req.body;
    try {
      const { rows } = await pool.query(
        'INSERT INTO assets (name, purchase_value, purchase_date, useful_life, salvage_value, category_id, state_id, lga_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [name, purchaseValue, purchaseDate, usefulLife, salvageValue, category_id, state_id, lga_id]
      );
      res.json(rows[0]);
    } catch (error) {
      console.error('Error adding asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.put('/api/assets/:id', async (req, res) => {
    const { id } = req.params;
    const { name, purchaseValue, purchaseDate, usefulLife, salvageValue, category_id, state_id, lga_id } = req.body;
    try {
      const { rows } = await pool.query(
        'UPDATE assets SET name = $1, purchase_value = $2, purchase_date = $3, useful_life = $4, salvage_value = $5, category_id = $6, state_id = $7, lga_id = $8 WHERE id = $9 RETURNING *',
        [name, purchaseValue, purchaseDate, usefulLife, salvageValue, category_id, state_id, lga_id, id]
      );
      if (rows.length === 0) {
        res.status(404).json({ message: 'Asset not found' });
      } else {
        res.json(rows[0]);
      }
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.delete('/api/assets/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM assets WHERE id = $1', [id]);
      res.json({ message: 'Asset deleted' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Asset movements routes
  server.get('/api/assets/:assetId/movements', async (req, res) => {
    const { assetId } = req.params;
    try {
      const { rows } = await pool.query('SELECT * FROM asset_movements WHERE asset_id = $1 ORDER BY move_date DESC', [assetId]);
      res.json(rows.map(row => ({
        id: row.id,
        assetId: row.asset_id,
        fromLocation: row.from_location,
        toLocation: row.to_location,
        moveDate: row.move_date,
        notes: row.notes
      })));
    } catch (error) {
      console.error('Error fetching asset movements:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  server.post('/api/asset-movements', async (req, res) => {
    const { assetId, fromLocation, toLocation, moveDate, notes } = req.body;
    try {
      const { rows } = await pool.query(
        'INSERT INTO asset_movements (asset_id, from_location, to_location, move_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [assetId, fromLocation, toLocation, moveDate, notes]
      );
      res.json(rows[0]);
    } catch (error) {
      console.error('Error adding asset movement:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // List all asset movements (basic list)
  server.get('/api/asset-movements', async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT am.*,
                a.name AS asset_name
         FROM asset_movements am
         LEFT JOIN assets a ON am.asset_id = a.id
         ORDER BY am.move_date DESC, am.id DESC`
      );
      res.json(rows.map(row => ({
        id: row.id,
        assetId: row.asset_id,
        asset_name: row.asset_name,
        fromLocation: row.from_location,
        toLocation: row.to_location,
        moveDate: row.move_date,
        notes: row.notes
      })));
    } catch (error) {
      console.error('Error fetching asset movements:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

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

  // CSV upload endpoint removed: locations are now managed only via DB and initialization route

  // Bulk insert initial Nigerian states and LGAs
  server.post('/api/initialize-locations', async (req, res) => {
    try {
      await pool.query('BEGIN');
      
      // Insert all 36 Nigerian states + FCT
      const states = [
        { id: 1, name: 'ABIA' },
        { id: 2, name: 'ADAMAWA' },
        { id: 3, name: 'AKWA IBOM' },
        { id: 4, name: 'ANAMBRA' },
        { id: 5, name: 'BAUCHI' },
        { id: 6, name: 'BAYELSA' },
        { id: 7, name: 'BENUE' },
        { id: 8, name: 'BORNO' },
        { id: 9, name: 'CROSS RIVER' },
        { id: 10, name: 'DELTA' },
        { id: 11, name: 'EBONYI' },
        { id: 12, name: 'EDO' },
        { id: 13, name: 'EKITI' },
        { id: 14, name: 'ENUGU' },
        { id: 15, name: 'FCT' },
        { id: 16, name: 'GOMBE' },
        { id: 17, name: 'IMO' },
        { id: 18, name: 'JIGAWA' },
        { id: 19, name: 'KADUNA' },
        { id: 20, name: 'KANO' },
        { id: 21, name: 'KATSINA' },
        { id: 22, name: 'KEBBI' },
        { id: 23, name: 'KOGI' },
        { id: 24, name: 'KWARA' },
        { id: 25, name: 'LAGOS' },
        { id: 26, name: 'NASARAWA' },
        { id: 27, name: 'NIGER' },
        { id: 28, name: 'OGUN' },
        { id: 29, name: 'ONDO' },
        { id: 30, name: 'OSUN' },
        { id: 31, name: 'OYO' },
        { id: 32, name: 'PLATEAU' },
        { id: 33, name: 'RIVERS' },
        { id: 34, name: 'SOKOTO' },
        { id: 35, name: 'TARABA' },
        { id: 36, name: 'YOBE' },
        { id: 37, name: 'ZAMFARA' }
      ];
      
      for (const state of states) {
        await pool.query(
          'INSERT INTO states (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2',
          [state.id, state.name]
        );
      }
      
      // Insert Sokoto LGAs from the provided data
      const sokotoLgas = [
        { id: 1, name: 'GUDU', state_id: 34 },
        { id: 2, name: 'BINJI', state_id: 34 },
        { id: 3, name: 'TANGAZA', state_id: 34 },
        { id: 4, name: 'GWADABAWA', state_id: 34 },
        { id: 5, name: 'ILLELA', state_id: 34 },
        { id: 6, name: 'GADA', state_id: 34 },
        { id: 7, name: 'SABON BIRNI', state_id: 34 },
        { id: 8, name: 'ISA', state_id: 34 },
        { id: 9, name: 'GORONYO', state_id: 34 },
        { id: 10, name: 'WURNO', state_id: 34 },
        { id: 11, name: 'RABAH', state_id: 34 },
        { id: 12, name: 'KWARE', state_id: 34 },
        { id: 13, name: 'SOKOTO SOUTH', state_id: 34 },
        { id: 14, name: 'SOKOTO NORTH', state_id: 34 },
        { id: 15, name: 'WAMAKKO', state_id: 34 },
        { id: 16, name: 'SILAME', state_id: 34 },
        { id: 17, name: 'YABO', state_id: 34 },
        { id: 18, name: 'BODINGA', state_id: 34 },
        { id: 19, name: 'DANGE SHUNI', state_id: 34 },
        { id: 20, name: 'TURETA', state_id: 34 },
        { id: 21, name: 'SHAGARI', state_id: 34 },
        { id: 22, name: 'TAMBUWAL', state_id: 34 },
        { id: 23, name: 'KEBBE', state_id: 34 }
      ];
      
      for (const lga of sokotoLgas) {
        await pool.query(
          'INSERT INTO lgas (id, name, state_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, state_id = $3',
          [lga.id, lga.name, lga.state_id]
        );
      }
      
      await pool.query('COMMIT');
      res.json({ message: 'Nigerian states and Sokoto LGAs initialized successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error initializing locations:', error);
      res.status(500).json({ error: 'Failed to initialize locations' });
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

