const fetch = require("node-fetch");

module.exports = class PVTACache {
  constructor(updateInterval = 180000) {
    this.updateInterval = updateInterval; // minimum time in ms between requests to the PVTA 
    this.lastUpdate = 0;

    this.routes = {};
    this.stops = {};
    this.vehicles = {};
  }

  async getRoute(routeId) {
    await this.updateCache();

    return this.routes[routeId];
  }

  async getRoutes() {
    await this.updateCache();

    return this.routes;
  }

  async getVehicle(vehicleId) {
    await this.updateCache();

    return this.vehicles[vehicleId];
  }

  async getVehicles() {
    await this.updateCache();

    return this.vehicles;
  }

  async getStop(stopId) {
    await this.updateCache();

    return this.stops[stopId];
  }

  async getStops() {
    await this.updateCache();

    return this.stops;
  }

  // TODO: Handle errors for failed pvta fetch request
  async updateCache() {

    // If it has been less then updateInterval ms since the last update, do not request new data
    if (Date.now() - this.lastUpdate < this.updateInterval) return;

    let start = Date.now();
    console.log("Cache out of date, updating data starting at " + start);

    // Access pvta api for all route/bus/stop information
    let response = await fetch(
      "http://bustracker.pvta.com/InfoPoint/rest/routedetails/getallroutedetails"
    );

    // Convert to JSON
    let json = await response.json();

    let c_start = Date.now();

    // Go through each route we recevied from the PVTA and add the routes/stops/buses to
    // individual associative arrays (dictionary)
    json.forEach(route => {
      this.routes[route.RouteId] = route;

      route.Stops.forEach(stop => {
        this.stops[stop.StopId] = stop;
      });

      route.Vehicles.forEach(vehicle => {

        vehicle.Color = route.Color;
        vehicle.RouteShortName = route.ShortName;
        vehicle.IvrDescription = route.IvrDescription;

        this.vehicles[vehicle.VehicleId] = vehicle;
      });
    });

    let end = Date.now();
    console.log("Cache created, " + (end - c_start) + "ms");

    // Set the lastUpdate time to the current time
    this.lastUpdate = Date.now();
  }
};