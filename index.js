const express = require("express");
const app = express();


app.use(express.json());


const votes = new Map();


// multiple talks


app.post("/api/v1/talks", (request, response) => {


  let talkId = request.body.talkId;


  votes.set(talkId, new Array());


  response.sendStatus(201,"Talk created.");
});


app.delete("/api/v1/talks:talkId", (request, response) => {


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


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});


