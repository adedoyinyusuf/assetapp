const express = require('express');
const next = require('next');
const { Pool } = require('pg');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// PostgreSQL connection pool with better error handling
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  });

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to PostgreSQL');
    release();
  }
});

app.prepare().then(() => {
  const server = express();
  server.use(express.json());

  // Middleware to handle database errors
  const handleDatabaseError = (error, res) => {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: dev ? error.message : 'An unexpected error occurred'
    });
  };

  // API routes with better error handling and input validation
  server.get('/api/assets', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          a.*,
          c.name as category_name,
          s.name as state_name,
          l.name as lga_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN states s ON a.state_id = s.id
        LEFT JOIN lgas l ON a.lga_id = l.id
        ORDER BY a.updated_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  server.post('/api/assets', async (req, res) => {
    const { 
      name, 
      purchase_date, 
      purchase_value, 
      salvage_value, 
      useful_life, 
      category_id, 
      state_id, 
      lga_id 
    } = req.body;

    // Input validation
    if (!name || !purchase_date || !purchase_value) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Required fields are missing' 
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO assets (
          name, 
          purchase_date, 
          purchase_value, 
          salvage_value, 
          useful_life, 
          category_id, 
          state_id, 
          lga_id,
          created_at,
          updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [name, purchase_date, purchase_value, salvage_value, useful_life, category_id, state_id, lga_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  server.put('/api/assets/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { 
      name, 
      purchase_date, 
      purchase_value, 
      salvage_value, 
      useful_life, 
      category_id, 
      state_id, 
      lga_id 
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid asset ID' 
      });
    }

    try {
      const result = await pool.query(
        `UPDATE assets 
        SET name = $1, 
            purchase_date = $2, 
            purchase_value = $3, 
            salvage_value = $4, 
            useful_life = $5, 
            category_id = $6, 
            state_id = $7, 
            lga_id = $8, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $9 
        RETURNING *`,
        [name, purchase_date, purchase_value, salvage_value, useful_life, category_id, state_id, lga_id, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Asset not found' });
      } else {
        res.json(result.rows[0]);
      }
    } catch (error) {
      handleDatabaseError(error, res);
    }
  });

  server.delete('/api/assets/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid asset ID' 
      });
    }

    try {
      await pool.query('BEGIN');
      
      // Delete related records first
      await pool.query('DELETE FROM asset_movements WHERE asset_id = $1', [id]);
      
      // Then delete the asset
      const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING id', [id]);
      
      await pool.query('COMMIT');

      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Asset not found' });
      } else {
        res.json({ message: 'Asset deleted successfully', id });
      }
    } catch (error) {
      await pool.query('ROLLBACK');
      handleDatabaseError(error, res);
    }
  });

  // Health check endpoint
  server.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Default catch-all handler
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
      console.log('Closed out remaining connections');
      pool.end(() => {
        console.log('Closed db connection pool');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});