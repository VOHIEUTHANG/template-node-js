/**
 * Created by A on 7/18/17.
 */
"use strict";
// User Modules
const AppUsers = require("../API/AppUsers/route/AppUsersRoute");

var APIs = [
  // AppUsers APIs
  {
    method: "POST",
    path: "/AppUsers/registerUser",
    config: AppUsers.registerUser,
  },
  { method: "POST", path: "/AppUsers/loginUser", config: AppUsers.loginUser },
  { method: "POST", path: "/AppUsers/lockUser", config: AppUsers.lockUser },
];

module.exports = APIs;
