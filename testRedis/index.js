const express = require('express');
var { createHandler } = require("graphql-http/lib/use/express")
var { buildSchema } = require("graphql")
const { createClient } = require('redis');

const app = express();

var schema = buildSchema(`
  type Query {
    hql: String
    shirtColor: String
  }
`)

const resolver = {
  hql() {
    return "Testing garphql"
  },
  shirtColor(){
    return "Red"
  }
}

// Create a Redis client connected to the specified port
const client = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6739
  }
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis on port 6739');
});

// Connect to the Redis server
client.connect().catch(err => {
  console.error('Failed to connect to Redis:', err);
});

app.use(express.json());

app.use('/hql', createHandler({
  schema: schema,
  rootValue: resolver
}))

// Fetch all keys and their values
app.get('/all-keys', async (req, res) => {
  try {
    // Fetch all keys
    const keys = await client.keys('*');

    // Fetch values for each key
    const values = await Promise.all(keys.map(key => client.get(key)));

    // Combine keys and values into an object
    const result = keys.reduce((acc, key, idx) => {
      acc[key] = values[idx];
      return acc;
    }, {});

    res.json(result);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

app.get('/', async (req, res) => {
  try {
    res.send("Testing Redis For Fetching data");
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// Single key retrieval endpoint for reference
app.get('/:id', async (req, res) => {
  try {
    const key = req.params.id;
    const data = await client.get(key);
    res.send(data || "Key not found");
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// app.post('/data', async (req, res) => {
//   const { key, value } = req.body;
//   try {
//     const reply = await client.set(key, value);
//     res.send(reply);
//   } catch (err) {
//     res.status(500).send(err.toString());
//   }
// });

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
