"use strict";

const express = require("express");
const withMiddleware = require("./middleware");
const _env = require("./env");
const _routes = require("./routes");

function inject(provide) {
  return [_env, _routes, provide(console), provide(express())];
}

function init(env, routes, logger, app) {
  withMiddleware(app, wrappedApp => routes(wrappedApp));
  return {
    listen() {
      return app;
    }
  };
}

module.exports = { inject, init, singleton: true };
