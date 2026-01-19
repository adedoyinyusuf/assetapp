"use client";

import { io } from "socket.io-client";

// Singleton socket instance
export const socket = io({
    autoConnect: true,
    reconnection: true,
});
