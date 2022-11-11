/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
"use strict";
const moduleName = "AppUsers";
const Manager = require(`../manager/${moduleName}Manager`);
const Joi = require("joi");
const Response = require("../../Common/route/response").setup(Manager);
const SystemStatus = require("../../Maintain/MaintainFunctions").systemStatus;
const { USER_SEX } = require("../AppUserConstant");

const insertSchema = {
  lastName: Joi.string().max(255),
  firstName: Joi.string().max(255),
  username: Joi.string().alphanum().min(6).max(30).required(),
  email: Joi.string().email().max(255),
  referUser: Joi.string().allow("").max(100),
  password: Joi.string().required().min(6),
  secondaryPassword: Joi.string().min(6),
  phoneNumber: Joi.string().min(9).max(15),
  birthDay: Joi.string().max(255),
  identityNumber: Joi.string().max(255),
  sex: Joi.number().min(USER_SEX.MALE).max(USER_SEX.FEMALE),
  companyName: Joi.string().max(255),
  userHomeAddress: Joi.string().max(255),
};

module.exports = {
  loginUser: {
    tags: ["api", `${moduleName}`],
    description: `login ${moduleName}`,
    validate: {
      payload: Joi.object({
        username: Joi.string().alphanum().min(6).max(30).required(),
        password: Joi.string().required(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res("maintain").code(500);
        return;
      }
      Response(req, res, "loginUser");
    },
  },
  registerUser: {
    tags: ["api", `${moduleName}`],
    description: `register ${moduleName}`,
    validate: {
      payload: Joi.object(insertSchema),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res("maintain").code(500);
        return;
      }
      Response(req, res, "registerUser");
    },
  },
  lockUser: {
    tags: ["api", `${moduleName}`],
    description: `lock ${moduleName}`,
    validate: {
      payload: Joi.object({
        appUserId: Joi.number().integer().min(0).required(),
      }),
    },
    handler: function (req, res) {
      if (SystemStatus.all === false) {
        res("maintain").code(500);
        return;
      }
      Response(req, res, "lockUser");
    },
  },
};
