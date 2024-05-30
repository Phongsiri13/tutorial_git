const express = require('express');
var { createHandler } = require("graphql-http/lib/use/express")
var { buildSchema } = require("graphql")
const axios = require("axios")
const { createClient } = require('redis');

const employees_data = require('./employee')

const endpoints = [
  "http://localhost:3000/employees",
]

const app = express();


// ########## GarphQL Testing #############
// Set schema that match to database
// It's object type
var schema = buildSchema(`
  type Query {
    employee(id: ID!): Employee
    employees(limit: Int = 6, gender: String, age: AGE): [Employee]
  }

  type Mutation {
    createMessage: String
  }

  type Employee {
    id: Int
    firstName: String
    lastName: String
    salary: Int
    age: Int
    gender: String
  }

  enum AGE{
    YOUNG
    OLD
  }

`)

// value of key search
const resolver = {
  async employee(args) {
    // return new Promise((resolve , reject)=>{

    //   console.log("querying data")
    //   setTimeout(() => {
    //     resolve(employees_data.find(d=> d.id == args.id))
    //   }, 1000);
    // })
    // console.log("test:",args)
    const { data: employees } = await axios.get(`${endpoints[0]}/${args.id}`)

    return employees
  },
  // employees(args){
  //   let emp = [].concat(employees_data)
  //   console.log("arg:",args)
  //   // reflex url
  //   if(args.gender){
  //     emp = emp.filter(d=> d.gender == args.gender)
  //   }

  //   if(args.age){
  //     if(args.age == "YOUNG") emp = emp.filter(d=> d.age <= 28)
  //     else if(args.age = "OLD") emp = emp.filter(d=> d.age > 28)
  //     // emp = args.age == "YOUNG" ? emp.filter(d=> d.age <= 28):emp.filter(d=> d.age > 28)
  //   }

  //   // console.log(args)
  //   return emp.slice(0, args.limit)
  // }
  async employees(args) {
    // console.log("test:",args)
    const { data: employees } = await axios.get(`${endpoints[0]}?_limit=${args.limit}`)
    return employees
  },
  createMessage() {
    return "Hello World";
  }
}

// mockup fech from hql
app.get('/employees', (req, res) => {
  console.log("::", req.query)
  if (req.query) {
    return res.send(employees_data.find(item => item.id == req.query.id));
  }
  return res.send(employees_data.slice(0, parseInt(req.query._limit) || 10));
})

// mockup fech from hql with one data
app.get('/employees/:id', (req, res) => {
  // console.log("::x", req.params.id)
  if (req.query) {
    return res.send(employees_data.find(item => item.id == parseInt(req.params.id)));
  }
})

// -----------------------------------------

// ####################### Check if no data in cach ##############################
// Endpoint to get data
app.get('/pd', async (req, res) => {
  try {
    // Check if data exists in Redis cache
    const data = await client_redis.get('data');

    if (data) {
      console.log("Taking data in redis-cach")
      // Data found in cache, return it
      res.json(JSON.parse(data));
    } else {
      // Data not found in cache, fetch from database
      const newData = await fetchDataFromDatabase();

      // Store fetched data in Redis cache
      client_redis.set('data', JSON.stringify(newData));
      console.log("Taking data from database")
      // Return fetched data
      res.json(newData);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to fetch data from database (replace with your actual database query)
async function fetchDataFromDatabase() {
  // Simulated database query
  return [
    { id: 1, name: 'Data 1' },
    { id: 2, name: 'Data 2' },
    { id: 3, name: 'Data 3' }
  ];
}

// Cache data when the server starts
async function cacheData() {
  try {
    // Convert data to JSON string
    // Check if data exists in Redis cache
    const data = await client_redis.get('data');
    if (data) {
      // Data found in cache, return it
      console.log('there is data in cach')
    } else {
      // Data not found in cache, fetch from database
      const newData = await fetchDataFromDatabase();
      // Store data in Redis cache
      client_redis.set('data', JSON.stringify(newData));
      // Return fetched data
    }
    console.log('Data cached successfully.');
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

// ---------------------------------------------------------

// Create a Redis client connected to the specified port
const client_redis = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6739
  }
});

client_redis.on('error', (err) => {
  console.error('Redis error:', err);
});

client_redis.on('connect', () => {
  console.log('Connected to Redis on port 6739');
  cacheData()
});

// Connect to the Redis server
client_redis.connect().catch(err => {
  console.error('Failed to connect to Redis:', err);
});

app.use(express.json());

// Test on garphql
app.use('/hql', createHandler({
  schema: schema,
  rootValue: resolver
}))

// Fetch all keys and their values
app.get('/all-keys', async (req, res) => {
  try {
    // Fetch all keys
    const keys = await client_redis.keys('*');

    // Fetch values for each key
    const values = await Promise.all(keys.map(key => client_redis.get(key)));

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
    const data = await client_redis.get(key);
    res.send(data || "Key not found");
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// app.post('/data', async (req, res) => {
//   const { key, value } = req.body;
//   try {
//     const reply = await client_redis.set(key, value);
//     res.send(reply);
//   } catch (err) {
//     res.status(500).send(err.toString());
//   }
// });

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
