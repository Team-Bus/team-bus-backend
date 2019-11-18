const express = require("express"); // REST API API
const app = express();

// Allows the use of system variable (in .env file)
const dotenv = require("dotenv");
dotenv.config();

// Enable CORS for all origins
const cors = require("cors");
app.use(cors());

// Setup Google maps API with the API key in the .env file
const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_DIRECTIONS_API_KEY
});

// Use the port suppied by the system (Heroku) else default to port 3000
const PORT = process.env.PORT || 3000;

const PVTACache = require("./pvta_cache.js");

let pvta_cache = new PVTACache();

// --- Express Routes ---

app.get("/", (req, res) => {
  res.send("Hi");
});

/*
 *  returns all availiable PVTA routes
 */
app.get("/api/route/", (req, res) => {
  // Get all route information from the PVTA cache
  pvta_cache.getRoutes().then(routes => {
    // Send the route information, if not exists, send null
    res.send({
      Routes: routes || null
    });
  });
});

/*
 *  returns a PVTA route with a route id = :route_id
 *  Example: /api/route/20035  returns information on route 20035
 */
app.get("/api/route/:route_id", (req, res) => {
  // Get the route information for route req.params.route_id from the PVTA cache
  pvta_cache.getRoute(req.params.route_id).then(route => {
    // Send the route information, if not exists, send null
    res.send({
      Route: route || null
    });
  });
});

app.get("/api/vehicle/", (req, res) => {
  pvta_cache.getVehicles().then(vehicles => {
    res.send({
      Vehicles: vehicles || null
    });
  });
});
app.get("/api/vehicle/:vehicle_id", (req, res) => {
  pvta_cache.getVehicle(req.params.vehicle_id).then(vehicle => {
    res.send({
      Vehicle: vehicle || null
    });
  });
});

app.get("/api/stop/", (req, res) => {
  pvta_cache.getStops().then(stops => {
    res.send({
      Stops: stops || null
    });
  });
});

app.get("/api/stop/:stop_id", (req, res) => {
  pvta_cache.getStop(req.params.stop_id).then(stop => {
    res.send({
      Stop: stop || null
    });
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
