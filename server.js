const express = require("express"); // REST API API
const app = express();

// Allows the use of system variable (in .env file)
const dotenv = require("dotenv");
dotenv.config();

// Enable CORS for all origins
const cors = require("cors");
app.use(cors());

const fetch = require("node-fetch");

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

app.get("/api/stop/transfer/", async (req, res) => {
  let client_responce = { routes: [] };

  let from = await pvta_cache.getStop(req.query.from);
  let to = await pvta_cache.getStop(req.query.to);

  if (to == undefined || from == undefined) {
    res.send(client_responce);
    return;
  }

  await googleMapsClient.directions(
    {
      origin: from.Latitude + "," + from.Longitude,
      destination: to.Latitude + "," + to.Longitude,
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
        res.sendStatus(500);
      }

      if (response) {
        // Do not send response as it contains our API keys
        json = response.json;

        json.routes.forEach(test_route => {
          route = {
            duration: test_route.legs[0].duration,
            arrival_time: test_route.legs[0].arrival_time,
            departure_time: test_route.legs[0].departure_time,
            distance: test_route.legs[0].distance,
            steps: []
          };

          discard_route = false;

          test_route.legs[0].steps.forEach(step => {
            if (step.travel_mode == "TRANSIT") {
              step.transit_details.line.agencies.forEach(agency => {
                if (agency.name != "PVTA") {
                  discard_route = true;
                } else {
                  client_step = {};

                  client_step.route_name = step.transit_details.line.name;
                  client_step.route_short_name =
                    step.transit_details.line.short_name;

                  client_step.departure_stop =
                    step.transit_details.departure_stop;
                  client_step.departure_time =
                    step.transit_details.departure_time;

                  client_step.arrival_stop = step.transit_details.arrival_stop;
                  client_step.arrival_time = step.transit_details.arrival_time;

                  route.steps.push(client_step);
                }
              });
            }
          });

          if (!discard_route) {
            client_responce.routes.push(route);
          }
        });

        res.send(client_responce);
      } else {
        res.sendStatus(400);
      }
    }
  );
});

app.get("/api/stop/nearest", async (req, res) => {
  let lat = req.query.lat;
  let long = req.query.long;

  let response = await fetch(
    "https://bustracker.pvta.com/InfoPoint/rest/Stops/NearestStop?latitude=" +
      lat +
      "&longitude=" +
      long
  );
  let json = await response.json();

  console.log(json);

  res.send(json);
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

app.get("/api/stop/departures/:stop_id", (req, res) => {
  console.log("request " + req.params.stop_id);
  pvta_cache
    .getStopDepartures(req.params.stop_id)
    .then(stop_details => {
      res.send(stop_details);
    })
    .catch(e => {
      console.log(e);
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
