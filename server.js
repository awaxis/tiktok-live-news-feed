require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "overlay.html"));
});

let messages = ["Bienvenue sur le live 🚀"];
let messageLimit = 10;

const requireApiKey = (req, res, next) => {
    const key = req.headers["x-api-key"];
    const validKeys = (process.env.API_KEYS || "").split(",").map(k => k.trim());

    if (!key || !validKeys.includes(key)) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }
    next();
};

const broadcastMessages = () => {
    io.emit("message-update", { text: messages.join(" • ") });
};

io.on("connection", (socket) => {
    socket.emit("message-update", { text: messages.join(" • ") });
});

app.post("/update", requireApiKey, (req, res) => {
    const text = req.body?.text;
    if (text) {
        messages = [text];
        broadcastMessages();
    }
    res.send({ status: "ok" });
});

app.post("/append", requireApiKey, (req, res) => {
    const text = req.body?.text;
    if (text) {
        messages.push(text);
        if (messages.length > messageLimit) {
            messages = messages.slice(-messageLimit);
        }
        broadcastMessages();
    }
    res.send({ status: "ok" });
});

app.get("/limit", (req, res) => {
    res.json({ limit: messageLimit });
});

app.put("/limit", requireApiKey, (req, res) => {
    const newLimit = parseInt(req.body?.limit, 10);
    if (isNaN(newLimit) || newLimit < 1) {
        return res.status(400).json({ error: "Invalid limit" });
    }

    messageLimit = newLimit;

    // Automatically truncate existing messages if limit is shrunk
    if (messages.length > messageLimit) {
        messages = messages.slice(-messageLimit);
        broadcastMessages();
    }

    res.json({ status: "ok", limit: messageLimit });
});

app.get("/messages", (req, res) => {
    res.json(messages);
});

app.put("/messages/:index", requireApiKey, (req, res) => {
    const index = parseInt(req.params.index, 10);
    const text = req.body?.text;

    if (isNaN(index) || index < 0 || index >= messages.length) {
        return res.status(404).json({ error: "Message not found" });
    }
    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }

    messages[index] = text;
    broadcastMessages();
    res.json({ status: "ok", messages });
});

app.delete("/messages/:index", requireApiKey, (req, res) => {
    const index = parseInt(req.params.index, 10);

    if (isNaN(index) || index < 0 || index >= messages.length) {
        return res.status(404).json({ error: "Message not found" });
    }

    messages.splice(index, 1);
    broadcastMessages();
    res.json({ status: "ok", messages });
});

app.get("/message", (req, res) => {
    res.json({ text: messages.join(" • ") });
});

const PORT = process.env.PORT || 3000;
const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;

server.listen(PORT, () => {
    console.log(`Overlay API running on ${serverUrl}`);
});