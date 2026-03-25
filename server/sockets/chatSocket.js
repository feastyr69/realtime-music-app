const { getRoomHistory, saveMessage } = require("../services/chatService");

const connectIO = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected");


        //user join room
        socket.on("join-room", async (roomId,senderName) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
            const history = await getRoomHistory(roomId);
            socket.emit("room-history", history);
            await saveMessage(roomId, `${senderName} has joined the room`, "System");
            socket.to(roomId).emit("receive-message", {message: `${senderName} has joined the room`, sender: "System"});
        });


        //user send message
        socket.on("send-message", async (data) => {
            const { roomId, messageObj } = data;
            await saveMessage(roomId, messageObj.message, messageObj.sender);
            socket.to(roomId).emit("receive-message", messageObj);
        });

        //user disconnect
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });

    console.log("Sockets connected!")
};

module.exports = connectIO;

