# How to Run This Chat Application

This document provides instructions on how to set up and run the real-time chat application.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **Node.js and npm:**
    *   You can download Node.js (which includes npm) from the official website: [https://nodejs.org/](https://nodejs.org/)
    *   Alternatively, use a version manager like `nvm` (Node Version Manager).
2.  **Redis Server:**
    *   Redis is used for storing message history and managing connected users.
    *   **For Debian/Ubuntu-based Linux (like many container environments):**
        ```bash
        sudo apt update
        sudo apt install redis-server
        ```
    *   **For other systems (macOS with Homebrew, Windows, Docker):** Refer to the official Redis documentation for installation instructions: [https://redis.io/docs/getting-started/installation/](https://redis.io/docs/getting-started/installation/)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/barangan-student/siaa-project10.git
    cd siaa-project10
    ```
    *(Note: If you already have the project files, you can skip cloning and just navigate to the project directory.)*

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

## Running the Application

The application consists of two main parts: the Redis server and the Node.js application.

### 1. Start the Redis Server

You need to start the Redis server first.

*   **If you are in a containerized environment (like some development environments) or installed via `apt`:**
    ```bash
    sudo service redis-server start
    ```
*   **If you installed Redis directly (e.g., `redis-server` command is available in your terminal):**
    ```bash
    redis-server
    ```
    *(Note: The `redis-server` command usually runs in the foreground. You might need to open a new terminal window/tab for the next step.)*

### 2. Start the Node.js Application

Once the Redis server is running, start the Node.js application:

```bash
node server.js
```

You should see output similar to:
```
Connected to Redis!
Server running on port 3000
```

### 3. Access the Chat Application

Open your web browser and navigate to:

[http://localhost:3000](http://localhost:3000)

## Testing the Application

*   Open multiple browser tabs or windows and join the chat with different usernames to simulate multiple users.
*   Send messages and observe them appearing in all connected clients.
*   Test the 1000-character message limit.
*   Test the user join/leave notifications.
*   Restart the `node server.js` process (after stopping it with `Ctrl+C`) and verify that the message history persists (thanks to Redis).
