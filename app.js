"use strict";

const container = require("./app/container");
const _application = require("./app/application");

module.exports = container.make(_application).listen();
