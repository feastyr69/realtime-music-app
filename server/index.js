const express = require("express");
const databaseConnection = require("./database");
const crudRouter = require("./routes/crud.routes");
const connectIO = require("./sockets/chatSocket");
const { connectRedis } = require("./config/redis");
const cors = require("cors");

const io = require("socket.io")(3000, {
  cors: {
    origin: "http://localhost:5173"
  },
});

//databaseConnection();
connectRedis();
connectIO(io);

const app = express();

app.use(express.json());
app.use(cors());



app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", crudRouter);

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
