const redis = require("redis");
const redisClient = redis.createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
    await redisClient.connect();
    console.log("Redis Connected!");
}

module.exports = { redisClient, connectRedis };