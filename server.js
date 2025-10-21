// server.js

const express = require('express');
const http = require('http');
const socketio = require('socket.io');

// Initialize Express app and create an HTTP server
const app = express();
const server = http.createServer(app);

// Integrate Socket.IO with the HTTP server
const io = socketio(server);

const { createClient } = require('redis');

const redisClient = createClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
    console.log('Connected to Redis!');
})();

// Serve static files from the 'public' directory
app.use(express.static('public'));

// --- Application State Management ---


 



/**
 * Handles all real-time communication events for connected clients.
 */
io.on('connection', (socket) => {
    console.log(`[LOG] User connected: ${socket.id}`);

    /**
     * Handles a user's attempt to join the chat with a username.
     * Validates that the username is not already in use.
     */
    socket.on('join', async (username) => {
        if (!redisClient.isReady) {
            console.error('[ERROR] Redis client is not ready. Cannot process join request.');
            socket.emit('join_error', 'Server is experiencing issues. Please try again later.');
            return;
        }
        // Check if username is already taken using Redis SET
        const usernameExists = await redisClient.SISMEMBER('chat:users:online', username);
        if (usernameExists) {
            socket.emit('join_error', 'Username is already taken. Please choose another.');
            return;
        }

        // Store the user's data in Redis HASH and SET
        await redisClient.HSET('chat:users:socket_to_username', socket.id, username);
        await redisClient.SADD('chat:users:online', username);
        console.log(`[LOG] User ${socket.id} joined as: ${username}`);
        
        // Now that the user has successfully joined, send them the chat history from Redis.
        const rawHistory = await redisClient.LRANGE('chat:messages', 0, -1);
        const messageHistory = rawHistory.map(msg => JSON.parse(msg)).reverse();
        socket.emit('history', messageHistory);
        
        // Confirm successful join to the client, sending the confirmed username back.
        socket.emit('join_success', username);

        // Notify ALL clients (including the sender) that a new user has joined.
        socket.broadcast.emit('notification', `${username} has joined the chat.`);
        
        // Send the updated user list to all clients from Redis HASH values
        const users = await redisClient.HVALS('chat:users:socket_to_username');
        io.emit('user_list', users);
    });

    /**
     * Handles incoming chat messages from a client.
     * Adds a server-side timestamp and broadcasts the message to all clients.
     */
    socket.on('message', async (msg) => {
        if (!redisClient.isReady) {
            console.error('[ERROR] Redis client is not ready. Cannot process message.');
            return;
        }
        const username = await redisClient.HGET('chat:users:socket_to_username', socket.id);
        if (!username) return;

        const fullMessage = {
            user: username,
            text: msg,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        };

        io.emit('message', fullMessage);

        // Redis operations for message history
        await redisClient.LPUSH('chat:messages', JSON.stringify(fullMessage));
        await redisClient.LTRIM('chat:messages', 0, 499); // Keep only the last 500 messages
    });

    /**
     * Handles 'typing' indicators from a client.
     * Broadcasts the typing event to all other clients.
     */
    socket.on('typing', async () => {
        const username = await redisClient.HGET('chat:users:socket_to_username', socket.id);
        if (username) {
            socket.broadcast.emit('typing', username);
        }
    });

    /**
     * Handles the disconnection of a client.
     * Removes the user from the list and notifies other clients.
     */
    socket.on('disconnect', async () => {
        // Retrieve username from Redis HASH
        const username = await redisClient.HGET('chat:users:socket_to_username', socket.id);
        if (username) {
            // Remove user from Redis HASH and SET
            await redisClient.HDEL('chat:users:socket_to_username', socket.id);
            await redisClient.SREM('chat:users:online', username);
            
            // Notify ALL clients that the user has left.
            io.emit('notification', `${username} has left the chat.`);
            
            // Send the updated user list to all clients from Redis HASH values.
            const users = await redisClient.HVALS('chat:users:socket_to_username');
            io.emit('user_list', users);
        }
        console.log(`[LOG] User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});