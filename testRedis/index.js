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

// Set schema that match to database
// It's object type
var schema = buildSchema(`
  type Query {
    employee(id: ID!): Employee
    employees(limit: Int = 6, gender: String, age: AGE): [Employee]
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

// position: String
// department: String
// start_date: String

// value of key search
const resolver = {
  async employee(args){
    // return new Promise((resolve , reject)=>{

    //   console.log("querying data")
    //   setTimeout(() => {
    //     resolve(employees_data.find(d=> d.id == args.id))
    //   }, 1000);
    // })
    // console.log("test:",args)
    const {data:employees} = await axios.get(`${endpoints[0]}/${args.id}`)

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
  async employees(args){
    // console.log("test:",args)
    const {data:employees} = await axios.get(`${endpoints[0]}?_limit=${args.limit}`)
    return employees
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

// Test on garphql
app.use('/hql', createHandler({
  schema: schema,
  rootValue: resolver
}))

app.get('/employees', (req,res)=>{
  console.log("::", req.query)
  if(req.query){
    return res.send(employees_data.find(item => item.id == req.query.id));
  }
  return res.send(employees_data.slice(0, parseInt(req.query._limit) || 10));
})

app.get('/employees/:id', (req,res)=>{
  // console.log("::x", req.params.id)
  if(req.query){
    return res.send(employees_data.find(item => item.id == parseInt(req.params.id)));
  }
})

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
