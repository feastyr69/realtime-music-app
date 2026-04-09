const { redisClient } = require("../config/redis");

const searchSong = async (req, res) => {
    try {
        const songName = req.query.query;
        const cachedData = await redisClient.get(`search:${songName}`);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }
        const { default: YTMusic } = await import("ytmusic-api");
        const ytmusic = new YTMusic();
        await ytmusic.initialize();
        const data = await ytmusic.searchSongs(songName);
        const searchKey = `search:${songName}`;
        await redisClient.set(searchKey, JSON.stringify(data));
        await redisClient.expire(searchKey, 60 * 60);

        return res.status(200).json(data);
    } catch (err) {
        console.log("error aya");
        return res.status(500).json([]);
    }
}

const cueSong = async (roomId, videoId) => {
    try {
        const { default: YTMusic } = await import("ytmusic-api");
        const ytmusic = new YTMusic();
        await ytmusic.initialize();
        console.log(videoId);
        const data = await ytmusic.getSong(videoId);
        const cueKey = `room:${roomId}:cue`;
        await redisClient.rPush(cueKey, JSON.stringify(data));
        await redisClient.expire(cueKey, 60 * 60);
        return data;
    } catch (err) {
        console.log(err);
        return [];
    }
}

const getQueue = async (roomId) => {
    try {
        const cueKey = `room:${roomId}:cue`;
        const data = await redisClient.lRange(cueKey, 0, -1);
        return data.map((item) => JSON.parse(item));
    } catch (err) {
        console.log(err);
        return [];
    }
}

const nextSong = async (roomId) => {
    try {
        const cueKey = `room:${roomId}:cue`;
        await redisClient.lPop(cueKey);
        const data = await getQueue(roomId);
        return data;
    } catch (err) {
        console.log(err);
        return [];
    }
}

const removeSong = async (roomId, index) => {
    try {
        const cueKey = `room:${roomId}:cue`;
        await redisClient.lSet(cueKey, index, "TO_DELETE");
        await redisClient.lRem(cueKey, 0, "TO_DELETE");
        const data = await getQueue(roomId);
        return data;
    } catch (err) {
        console.log(err);
        return [];
    }
}

module.exports = { searchSong, cueSong, getQueue, nextSong, removeSong };
