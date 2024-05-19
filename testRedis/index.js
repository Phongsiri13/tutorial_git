const express = require('express');
const redis = require('redis');

const app = express();
const client = redis.createClient();

client.on('error', (err) => {
  console.error('Redis error:', err);
});

app.use(express.json());

app.get('/data', async (req, res) => {
  client.get('some-key', (err, data) => {
    if (err) return res.status(500).send(err);
    res.send(data);
  });
});

app.post('/data', async (req, res) => {
  const { key, value } = req.body;
  client.set(key, value, (err, reply) => {
    if (err) return res.status(500).send(err);
    res.send(reply);
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
