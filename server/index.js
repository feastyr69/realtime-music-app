const express = require("express");
const session = require("express-session");
const apiRouter = require("./routes/apiRoutes");
const connectIO = require("./sockets/chatSocket");
const { connectRedis, socketAdapter } = require("./config/redis");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const { createServer } = require("http");
dotenv.config({ path: "./.env" });

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://aura-backend-ebam.onrender.com"
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  },
  adapter: socketAdapter,
  // Skip HTTP long-polling and connect straight to WebSocket.
  // This avoids the polling→WebSocket upgrade step that Render's proxy
  // kills mid-flight, causing the "disconnects a few seconds after joining" bug.
  transports: ['websocket'],
  pingInterval: 10000,  // send ping every 10s
  pingTimeout: 5000,    // disconnect if no pong within 5s
});

const { initDb } = require("./database/db");
initDb();

//databaseConnection();
connectRedis();
connectIO(io);

const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));


const authRouter = require("./routes/authRoutes");
const passport = require("./config/passport");

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRouter);
app.use("/api", apiRouter);

httpServer.listen(8000, () => {
  console.log("Server is running on port 8000");
});
