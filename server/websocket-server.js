const { Server } = require('socket.io');
const http = require('http');

class WebSocketServer {
  constructor(port = 3001) {
    this.port = port;
    this.server = http.createServer();
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.rooms = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle room joining
      socket.on('join_room', (room) => {
        socket.join(room);
        this.addToRoom(room, socket.id);
        console.log(`Client ${socket.id} joined room: ${room}`);
      });

      // Handle room leaving
      socket.on('leave_room', (room) => {
        socket.leave(room);
        this.removeFromRoom(room, socket.id);
        console.log(`Client ${socket.id} left room: ${room}`);
      });

      // Handle custom events
      socket.on('event', (eventData) => {
        this.broadcastEvent(eventData);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.removeFromAllRooms(socket.id);
      });
    });
  }

  addToRoom(room, socketId) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(socketId);
  }

  removeFromRoom(room, socketId) {
    if (this.rooms.has(room)) {
      this.rooms.get(room).delete(socketId);
      if (this.rooms.get(room).size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  removeFromAllRooms(socketId) {
    for (const [room, sockets] of this.rooms.entries()) {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.rooms.delete(room);
        }
      }
    }
  }

  broadcastEvent(eventData, room = null) {
    if (room) {
      this.io.to(room).emit('event', eventData);
    } else {
      this.io.emit('event', eventData);
    }
  }

  // Asset-related events
  emitAssetUpdate(assetData, action) {
    const event = {
      type: 'asset_update',
      data: {
        ...assetData,
        action,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.broadcastEvent(event, 'dashboard');
    this.broadcastEvent(event, 'assets');
  }

  // User activity events
  emitUserActivity(userData, action) {
    const event = {
      type: 'user_activity',
      data: {
        ...userData,
        action,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.broadcastEvent(event, 'dashboard');
    this.broadcastEvent(event, 'admin');
  }

  // System notifications
  emitSystemNotification(message, level = 'info', room = null) {
    const event = {
      type: 'system_notification',
      data: {
        message,
        level,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.broadcastEvent(event, room);
  }

  // Depreciation updates
  emitDepreciationUpdate(assetData) {
    const event = {
      type: 'depreciation_update',
      data: {
        ...assetData,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.broadcastEvent(event, 'dashboard');
    this.broadcastEvent(event, 'finance');
  }

  // Get room statistics
  getRoomStats() {
    const stats = {};
    for (const [room, sockets] of this.rooms.entries()) {
      stats[room] = sockets.size;
    }
    return stats;
  }

  // Start the server
  start() {
    this.server.listen(this.port, () => {
      console.log(`WebSocket server running on port ${this.port}`);
    });
  }

  // Stop the server
  stop() {
    this.server.close(() => {
      console.log('WebSocket server stopped');
    });
  }
}

// Export singleton instance
const webSocketServer = new WebSocketServer();

// Auto-start if this file is run directly
if (require.main === module) {
  webSocketServer.start();
}

module.exports = webSocketServer;
