const express = require("express");
const fetch = require("node-fetch");
const app = express();

// EXAMPLE: get request handler
app.get("/api/route/:routeid", function(req, res) {
  // Get the correct data and stuff

  // Send a response back
  res.send({
    hi: "hi",
    route_id: req.params.routeid
  });
});

// Example fetch - delete this later
app.get("/api/pvta/:routeid", function(req, res) {
  fetch(
    "http://bustracker.pvta.com/InfoPoint/rest/routes/get/" + req.params.routeid
  )
    .then(response => {
      response
        .json()
        .then(json => {
          res.send(json);
        })
        .catch(() => {
          res.sendStatus(500);
        });
    })
    .catch(() => {
      res.sendStatus(400);
    });
});

app.listen(3000);
