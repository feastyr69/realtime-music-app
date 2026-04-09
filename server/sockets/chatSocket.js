const { getRoomHistory, saveMessage } = require("../services/chatService");
const { cueSong, getQueue, nextSong, removeSong } = require("../services/ytMusic");
const { joinUser, getUsersInRoom, removeUser } = require("../services/roomService");

const skipLocks = new Map();

const connectIO = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected");

        //user join room
        socket.on("join-room", async (clientData) => {
            const { roomId, sessionId, userName, avatarUrl, joinedAt } = clientData;
            socket.join(roomId);

            socket.roomId = roomId;
            socket.userId = sessionId;
            socket.userName = userName;
            socket.avatarUrl = avatarUrl;
            await joinUser(roomId, sessionId, userName, avatarUrl);

            console.log(`User ${socket.id} joined room ${roomId}`);
            if (!skipLocks.get(userName + roomId)) {
                socket.to(roomId).emit("receive-message", { message: `${userName} has joined the room`, sender: "System" });
                await saveMessage(roomId, `${userName} has joined the room`, "System");
            }
            skipLocks.set(userName + roomId, true);
            setTimeout(() => skipLocks.delete(userName + roomId), 15000);

            const history = await getRoomHistory(roomId);
            socket.emit("room-history", history);

            const users = await getUsersInRoom(roomId);
            io.to(roomId).emit("update-users", users);
        });


        //user send message
        socket.on("send-message", async (data) => {
            const { roomId, messageObj } = data;
            await saveMessage(roomId, messageObj.message, messageObj.sender);
            socket.to(roomId).emit("receive-message", messageObj);
        });

        //user cue song
        socket.on("cue-song", async (roomId, videoId) => {
            await cueSong(roomId, videoId);
            const updatedQueue = await getQueue(roomId);
            io.to(roomId).emit("queue-results", updatedQueue);
            if (updatedQueue.length == 1) {
                io.to(roomId).emit("current-song", updatedQueue[0]);
                io.to(roomId).emit("receive-sync-song", {
                    videoId: updatedQueue[0].videoId, isPlaying: true, progress: 0, songData: updatedQueue[0]
                });
            }
        });

        //user get queue
        socket.on("get-queue", async (roomId) => {
            const data = await getQueue(roomId);
            io.to(roomId).emit("queue-results", data);
        });

        //user next song
        socket.on("next-song", async (roomId, currentVideoId) => {
            console.log("next song request from room", roomId);
            if (skipLocks.get(roomId)) {
                return;
            }
            skipLocks.set(roomId, true);
            setTimeout(() => skipLocks.delete(roomId), 1000);

            const queue = await getQueue(roomId);

            if (currentVideoId && queue.length > 0 && queue[0].videoId !== currentVideoId) {
                return;
            }

            const data = await nextSong(roomId);
            console.log("next song");
            console.log(data);
            io.to(roomId).emit("queue-results", data);
            io.to(roomId).emit("current-song", data[0] || null);
            if (data[0]) {
                io.to(roomId).emit("receive-sync-song", {
                    videoId: data[0].videoId, isPlaying: true, progress: 0, songData: data[0]
                });
            }
        });

        //user remove song
        socket.on("remove-song", async (roomId, index, videoId) => {
            if (index === 0) return; // prevent removing current song this way
            const queue = await getQueue(roomId);
            if (queue[index] && queue[index].videoId === videoId) {
                const updatedQueue = await removeSong(roomId, index);
                io.to(roomId).emit("queue-results", updatedQueue);
            }
        });

        //user get current song
        socket.on("get-current-song", async (roomId) => {
            const data = await getQueue(roomId);
            socket.emit("current-song", data[0] || null);
        });


        //user disconnect
        socket.on("disconnect", async () => {
            console.log(`User disconnected: ${socket.userName} from ${socket.roomId}`);
            if (socket.roomId && socket.userName) {
                await removeUser(socket.roomId, socket.userId, socket.userName, socket.avatarUrl);

                const users = await getUsersInRoom(socket.roomId);
                io.to(socket.roomId).emit("update-users", users);

                socket.to(socket.roomId).emit("receive-message", {
                    message: `${socket.userName} has left the room`,
                    sender: "System"
                });
            }
        });

        //user sync song
        socket.on("sync-song", async (roomId, songData) => {
            socket.to(roomId).emit("receive-sync-song", songData);
        });

        //user request sync
        socket.on("request-sync", async (roomId) => {
            console.log("request sync from room", roomId);
            const totalSockets = await io.in(roomId).fetchSockets();
            if (totalSockets.length > 1) {
                const proxySocket = totalSockets.find(s => s.id !== socket.id);
                if (proxySocket) {
                    io.to(proxySocket.id).emit("provide-sync");
                }
            }
            else {

                const data = await getQueue(roomId);
                if (data[0]) socket.emit("receive-sync-song", {
                    videoId: data[0].videoId,
                    isPlaying: true,
                    progress: 0,
                    duration: data[0].duration,
                    songData: data[0]
                })
            }
        });

        //user logs action

        socket.on('log-action', async (roomId, sender, action, timestamp) => {
            if (action === "skipped") {
                await saveMessage(roomId, sender + " skipped the song", "System");
                io.to(roomId).emit('receive-message', {
                    message: sender + " skipped the song",
                    sender: "System",
                    timestamp: timestamp
                })
            }
            if (action === "cued") {
                await saveMessage(roomId, sender + " cued a song", "System");
                io.to(roomId).emit('receive-message', {
                    message: sender + " cued a song",
                    sender: "System",
                    timestamp: timestamp
                })
            }
            if (action === "removed") {
                await saveMessage(roomId, sender + " removed a song", "System");
                io.to(roomId).emit('receive-message', {
                    message: sender + " removed a song",
                    sender: "System",
                    timestamp: timestamp
                })
            }
        })

    });

    console.log("Sockets connected!")
};

module.exports = connectIO;

