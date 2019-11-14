const fetch = require("node-fetch");

module.exports = class PVTACache {
  constructor(updateInterval = 180000) {
    this.updateInterval = updateInterval;
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

  async getBus(busId) {
    await this.updateCache();

    return this.vehicles[busId];
  }

  async getBuses(busId) {
    await this.updateCache();

    return this.vehicles;
  }

  async getStop(stopId) {
    await this.updateCache();

    return this.stops[stopId];
  }

  async getStops(stopId) {
    await this.updateCache();

    return this.stops;
  }

  // TODO: Handle errors for failed pvta fetch request
  async updateCache() {
    if (Date.now() - this.lastUpdate < this.updateInterval) return;

    let start = Date.now();
    console.log("Cache out of date, updating data starting at " + start);

    let response = await fetch(
      "http://bustracker.pvta.com/InfoPoint/rest/routedetails/getallroutedetails"
    );
    let json = await response.json();

    let c_start = Date.now();

    json.forEach(route => {
      this.routes[route.RouteId] = route;

      route.Stops.forEach(stop => {
        this.stops[stop.StopId] = stop;
      });

      route.Vehicles.forEach(vehicle => {
        this.vehicles[vehicle.VehicleId] = vehicle;
      });
    });

    let end = Date.now();
    console.log("Cache created, " + (end - c_start) + "ms");

    this.lastUpdate = Date.now();
  }
};
