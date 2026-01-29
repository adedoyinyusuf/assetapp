const express = require('express');
const next = require('next');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Set NEXTAUTH_URL environment variable if not set
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const nextConfig = {
  dev,
  dir: __dirname,
  conf: {
    distDir: '.next',
    useFileSystemPublicRoutes: true,
    experimental: {
      outputFileTracingExcludes: { '*': [] },
      outputFileTracingIgnores: ['**'],
      telemetry: false,
      telemetry: false,
      // output: 'standalone'
    }
  }
}

const app = next(nextConfig);

const handle = app.getRequestHandler();

// Create a new PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:11220099@localhost:5432/asset_mgt_db',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Successfully connected to the database');
  release();
});

// Log connection events
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize the application
app.prepare().then(() => {
  // Create HTTP server
  const http = require('http');
  const server = express();
  const httpServer = http.createServer(server);

  console.log("------------------------------------------");
  console.log("Asset Manager Server v1.1 - Schema Fixes Applied");
  console.log("------------------------------------------");

  // Initialize Socket.IO
  const { Server } = require("socket.io");
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Internal endpoint to trigger real-time updates (called by Server Actions)
  server.post('/api/notify-update', (req, res) => {
    const { type, data } = req.body;
    // Emit event to all connected clients
    io.emit(type, data);
    res.json({ success: true });
  });

  // Parse JSON request bodies
  server.use(express.json());

  // Serve static files from the Next.js build directory
  const staticPath = path.join(__dirname, '.next');

  // Serve static files - ONLY in production to avoid conflicts with HMR
  if (!dev) {
    server.use('/_next/static', express.static(path.join(staticPath, 'static'), {
      maxAge: '1y',
      immutable: true
    }));

    server.use(express.static(staticPath));
  }

  // Get assets (list or summary)
  server.get('/api/assets', async (req, res) => {
    console.log(`[API] GET /api/assets query=${JSON.stringify(req.query)}`);
    try {
      if (req.query.summary === 'true') {
        // Fetch summary stats
        const assetStats = await pool.query('SELECT COUNT(*) as count, SUM(purchase_value) as value FROM assets');

        // Fetch category stats
        const catStats = await pool.query(`
          SELECT c.name, COUNT(a.id) as count, SUM(a.purchase_value) as value 
          FROM categories c 
          LEFT JOIN assets a ON c.id = a.category_id 
          GROUP BY c.id, c.name
        `);

        // Fetch recent assets
        const recentAssets = await pool.query(`
          SELECT a.id, a.name, a.purchase_value as "purchaseValue", a.purchase_date as "purchaseDate", c.name as category
          FROM assets a
          LEFT JOIN categories c ON a.category_id = c.id
          ORDER BY a.created_at DESC
          LIMIT 5
        `);

        return res.json({
          summary: {
            totalAssets: parseInt(assetStats.rows[0].count) || 0,
            totalValue: parseFloat(assetStats.rows[0].value) || 0,
            categories: catStats.rows.map(row => ({
              name: row.name,
              count: parseInt(row.count),
              value: parseFloat(row.value) || 0
            })),
            recentAssets: recentAssets.rows
          }
        });
      }

      // Default List with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 1000;
      const offset = (page - 1) * limit;

      // Count total assets
      const countResult = await pool.query('SELECT COUNT(*) FROM assets');
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      const { rows } = await pool.query(`
        SELECT 
          a.*, 
          c.id as category_id, 
          c.name as category_name,
          c.description as category_description,
          s.id as state_id,
          s.name as state_name,
          l.id as lga_id,
          l.name as lga_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN states s ON a.state_id = s.id
        LEFT JOIN lgas l ON a.lga_id = l.id
        ORDER BY a.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const assets = rows.map(row => ({
        id: row.id,
        name: row.name,
        purchaseDate: row.purchase_date,
        purchaseValue: parseFloat(row.purchase_value),
        salvageValue: parseFloat(row.salvage_value),
        usefulLife: row.useful_life,
        category_id: row.category_id,
        state_id: row.state_id,
        lga_id: row.lga_id,
        // Identity Fields
        serialNumber: row.serial_number,
        assetCode: row.asset_code,
        batchNumber: row.batch_number,
        referenceNumber: row.reference_number,
        imei1: row.imei_1,
        imei2: row.imei_2,
        // Include full related objects
        category: row.category_id ? {
          id: row.category_id,
          name: row.category_name,
          description: row.category_description
        } : null,
        state: row.state_id ? {
          id: row.state_id,
          name: row.state_name
        } : null,
        lga: row.lga_id ? {
          id: row.lga_id,
          name: row.lga_name,
          state_id: row.state_id
        } : null,
        // Legacy fields for backward compatibility
        category_name: row.category_name,
        state_name: row.state_name,
        lga_name: row.lga_name,
        // Verification Status
        lastVerificationStatus: row.last_verification_status,
        lastVerifiedAt: row.last_verified_at
      }));

      res.json({
        data: assets,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get single asset with related data
  server.get('/api/assets/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { rows } = await pool.query(`
        SELECT 
          a.*, 
          c.id as category_id, 
          c.name as category_name,
          c.description as category_description,
          s.id as state_id,
          s.name as state_name,
          l.id as lga_id,
          l.name as lga_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN states s ON a.state_id = s.id
        LEFT JOIN lgas l ON a.lga_id = l.id
        WHERE a.id = $1
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const asset = rows[0];
      res.json({
        id: asset.id,
        name: asset.name,
        purchaseDate: asset.purchase_date,
        purchaseValue: parseFloat(asset.purchase_value),
        salvageValue: parseFloat(asset.salvage_value),
        usefulLife: asset.useful_life,
        category_id: asset.category_id,
        state_id: asset.state_id,
        lga_id: asset.lga_id,
        // Identity Fields
        serialNumber: asset.serial_number,
        assetCode: asset.asset_code,
        batchNumber: asset.batch_number,
        referenceNumber: asset.reference_number,
        imei1: asset.imei_1,
        imei2: asset.imei_2,
        // Include full related objects
        category: asset.category_id ? {
          id: asset.category_id,
          name: asset.category_name,
          description: asset.category_description
        } : null,
        state: asset.state_id ? {
          id: asset.state_id,
          name: asset.state_name
        } : null,
        lga: asset.lga_id ? {
          id: asset.lga_id,
          name: asset.lga_name,
          state_id: asset.state_id
        } : null,
        // Legacy fields for backward compatibility
        category_name: asset.category_name,
        state_name: asset.state_name,
        lga_name: asset.lga_name
      });
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create new asset
  server.post('/api/assets', async (req, res) => {
    const {
      name, purchaseDate, purchaseValue, salvageValue, usefulLife, category_id, state_id, lga_id,
      serialNumber, batchNumber, referenceNumber, imei1, imei2
    } = req.body;

    // Validate required fields
    if (!name || !purchaseDate || purchaseValue === undefined || !category_id) {
      return res.status(400).json({
        error: 'Missing required fields. Name, purchase date, purchase value, and category are required.'
      });
    }

    try {
      // Start transaction
      await pool.query('BEGIN');

      // Generate Asset Code
      const countResult = await pool.query('SELECT COUNT(*) FROM assets');
      const count = parseInt(countResult.rows[0].count);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
      const assetCode = `AST-${Date.now().toString().slice(-6)}-${count + 1}-${randomSuffix}`;

      // Insert the new asset
      const { rows } = await pool.query(
        `INSERT INTO assets 
         (name, purchase_date, purchase_value, current_value, salvage_value, useful_life, category_id, state_id, lga_id, 
          serial_number, asset_code, batch_number, reference_number, imei_1, imei_2, 
          updated_at) 
         VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) 
         RETURNING *`,
        [
          name,
          purchaseDate,
          parseFloat(purchaseValue) || 0,
          parseFloat(salvageValue) || 0,
          parseInt(usefulLife) || 5,
          parseInt(category_id),
          state_id ? parseInt(state_id) : null,
          lga_id ? parseInt(lga_id) : null,
          serialNumber || null,
          assetCode,
          batchNumber || null,
          referenceNumber || null,
          imei1 || null,
          imei2 || null
        ]
      );

      const newAsset = rows[0];

      // Get the full asset data with relationships
      const { rows: [fullAsset] } = await pool.query(
        `SELECT 
           a.*, 
           c.name as category_name,
           c.description as category_description,
           s.name as state_name,
           l.name as lga_name
         FROM assets a
         LEFT JOIN categories c ON a.category_id = c.id
         LEFT JOIN states s ON a.state_id = s.id
         LEFT JOIN lgas l ON a.lga_id = l.id
         WHERE a.id = $1`,
        [newAsset.id]
      );

      // Commit transaction
      await pool.query('COMMIT');

      // Return the full asset data
      res.status(201).json({
        id: fullAsset.id,
        name: fullAsset.name,
        purchaseDate: fullAsset.purchase_date,
        purchaseValue: parseFloat(fullAsset.purchase_value),
        salvageValue: parseFloat(fullAsset.salvage_value),
        usefulLife: fullAsset.useful_life,
        category_id: fullAsset.category_id,
        state_id: fullAsset.state_id,
        lga_id: fullAsset.lga_id,
        // Identity Fields
        serialNumber: fullAsset.serial_number,
        assetCode: fullAsset.asset_code,
        batchNumber: fullAsset.batch_number,
        referenceNumber: fullAsset.reference_number,
        imei1: fullAsset.imei_1,
        imei2: fullAsset.imei_2,
        // Include full related objects
        category: fullAsset.category_id ? {
          id: fullAsset.category_id,
          name: fullAsset.category_name,
          description: fullAsset.category_description
        } : null,
        state: fullAsset.state_id ? {
          id: fullAsset.state_id,
          name: fullAsset.state_name
        } : null,
        lga: fullAsset.lga_id ? {
          id: fullAsset.lga_id,
          name: fullAsset.lga_name,
          state_id: fullAsset.state_id
        } : null,
        // Legacy fields for backward compatibility
        category_name: fullAsset.category_name,
        state_name: fullAsset.state_name,
        lga_name: fullAsset.lga_name
      });

    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      console.error('Error creating asset:', error);
      res.status(500).json({ error: `Database Error: ${error.message}` });
    }
  });

  // Update asset
  server.put('/api/assets/:id', async (req, res) => {
    const { id } = req.params;
    const {
      name, purchaseValue, purchaseDate, usefulLife, salvageValue, category_id, state_id, lga_id,
      serialNumber, batchNumber, referenceNumber, imei1, imei2
    } = req.body;

    try {
      // Start transaction
      await pool.query('BEGIN');

      // Update the asset
      const { rows } = await pool.query(
        `UPDATE assets 
         SET name = $1, purchase_value = $2, purchase_date = $3, useful_life = $4, salvage_value = $5, category_id = $6, state_id = $7, lga_id = $8,
             serial_number = $9, batch_number = $10, reference_number = $11, imei_1 = $12, imei_2 = $13, updated_at = NOW()
         WHERE id = $14
         RETURNING *`,
        [
          name,
          parseFloat(purchaseValue) || 0,
          purchaseDate,
          parseInt(usefulLife) || 5,
          parseFloat(salvageValue) || 0,
          parseInt(category_id),
          state_id ? parseInt(state_id) : null,
          lga_id ? parseInt(lga_id) : null,
          serialNumber || null,
          batchNumber || null,
          referenceNumber || null,
          imei1 || null,
          imei2 || null,
          id
        ]
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

  // In-memory cache for categories
  const categoryCache = {
    data: null,
    lastUpdated: null,
    ttl: 5 * 60 * 1000, // 5 minutes cache TTL
    get isStale() {
      return !this.lastUpdated || (Date.now() - this.lastUpdated > this.ttl);
    },
    update(data) {
      this.data = data;
      this.lastUpdated = Date.now();
      return data;
    }
  };

  // API endpoint to get hierarchical categories with filtering and search
  server.get('/api/categories/hierarchy', async (req, res) => {
    try {
      const { search, minLife, maxLife, parentId } = req.query;
      const cacheKey = JSON.stringify({ search, minLife, maxLife, parentId });

      // Return cached data if available and not stale
      if (!categoryCache.isStale && categoryCache.data?.[cacheKey]) {
        return res.json(categoryCache.data[cacheKey]);
      }

      // Build the base query
      let query = `
        WITH RECURSIVE category_tree AS (
          SELECT 
            id, 
            name, 
            parent_id, 
            default_useful_life_years,
            description,
            name as path,
            1 as level,
            to_tsvector('english', name || ' ' || COALESCE(description, '')) as search_vector
          FROM categories 
          WHERE 1=1
      `;

      const queryParams = [];
      let paramIndex = 1;

      // Add parent filter if specified
      if (parentId === 'null' || parentId === null || parentId === undefined) {
        query += ` AND parent_id IS NULL`;
      } else if (parentId) {
        query += ` AND parent_id = $${paramIndex++}`;
        queryParams.push(parentId);
      }

      // Add search filter if specified
      if (search) {
        query += ` AND to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery($${paramIndex++})`;
        queryParams.push(search);
      }

      // Add useful life filters if specified
      if (minLife) {
        query += ` AND default_useful_life_years >= $${paramIndex++}`;
        queryParams.push(parseInt(minLife));
      }

      if (maxLife) {
        query += ` AND default_useful_life_years <= $${paramIndex++}`;
        queryParams.push(parseInt(maxLife));
      }

      // Complete the recursive query
      query += `
        UNION ALL
        
        SELECT 
          c.id, 
          c.name, 
          c.parent_id, 
          c.default_useful_life_years,
          c.description,
          ct.path || ' > ' || c.name as path,
          ct.level + 1 as level,
          to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')) as search_vector
        FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
        WHERE 1=1
      `;

      // Add search filter to recursive part if needed
      if (search) {
        query += ` AND to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery($1)`;
      }

      query += `
      )
      SELECT 
        id,
        name,
        parent_id,
        default_useful_life_years,
        description,
        path,
        level
      FROM category_tree
      ORDER BY path;
      `;

      const { rows } = await pool.query(query, queryParams);

      // Build hierarchical structure
      const categoryMap = new Map();
      const rootCategories = [];

      // First pass: create all nodes
      rows.forEach(cat => {
        const category = {
          id: cat.id,
          name: cat.name,
          parentId: cat.parent_id,
          defaultUsefulLifeYears: cat.default_useful_life_years,
          description: cat.description,
          level: cat.level,
          children: []
        };
        categoryMap.set(cat.id, category);
      });

      // Second pass: build the tree
      rows.forEach(cat => {
        const category = categoryMap.get(cat.id);
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      const result = {
        flat: rows,
        hierarchical: rootCategories,
        timestamp: new Date().toISOString(),
        cacheHit: false
      };

      // Update cache
      if (!categoryCache.data) categoryCache.data = {};
      categoryCache.data[cacheKey] = result;
      categoryCache.lastUpdated = Date.now();

      res.json(result);

    } catch (error) {
      console.error('Error fetching category hierarchy:', error);
      res.status(500).json({
        error: 'Failed to load category hierarchy',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Default catch-all handler to allow Next.js to handle all other routes
  server.use((req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
