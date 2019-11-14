const express = require("express");
const fetch = require("node-fetch");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_DIRECTIONS_API_KEY
});

const PORT = process.env.PORT || 3000;

// --- Express Routes ---

app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/api/route/", (req, res) => {});
app.get("/api/route/:route_id", (req, res) => {});

app.get("/api/bus/", (req, res) => {});
app.get("/api/bus/:bus_id", (req, res) => {});

app.get("/api/stop/", (req, res) => {});
app.get("/api/stop/:stop_id", (req, res) => {});

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
  console.log("api/directions/");
  console.log("From: " + req.query.from);
  console.log("To: " + req.query.to);

  googleMapsClient.directions(
    {
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
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
