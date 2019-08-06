"use strict";

const addRequestId = require("express-request-id")();
const requestLogging = require("./middleware/requestLogs");
const bodyParser = require("body-parser");
const corsProtection = require("./middleware/corsProtection");

function middleware(app, applyRoutes) {
  // MUST be added before request logging,
  // as request logging depends on the id
  app.use(addRequestId);
  app.use(bodyParser.json());
  requestLogging.applyToApp(app);
  corsProtection.applyToApp(app);

  applyRoutes(app);
}

module.exports = middleware;
