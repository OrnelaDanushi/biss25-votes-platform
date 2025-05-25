
/*
console.log("Hello, World!");
*/

/*
// Uncomment the code to run a simple Express server that responds 
// with "Hello, World!" on the root path.

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
*/
 

const express = require("express");
const axios = require('axios');
const http = require('http');
require('dotenv').config();

// Set the port to listen on, defaulting to 3000 if not specified
const port = process.env.PORT || 3000;

const app = express();
// Middleware to parse JSON request bodies
app.use(express.json());
app.use("/",express.static("./public"));


// data structure to store the list of votes
const votes = new Map();

// NOTE: I exhausted the free credits for OpenAI API, so I cannot test the code that uses it.
// multiple talks
// POST: https://localhost:3000/api/v1/talks
// POST: https://biss25-votes-platform.onrender.com/api/v1/talks
// POST: {{baseURL}}/api/v1/talks
app.post("/api/v1", async (req, res) => {
  // Check if the request body contains a topic/description
  if (!req.body.talkId) {
    return res.status(400).json({ error: "Bad Request: talkId is required." });
  }

  const prompt = `Generate a short, unique, URL-safe identifier (no spaces, no punctuation except dash or underscore) for a talk about "${req.body.talkId}". Only return the identifier.`;
  try {
    const aiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0,
        max_tokens: 20,
      },
      { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    // Extract and sanitize the talkId
    let talkId = aiResponse.data.choices[0].message.content.trim();
    // Remove any unwanted characters (keep only alphanumerics, dash, underscore)
    talkId = talkId.replace(/[^a-zA-Z0-9\-_]/g, '');

    if (!talkId) {
      return res.status(500).json({ error: "Failed to generate a valid talkId." });
    }

    if (votes.has(talkId)) {
      return res.status(409).json({ error: "Conflict: talkId already exists." });
    }

    votes.set(talkId, []);
    res.status(201).json({ talkId, message: "Talk created." });

  } catch (error) {
    console.error('Generation error:', {
      request: { talkId: req.body.talkId },
      error: error.response?.data || error.message
    });

    res.status(500).json({
      error: "Generation failed",
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// NOTE: Alternative implementation using nanoid for generating unique identifiers
// POST: https://localhost:3000/api/v1_
// POST: https://biss25-votes-platform.onrender.com/api/v1_
const { nanoid } = require('nanoid');
app.post("/api/v1_", async (req, res) => {
  if (!req.body.talkId) {
    return res.status(400).json({ error: "Bad Request: talkId is required." });
  }

  // Generate a short, unique, URL-safe identifier
  let talkId = nanoid(10); // 10 chars, you can change the length

  if (votes.has(talkId)) {
    return res.status(409).json({ error: "Conflict: talkId already exists." });
  }

  votes.set(talkId, []);
  res.status(201).json({ talkId, message: "Talk created." });
});


app.post("/api/v1/talks", async (request, response) => {  
    let talkId = request.body.talkId;
    if (votes.has(talkId)){
      response.sendStatus(409,"Conflict"); 
    }else{
      votes.set(talkId, new Array());
      response.sendStatus(201,"Talk created.");
    }

});


// delete a talk
app.delete("/api/v1/talks/:talkId", (request, response) => {
  let talkId = request.params.talkId;

  if (votes.has(talkId)){
    votes.delete(talkId);
    response.sendStatus(200,"Talk deleted.");
  }else{
    response.sendStatus(404,"Talk not found.");
  }
});

// create votes for a talk
app.post("/api/v1/talks/:talkId/votes", (request, response) => {
  let talkId = request.params.talkId;
  let vote = request.body.value;

  if (votes.has(talkId)){
    let talkVotes = votes.get(talkId);
    talkVotes.push(vote);
    response.sendStatus(201,"Vote created.");
  }else{
    response.sendStatus(404,"Talk not found.");
  }
});

// obtain the results of votes for a talk
// get /api/v1/talks/:talkId/votes/result
app.get("/api/v1/talks/:talkId/votes/results", (request, response) => {
  let talkId = request.params.talkId;
  if (!votes.has(talkId)){
        response.sendStatus(404,"Not found");
  }else{
      let results = {
          count: 0,
          average: 0
      };
      let talkVotes = votes.get(talkId);
      results.count = talkVotes.length;
      if (talkVotes.length > 0){
          let sum = talkVotes.reduce((r, n) => { return r + n; });
          let average = sum / talkVotes.length;
          results.average = average;
      }
      response.send(results);
  }
});


// NEW
// obtain the list of all talks
app.get("/api/v1/talks", (req, res) => {
  res.json(Array.from(votes.keys()));
});


// delete all the votes of a talk
app.delete("/api/v1/talks/:talkId/votes", (req, res) => {
  const talkId = req.params.talkId;
  if (!votes.has(talkId)) {
    res.sendStatus(404);
  } else {
    votes.set(talkId, []);
    res.sendStatus(200);
  }
});


app.listen(port, () => {
  console.log("Server is running on port "+port);
});


