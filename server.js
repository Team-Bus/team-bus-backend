const express = require("express");
const fetch = require("node-fetch");
const app = express();

const dotenv = require('dotenv');
dotenv.config();

const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_DIRECTIONS_API_KEY
});

const PORT = (process.env.PORT || 3000)

// --- Express Routes ---

app.get("/", (req, res) => {
  res.send("Hi");
});


/*
 *  Example Express GET request with parameters
 */
app.get("/api/route/:routeid", (req, res) => {
  // Get the correct data and stuff

  // Send a response back
  res.send({
    hi: "hi",
    route_id: req.params.routeid
  });
});


/*
 *  Example PVTA API request
 */
app.get("/api/pvta/:routeid", (req, res) => {
  console.log("/api/pvta/:routeid");
  console.log(req.params);

  fetch("http://bustracker.pvta.com/InfoPoint/rest/routes/get/" + req.params.routeid)
    .then(response => {
      return response.json()
    })
    .then(json => {
      res.send(json)
    })
    .catch((err) => {
      res.sendStatus(500);
      console.log(err);
    });

});


/*
 *  Query Variables  
 *    from - Current location in string | coordiantes long,lat
 *    to - Destination as string | coordiantes long,lat
 *
 *  Example Request: Lot 12 to Goessman Lab
 *    /api/directions/?from=42.3924322,-72.5362976&to=Goessmann%20Lab
 * 
 *  Google Maps Directions API
 *    https://developers.google.com/maps/documentation/directions/intro#DirectionsRequests
 */

app.get("/api/directions/", (req, res) => {

  console.log("api/directions/")
  console.log("From: " + req.query.from);
  console.log("To: " + req.query.to);

  googleMapsClient.directions({
      origin: req.query.from,
      destination: req.query.to,
      traffic_model: "best_guess",
      departure_time: "now",
      mode: "transit",
      transit_mode: "bus",
      units: "imperial",
      alternatives: true,
      region: "us"

    },
    (err, response) => {

      // TODO: Correctly handle errors / if route or location wasn't found
      // TODO: Filter out not PVTA routes
      if (err) {
        console.log(err);
      }

      if (response) {
        // Do not send response as it contains our API keys
        client_responce = response.json;
        res.send(client_responce);
      } else {
        res.sendStatus(400);
      }

    });

});

// Start server
app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});