
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
const app = express();

// Set the port to listen on, defaulting to 3000 if not specified
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use("/",express.static("./public"));


// data structure to store the list of votes
const votes = new Map();

// multiple talks
// POST: https://localhost:3000/api/v1/talks
// POST: https://biss25-votes-platform.onrender.com/api/v1/talks
// POST: {{baseURL}}/api/v1/talks
app.post("/api/v1/talks", (request, response) => {
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


