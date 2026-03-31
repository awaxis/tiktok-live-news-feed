# TikTok Live News Overlay

A real-time news ticker overlay for TikTok Live Studio (or OBS Broadcaster), animated smoothly using CSS and WebSockets. It includes dynamic API routes to append, update, and manage your text messages on the fly. It also features a Telegram listener to automatically push your Telegram channel posts directly to your live stream screen!

## Table of Contents
1. [Installation](#installation)
2. [Environment Variables](#environment-variables)
3. [Telegram Bot & Channel Setup](#telegram-bot--channel-setup)
4. [TikTok Live Studio / OBS Setup](#tiktok-live-studio--obs-setup)
5. [API Routes Reference](#api-routes-reference)

---

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. Clone or download this project to your computer.
3. Open a terminal in the project folder and install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *(This uses `nodemon` to automatically reload if you edit the code!)*

Your local API and overlay are now running (by default on `http://localhost:3000` or the port specified in your `.env`).

---

## Environment Variables

Create a file named `.env` in the root of your project and include these variables:

```env
# The port your local server will run on
PORT=3080

# Comma-separated list of API keys to protect your management routes
API_KEYS=my-secret-key-1,my-super-secret-key-2

# (Optional) Required ONLY if you want to use the Telegram auto-poster tool
TELEGRAM_BOT_TOKEN=your-botfather-token-here

# (Optional) If you are running the server remotely instead of localhost
SERVER_URL=http://localhost:3080
```

---

## Telegram Bot & Channel Setup

If you want to manage your stream overlay simply by sending messages in a Telegram channel, follow these steps:

1. **Create the Bot:**
   - Open Telegram and search for **@BotFather**.
   - Send the message `/newbot` and follow the prompts to create your bot.
   - You will be given a token (e.g., `123456789:ABCdefGHI...`). Copy this token.
   - Add this token to your `.env` file as `TELEGRAM_BOT_TOKEN`.

2. **Configure Your Channel:**
   - Create a Telegram Channel (or use an existing one).
   - Add your newly created Bot to the channel **as an Administrator**. This gives the bot permission to read channel posts.

3. **Start the Listener:**
   - Open a *second* terminal window in your project folder (keep your main server running) and run:
     ```bash
     npm run telegram
     ```
   
**How it works:**
Whenever you post a text message in your Telegram channel, the bot intercepts it. It automatically skips posts with images or videos, extracts **the first line** of your text, and pushes it directly to the `/append` route of your local ticker!

---

## TikTok Live Studio / OBS Setup

To display the ticker on your stream:

1. Open TikTok Live Studio or OBS.
2. Add a new **Browser Source** (called *Source Web* or *Lien* in some software).
3. Set the URL to your local server: `http://localhost:3080/` (make sure it matches your `.env` PORT).
4. For the dimensions, set the **Width** to match your screen (`1920` or `1080` for portrait TikTok) and **Height** to something like `150`.
5. Ensure that "Transparent Background" or equivalent is checked.
6. Position the browser source at the bottom of your stream layout.

Your ticker will now appear and will smoothly scroll any messages you send to it!

---

## API Routes Reference

> **💡 Pro Tip:** A ready-to-use Postman collection (`management_postman_collection.json`) is included in this repository! You can import it directly into Postman to quickly test and manage all API endpoints without manually copying cURL commands.

To manage messages manually via code, command line, or your own control panel, you can use these API routes.

> **Security Note:** All `POST`, `PUT`, and `DELETE` routes require an `x-api-key` header to be sent with the request. The value must match one of the keys defined in your `API_KEYS` `.env` variable.

### 1. View Ticker Data
- **`GET /`** : Serves the HTML overlay for your broadcasting software.
- **`GET /messages`** : Returns a JSON array of all current messages. *(No API key required)*
- **`GET /limit`** : Returns the current maximum number of messages allowed before the oldest falls off. *(No API key required)*

### 2. Append & Update
- **`POST /append`**
  Add a message to the end of the line. If the total exceeds the limit, the oldest message is dropped.
  **cURL Example:**
  ```bash
  curl -X POST http://localhost:3080/append \
       -H "Content-Type: application/json" \
       -H "x-api-key: my-secret-key-1" \
       -d '{"text": "My brand new announcement!"}'
  ```

- **`POST /update`**
  Wipes the slate clean and replaces all ticker texts with this single new message.
  **cURL Example:**
  ```bash
  curl -X POST http://localhost:3080/update \
       -H "Content-Type: application/json" \
       -H "x-api-key: my-secret-key-1" \
       -d '{"text": "Breaking news!"}'
  ```

### 3. Modify Specified Positions
- **`PUT /messages/:index`**
  Replaces a specific message array item. (e.g. `/messages/0` replaces the first item).
  **cURL Example:**
  ```bash
  curl -X PUT http://localhost:3080/messages/0 \
       -H "Content-Type: application/json" \
       -H "x-api-key: my-secret-key-1" \
       -d '{"text": "Corrected text here"}'
  ```

- **`DELETE /messages/:index`**
  Removes a message from the ticker entirely based on its position in the array.
  **cURL Example:**
  ```bash
  curl -X DELETE http://localhost:3080/messages/0 \
       -H "x-api-key: my-secret-key-1"
  ```

### 4. Dynamic Limits
- **`PUT /limit`**
  Change the total number of messages your ticker will hold. If you shrink the limit below your current message count, the oldest messages are truncated instantly.
  ```bash
  curl -X PUT http://localhost:3080/limit \
       -H "Content-Type: application/json" \
       -H "x-api-key: my-secret-key-1" \
       -d '{"limit": 5}'
  ```

### 5. Dynamic Overlay Configuration (Styling)
- **`GET /config`**
  Returns the current styling configuration for the overlay (speed, font, colors, etc.). *(No API key required)*

- **`PUT /config`**
  Instantly update the ticker's visual style. Broadcasts changes immediately to all connected OBS / frontend clients without reloading the source!
  **cURL Example:**
  ```bash
  curl -X PUT http://localhost:3080/config \
       -H "Content-Type: application/json" \
       -H "x-api-key: my-secret-key-1" \
       -d '{
            "speed": 10,
            "fontSize": 70,
            "color": "#00ff00",
            "backgroundColor": "#111111",
            "textShadow": "0px 0px 10px rgba(255, 0, 0, 1)"
           }'
  ```
