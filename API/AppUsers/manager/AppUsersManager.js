/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
"use strict";
const moment = require("moment");

const AppUsersResourceAccess = require("../resourceAccess/AppUsersResourceAccess");
const AppUsersFunctions = require("../AppUsersFunctions");
const Logger = require("../../../utils/logging");
const { ERROR } = require("../../Common/CommonConstant");

const {
  USER_VERIFY_INFO_STATUS,
  USER_VERIFY_EMAIL_STATUS,
  USER_VERIFY_PHONE_NUMBER_STATUS,
  USER_ERROR,
} = require("../AppUserConstant");

async function loginUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let username = req.payload.username;
      let password = req.payload.password;

      let foundUser = await _login(username, password);

      if (foundUser) {
        // _storeUserIp(req, foundUser.appUserId);
        console.log(foundUser);
        return resolve(foundUser);
      } else {
        console.error(`error login user: ${ERROR}`);
        reject("failed");
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (e === USER_ERROR.INVALID_REFER_USER) {
        console.error(`error login user: ${USER_ERROR.INVALID_REFER_USER}`);
        reject(USER_ERROR.INVALID_REFER_USER);
      } else if (e === USER_ERROR.USER_LOCKED) {
        console.error(`error login user: ${USER_ERROR.USER_LOCKED}`);
        reject(USER_ERROR.USER_LOCKED);
      } else {
        console.error(`error login user: ${ERROR}`);
        reject("failed");
      }
    }
  });
}

async function _login(username, password) {
  //verify credential
  let foundUser = await AppUsersFunctions.verifyUserCredentials(
    username,
    password
  );

  if (foundUser) {
    if (foundUser.active === 0) {
      throw USER_ERROR.USER_LOCKED;
    }
    // if (
    //   foundUser.isVerifiedPhoneNumber !==
    //   USER_VERIFY_PHONE_NUMBER_STATUS.IS_VERIFIED
    // ) {
    //   throw USER_ERROR.NOT_VERIFIED_PHONE;
    // }

    //lay so luong thong bao chua doc cua user
    // await AppUsersFunctions.getUnreadNotificationCount(foundUser);

    await AppUsersResourceAccess.updateById(foundUser.appUserId, {
      lastActiveAt: new Date(),
    });

    if (foundUser.twoFAEnable && foundUser.twoFAEnable > 0) {
      return {
        appUserId: foundUser.appUserId,
        twoFAEnable: foundUser.twoFAEnable,
      };
    } else {
      return foundUser;
    }
  }
}

async function registerUser(req) {
  return insert(req);
}

async function _registerUser(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      let newUser = await AppUsersFunctions.createNewUser(userData);

      if (newUser) {
        //tao vi cho user
        const WalletFunction = require("../../Wallet/WalletFunctions");
        await WalletFunction.createWalletForUser(newUser.appUserId);

        resolve(newUser);
      } else {
        console.error(`error AppUserManage can not registerUser: ${ERROR}`);
        reject("failed");
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      if (e === USER_ERROR.INVALID_REFER_USER) {
        console.error(
          `error AppUserManage can not registerUser: ${USER_ERROR.INVALID_REFER_USER}`
        );
        reject(USER_ERROR.INVALID_REFER_USER);
      } else if (e === USER_ERROR.DUPLICATED_USER) {
        console.error(
          `error AppUserManage can not registerUser: ${USER_ERROR.DUPLICATED_USER}`
        );
        reject(USER_ERROR.DUPLICATED_USER);
      } else if (e === USER_ERROR.DUPLICATED_USER_EMAIL) {
        console.error(
          `error AppUserManage can not registerUser: ${USER_ERROR.DUPLICATED_USER_EMAIL}`
        );
        reject(USER_ERROR.DUPLICATED_USER_EMAIL);
      } else if (e === USER_ERROR.DUPLICATED_USER_PHONE) {
        console.error(
          `error AppUserManage can not registerUser: ${USER_ERROR.DUPLICATED_USER_PHONE}`
        );
        reject(USER_ERROR.DUPLICATED_USER_PHONE);
      } else if (e === USER_ERROR.REFER_USER_NOT_FOUND) {
        console.error(
          `error AppUserManage can not registerUser: ${USER_ERROR.REFER_USER_NOT_FOUND}`
        );
        reject(USER_ERROR.REFER_USER_NOT_FOUND);
      } else {
        console.error(`error AppUserManage can not registerUser: ${ERROR}`);
        reject("failed");
      }
    }
  });
}
async function insert(req) {
  let userData = req.payload;
  return await _registerUser(userData);
}

module.exports = {
  insert,
  registerUser,
  loginUser,
};
