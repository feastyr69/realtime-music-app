const {redisClient} = require("../config/redis");
const {nanoid} = require("nanoid");

const createRoom = async (req, res) =>{
    try {
        const roomId = nanoid(10);
        await redisClient.zAdd("rooms", {
            score: Date.now(),
            value: roomId
        });
        await redisClient.hSet(`room:${roomId}:info`, {
            roomId: roomId,
            createdAt: Date.now(),
            type: "public",
            
        });
        await redisClient.expire(`room:${roomId}:info`, 60 * 60);
        console.log("Creating room...", roomId);
        return res.status(200).json({ roomId });
    } catch (error) {
        console.error("Error creating room:", error);
        return res.status(500).json({ status: "failed", message: "Error creating room" });
    }
}

const getRoomInfo = async (req, res) =>{
    try {
        const { roomId } = req.params;
        const roomData = await redisClient.hmGet(`room:${roomId}:info`, ["roomId", "createdAt", "type"]);
        if(roomData[0]){
            return res.status(200).json({
                roomId: roomData[0], 
                createdAt: roomData[1], 
                type: roomData[2], 
                success: true 
            });
        }
        return res.status(200).json({ success: false });
    } catch (error) {
        console.error("Error checking room:", error);
        return res.status(500).json({ status: "failed", message: "Error checking room" });
    }
}

const getRoomHistory = async (roomId) =>{
    const roomKey = `room:${roomId}:messages`;
    try{
        const rawMessages = await redisClient.lRange(roomKey, 0, -1);
        return rawMessages.map(msg => JSON.parse(msg));
    }catch(err){
        console.log(err);
        return [];
    }
}

const saveMessage = async (roomId, msgObj) => {
    const roomKey = `room:${roomId}:messages`;
    const timestamp = Date.now();
    try {
        await redisClient.rPush(roomKey, JSON.stringify({ ...msgObj, timestamp }));
        await redisClient.expire(roomKey, 60 * 60);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {createRoom, getRoomHistory, saveMessage, getRoomInfo};