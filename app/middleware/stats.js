"use strict";

class StatsMiddleware {
  static actionKeyMiddleware(controller, action) {
    let actionKey = "";
    if (controller == null || action == null) {
      actionKey = "__path__";
    } else {
      actionKey = `${controller}.${action}`;
    }
    return (request, response, next) => {
      if (actionKey == "__path__") {
        actionKey = request.path
          .split("/")
          .join("-")
          .replace(/^-/, "");
      }
      request.actionKey = actionKey;
      next();
    };
  }
}

module.exports = StatsMiddleware;
