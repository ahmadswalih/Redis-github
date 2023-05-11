const express = require("express");
const redis = require("redis");

const PORT = process.env.PORT || 4000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient({
  legacyMode: true,
  PORT: REDIS_PORT,
});
client.connect();

const app = express();

const getResponse = (username, repos) => {
  return `<h2> ${username} has ${repos} public repos in github </h2>`;
};

const getRepos = async (req, res, next) => {
  try {
    console.log("fetching Data");
    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    //added data to Redis

    client.setEx(username, 3600, repos);

    res.send(getResponse(username, repos));
  } catch (error) {
    console.log(error);
    res.status(500);
  }
};

//Caching Data
const cache = (req, res, next) => {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(getResponse(username, data));
    } else {
      next();
    }
  });
};

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`app is running at port ${PORT}`);
});
