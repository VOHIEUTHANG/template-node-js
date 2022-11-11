/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
"use strict";

const crypto = require("crypto");
const otplib = require("otplib");
const moment = require("moment");

const AppUsersResourceAccess = require("./resourceAccess/AppUsersResourceAccess");
const utilitiesFunction = require("../ApiUtils/utilFunctions");

const QRCodeFunction = require("../../ThirdParty/QRCode/QRCodeFunctions");
const TokenFunction = require("../ApiUtils/token");
const Logger = require("../../utils/logging");
const EmailClient = require("../../ThirdParty/Email/EmailClient");

/** Gọi ra để sử dụng đối tượng "authenticator" của thằng otplib */
const { authenticator } = otplib;
const { USER_TYPE, USER_ERROR } = require("./AppUserConstant");
/** Tạo secret key ứng với từng user để phục vụ việc tạo otp token.
  * Lưu ý: Secret phải được gen bằng lib otplib thì những app như
    Google Authenticator hoặc tương tự mới xử lý chính xác được.
  * Các bạn có thể thử để linh linh cái secret này thì đến bước quét mã QR sẽ thấy có lỗi ngay.
*/
const generateUniqueSecret = () => {
  return authenticator.generateSecret();
};

/** Tạo mã OTP token */
const generateOTPToken = (username, serviceName, secret) => {
  return authenticator.keyuri(username, serviceName, secret);
};

// async function getUnreadNotificationCount(foundUser) {
//   const CustomerMessageResourceAccess = require("../CustomerMessage/resourceAccess/CustomerMessageResourceAccess");
//   //lay so luong thong bao chua doc cua user
//   let unreadNotifications = await CustomerMessageResourceAccess.count({
//     customerId: foundUser.appUserId,
//     isRead: 0,
//   });
//   foundUser.unreadNotifications = unreadNotifications[0].count;
// }

function hashPassword(password) {
  const hashedPassword = crypto
    .createHmac("sha256", "ThisIsSecretKey")
    .update(password)
    .digest("hex");
  return hashedPassword;
}

function unhashPassword(hash) {
  const pass = cryptr.decrypt(hash);
  return pass;
}

function verifyUniqueUser(req, res) {
  // Find an entry from the database that
  // matches either the email or username
}

async function verifyUserCredentials(username, password) {
  let hashedPassword = hashPassword(password);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await AppUsersResourceAccess.find({
    username: username,
    password: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId);

    return foundUser;
  } else {
    return undefined;
  }
}

async function verifyUserSecondaryPassword(username, secondaryPassword) {
  let hashedPassword = hashPassword(secondaryPassword);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await AppUsersResourceAccess.find({
    username: username,
    secondaryPassword: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId);

    return foundUser;
  } else {
    return undefined;
  }
}

async function retrieveUserDetail(appUserId) {
  //get user detial
  const AppUserView = require("./resourceAccess/AppUserView");
  let user = await AppUserView.find({ appUserId: appUserId }, 0, 1);
  if (user && user.length > 0) {
    let foundUser = user[0];
    delete foundUser.password;
    //create new login token
    let token = TokenFunction.createToken(foundUser);

    //neu user da verify thi moi tra ve token
    if (process.env.DISABLE_LOCK_NOT_VERIFIED_USER) {
      if (foundUser && foundUser.isVerified) {
        foundUser.token = token;
      }
    } else {
      foundUser.token = token;
    }

    // //retrive user wallet info
    // let wallets = await WalletBalanceUnitView.find({ appUserId: appUserId });
    // if (wallets && wallets.length > 0) {
    //   foundUser.wallets = wallets;
    // }

    //neu la user dai ly thi se co QRCode gioi thieu
    let referLink =
      process.env.WEB_HOST_NAME + `/register?refer=${foundUser.referCode}`;
    const QRCodeImage = await QRCodeFunction.createQRCode(referLink);
    if (QRCodeImage) {
      foundUser.referLink = referLink;
      foundUser.referQRCode = `https://${process.env.HOST_NAME}/${QRCodeImage}`;
    }

    //lay so luong thong bao chua doc cua user
    // await getUnreadNotificationCount(foundUser);

    return foundUser;
  }

  return undefined;
}

async function changeUserPassword(userData, newPassword) {
  let newHashPassword = hashPassword(newPassword);

  let result = await AppUsersResourceAccess.updateById(userData.appUserId, {
    password: newHashPassword,
  });

  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function changeUserSecondaryPassword(userData, newPassword, oldPassword) {
  let newHashPassword = hashPassword(newPassword);
  if (oldPassword && oldPassword !== null && oldPassword !== "") {
    let oldPasswordHash = hashPassword(oldPassword);
    if (oldPasswordHash !== userData.secondaryPassword) {
      return undefined;
    }
  }

  let result = await AppUsersResourceAccess.updateById(userData.appUserId, {
    secondaryPassword: newHashPassword,
  });

  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function generate2FACode(appUserId) {
  // đây là tên ứng dụng của các bạn, nó sẽ được hiển thị trên app Google Authenticator hoặc Authy sau khi bạn quét mã QR
  const serviceName = process.env.HOST_NAME || "trainingdemo.makefamousapp.com";

  let user = await AppUsersResourceAccess.find({ appUserId: appUserId });

  if (user && user.length > 0) {
    user = user[0];

    // Thực hiện tạo mã OTP
    let topSecret = "";
    if (user.twoFACode || (user.twoFACode !== "" && user.twoFACode !== null)) {
      topSecret = user.twoFACode;
    } else {
      topSecret = generateUniqueSecret();
    }

    const otpAuth = generateOTPToken(user.username, serviceName, topSecret);
    const QRCodeImage = await QRCodeFunction.createQRCode(otpAuth);

    if (QRCodeImage) {
      await AppUsersResourceAccess.updateById(appUserId, {
        twoFACode: topSecret,
        twoFAQR:
          process.env.HOST_NAME + `/User/get2FACode?appUserId=${appUserId}`,
      });
      return QRCodeImage;
    }
  }
  return undefined;
}

/** Kiểm tra mã OTP token có hợp lệ hay không
 * Có 2 method "verify" hoặc "check", các bạn có thể thử dùng một trong 2 tùy thích.
 */
const verify2FACode = (token, topSecret) => {
  return authenticator.check(token, topSecret);
};

async function createNewUser(userData) {
  return new Promise(async (resolve, reject) => {
    //check existed username
    let _existedUsers = await AppUsersResourceAccess.find({
      username: userData.username,
    });
    if (_existedUsers && _existedUsers.length > 0) {
      if (_existedUsers[0].active === 0) {
        let userDetail = retrieveUserDetail(_existedUsers.appUserId);
        resolve(userDetail);
      } else {
        console.error(`error create new user`);
        reject(USER_ERROR.DUPLICATED_USER);
        return;
      }
    }

    //check existed email
    if (userData.email) {
      _existedUsers = await AppUsersResourceAccess.find({
        email: userData.email,
      });
      if (_existedUsers && _existedUsers.length > 0) {
        console.error(`error duplicated user email`);
        reject(USER_ERROR.DUPLICATED_USER_EMAIL);
        return;
      }
    }

    //check existed phoneNumber
    if (userData.phoneNumber) {
      _existedUsers = await AppUsersResourceAccess.find({
        phoneNumber: userData.phoneNumber,
      });
      if (_existedUsers && _existedUsers.length > 0) {
        console.error(`error duplicated user phone`);
        reject(USER_ERROR.DUPLICATED_USER_PHONE);
        return;
      }
    }
    //check existed referUserId
    if (userData.referUserId) {
      const _existedReferUserId = await AppUsersResourceAccess.find({
        appUserId: userData.referUserId,
      });
      if (_existedReferUserId.length === 0) {
        console.error(`error refer user not found`);
        reject(USER_ERROR.REFER_USER_NOT_FOUND);
        return;
      }

      userData.referUser = _existedReferUserId[0].username;
    }

    //hash password
    userData.password = hashPassword(userData.password);
    if (
      userData.userAvatar === null ||
      userData.userAvatar === undefined ||
      userData.userAvatar === ""
    ) {
      userData.userAvatar = `https://${process.env.HOST_NAME}/uploads/avatar.png`;
    }

    //if system support for secondary password, (2 step authentication)
    if (userData.secondaryPassword) {
      userData.secondaryPassword = hashPassword(userData.secondaryPassword);
    }

    //check refer user by refer's username
    if (userData.referUser && userData.referUser.trim() !== "") {
      let referUser = await AppUsersResourceAccess.find(
        { username: userData.referUser },
        0,
        1
      );
      if (referUser && referUser.length > 0) {
        userData.referUserId = referUser[0].appUserId;
        let dataUserF = await _CheckUserF(userData.referUserId);
        if (dataUserF && dataUserF.length > 0) {
          if (dataUserF[0] !== undefined) {
            userData.memberReferIdF1 = dataUserF[0];
          }
          if (dataUserF[1] !== undefined) {
            userData.memberReferIdF2 = dataUserF[1];
          }
          if (dataUserF[2] !== undefined) {
            userData.memberReferIdF3 = dataUserF[2];
          }
          if (dataUserF[3] !== undefined) {
            userData.memberReferIdF4 = dataUserF[3];
          }
          if (dataUserF[4] !== undefined) {
            userData.memberReferIdF5 = dataUserF[4];
          }
        }
      } else {
        Logger.info(`invalid refer user ${userData.referUser}`);
        reject(USER_ERROR.INVALID_REFER_USER);
        return; //make sure everything stop
      }
    }

    //check refer user by refer's username
    if (userData.referCode && userData.referCode.trim() !== "") {
      let referUser = await AppUsersResourceAccess.find(
        { referCode: userData.referCode },
        0,
        1
      );
      if (referUser && referUser.length > 0) {
        userData.referUserId = referUser[0].appUserId;
        userData.referUser = referUser[0].username;
        let dataUserF = await _CheckUserF(userData.referUserId);
        if (dataUserF && dataUserF.length > 0) {
          if (dataUserF[0] !== undefined) {
            userData.memberReferIdF1 = dataUserF[0];
          }
          if (dataUserF[1] !== undefined) {
            userData.memberReferIdF2 = dataUserF[1];
          }
          if (dataUserF[2] !== undefined) {
            userData.memberReferIdF3 = dataUserF[2];
          }
          if (dataUserF[3] !== undefined) {
            userData.memberReferIdF4 = dataUserF[3];
          }
          if (dataUserF[4] !== undefined) {
            userData.memberReferIdF5 = dataUserF[4];
          }
        }
      } else {
        Logger.info(`invalid refer user ${userData.referUser}`);
        reject(USER_ERROR.INVALID_REFER_USER);
        return; //make sure everything stop
      }
    }
    //create new user
    let addResult = await AppUsersResourceAccess.insert(userData);
    if (addResult === undefined) {
      Logger.info("can not insert user " + JSON.stringify(userData));
      reject(USER_ERROR.DUPLICATED_USER);
    } else {
      let newUserId = addResult[0];
      await generate2FACode(newUserId);

      let referCode = encodeReferCode(newUserId);
      // let appUserId = decodeReferCode(referCode);
      await AppUsersResourceAccess.updateById(newUserId, {
        referCode: referCode,
      });
      let userDetail = retrieveUserDetail(newUserId);
      resolve(userDetail);
    }
    return;
  });
}
async function sendEmailToResetPassword(user, userToken, email) {
  let link = `${process.env.LINK_WEB_SITE}/resetPassword?token=${userToken}`;
  let userType = "";
  if (user.userType === USER_TYPE.PERSONAL) {
    userType = "Cá nhân";
  } else {
    userType = "Môi giới";
  }
  let emailResult = await EmailClient.sendEmail(
    email,
    `${process.env.SMTP_EMAIL} - Thông Báo Thay Đổi Mật Khẩu`,
    "ĐẶT LẠI MẬT KHẨU CỦA BẠN",
    `<div style="width: 100%; font-family: Arial, Helvetica, sans-serif;">
      <div style="display: flex; width: 100%; align-items: center; justify-content: center; justify-items: center;">
          <div style="width: 70%;">
              <p>Chào bạn <strong>${user.firstName}</strong></p>
              <div>Bạn đang yêu cầu thay đổi mật khẩu tài khoản <a style="color: blue;" href="">${email}</a></div>
              <div>Loại tài khoản là <strong>${userType}</strong></div>
              <p>Để cấp lại mật khẩu, Vui lòng click vào đường dẫn dưới đây: <strong><a href="${link}" style="color: blue;">Link xác nhận khôi phục mật khẩu</a></strong></p>
              <br />
              <p>Mọi thắc mắc vui lòng liên hệ hòm email: <a href="">${process.env.SMTP_EMAIL}</a> để được hỗ trợ và giải đáp</p>
              <p>Chúc bạn có những trải nghiệm thú vị cùng <a href="${process.env.LINK_WEB_SITE}" style="text-decoration: none; cursor: pointer; color: cadetblue;">fihome.com.vn</a></p>
              <div>Trân trọng,</div>
              <div>Ban quản trị</div>
          </div>
      </div>
    </div>`,
    undefined
  );
  return emailResult;
}

async function sendEmailToVerifyEmail(user, userToken, email) {
  let link = `${process.env.LINK_WEB_SITE}/verifyEmail?token=${userToken}`;
  let userType = "";
  if (user.userType === USER_TYPE.PERSONAL) {
    userType = "Cá nhân";
  } else {
    userType = "Môi giới";
  }
  let emailResult = await EmailClient.sendEmail(
    email,
    `${process.env.SMTP_EMAIL} - Xác Thực Email Của Bạn`,
    "XÁC THỰC EMAIL CỦA BẠN",
    `<div style="width: 100%; font-family: Arial, Helvetica, sans-serif;">
      <div style="display: flex; width: 100%; align-items: center; justify-content: center; justify-items: center;">
          <div style="width: 70%;">
              <p>Chào bạn <strong>${user.firstName}</strong></p>
              <div>Bạn đang yêu cầu xác thực email <a style="color: blue;" href="">${email}</a></div>
              <div>Loại tài khoản là <strong>${userType}</strong></div>
              <p>Để xác thực email, Vui lòng click vào đường dẫn dưới đây: <strong><a href="${link}" style="color: blue;">Link xác thực email</a></strong></p>
              <br />
              <p>Mọi thắc mắc vui lòng liên hệ hòm email: <a href="">${process.env.SMTP_EMAIL}</a> để được hỗ trợ và giải đáp</p>
              <p>Chúc bạn có những trải nghiệm thú vị cùng <a href="${process.env.LINK_WEB_SITE}" style="text-decoration: none; cursor: pointer; color: cadetblue;">fihome.com.vn</a></p>
              <div>Trân trọng,</div>
              <div>Ban quản trị</div>
          </div>
      </div>
    </div>`
  );

  return emailResult;
}
async function _CheckUserF(referUserId) {
  let resultArr = [];
  let result = await _checkIdUser(referUserId, resultArr);
  return result;
}
async function _checkIdUser(referUserId, resultArr) {
  if (referUserId !== null && referUserId) {
    let result = await AppUsersResourceAccess.findById(referUserId);
    if (result) {
      resultArr.push(result.appUserId);
      await _checkIdUser(result.referUserId, resultArr);
    }
  }
  return resultArr;
}

async function _calculateTodayUserTransaction(user) {
  let today = moment().startOf("day").format();

  return await _calculateUserTransaction(user, today);
}

async function _calculateUserTransaction(user, startDate, endDate) {
  let outputResult = {
    totalDeposit: 0,
    totalWithdraw: 0,
    totalReWard: 0,
    totalPlaceOrder: 0,
    totalWin: 0,
    totalLose: 0,
    totalBet: 0,
  };
  const DepositResource = require("../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess");
  const {
    IS_USER_DEPOSIT,
  } = require("../PaymentDepositTransaction/PaymentDepositTransactionConstant");
  let totalDeposit = await DepositResource.customSum(
    "paymentAmount",
    {
      appUserId: user.appUserId,
      isUserDeposit: IS_USER_DEPOSIT.COMPLETED,
    },
    undefined,
    undefined,
    startDate,
    endDate
  );
  if (
    totalDeposit &&
    totalDeposit.length > 0 &&
    totalDeposit[0].sumResult !== null
  ) {
    outputResult.totalDeposit = totalDeposit[0].sumResult;
  }

  const WithdrawResource = require("../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess");
  const {
    WITHDRAW_TRX_STATUS,
  } = require("../PaymentWithdrawTransaction/PaymentWithdrawTransactionConstant");
  let totalWithdraw = await WithdrawResource.customSum(
    "paymentAmount",
    {
      appUserId: user.appUserId,
      PaymentStatus: WITHDRAW_TRX_STATUS.COMPLETED,
    },
    undefined,
    undefined,
    startDate,
    endDate
  );

  if (
    totalWithdraw &&
    totalWithdraw.length > 0 &&
    totalWithdraw[0].sumResult !== null
  ) {
    outputResult.totalWithdraw = totalWithdraw[0].sumResult;
  }

  const StatisticalFunctions = require("../Statistical/StatisticalFunctions");
  outputResult.totalReWard =
    await StatisticalFunctions.totalRewardBalanceByUserId(user.appUserId);
  outputResult.totalPlaceOrder =
    await StatisticalFunctions.sumTotalUserPlaceOrder({
      appUserId: user.appUserId,
      orderStatus: "Completed",
    });

  const BetRecordResourceAccess = require("../BetRecords/resourceAccess/BetRecordsResourceAccess");
  let totalWin = await BetRecordResourceAccess.sumaryWinLoseAmount(
    startDate,
    endDate,
    {
      appUserId: user.appUserId,
    }
  );
  if (totalWin && totalWin.length > 0 && totalWin[0].sumResult !== null) {
    outputResult.totalWin = totalWin[0].sumResult;
  }

  let totalBet = await BetRecordResourceAccess.sumaryPointAmount(
    startDate,
    endDate,
    {
      appUserId: user.appUserId,
    }
  );
  if (totalBet && totalBet.length > 0 && totalBet[0].sumResult !== null) {
    outputResult.totalBet = totalBet[0].sumResult;
  }

  outputResult.totalLose = outputResult.totalBet - outputResult.totalWin;

  return outputResult;
}

async function retrieveUserTransaction(user) {
  user.totalDeposit = 0;
  user.totalWithdraw = 0;
  user.totalWin = 0;
  user.totalLose = 0;
  user.totalBet = 0;
  user.totalTodayDeposit = 0;
  user.totalTodayWithdraw = 0;
  user.totalTodayBet = 0;
  user.totalTodayWin = 0;
  user.totalTodayLose = 0;

  let totalTransaction = await _calculateUserTransaction(user);
  user.totalDeposit = totalTransaction.totalDeposit;
  user.totalWithdraw = totalTransaction.totalWithdraw;
  user.totalReWard = totalTransaction.totalReWard;
  user.totalPlaceOrder = totalTransaction.totalPlaceOrder;
  user.totalWin = totalTransaction.totalWin;
  user.totalLose = totalTransaction.totalLose;
  user.totalBet = totalTransaction.totalBet;

  let todayTotalTransaction = await _calculateTodayUserTransaction(user);
  user.totalTodayDeposit = todayTotalTransaction.totalDeposit;
  user.totalTodayWithdraw = todayTotalTransaction.totalWithdraw;
  user.totalTodayWin = todayTotalTransaction.totalWin;
  user.totalTodayLose = todayTotalTransaction.totalLose;
  user.totalTodayBet = todayTotalTransaction.totalBet;

  return user;
}

function encodeReferCode(appUserId) {
  console.log(appUserId);
  const encodingTable = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];
  let x1 = Math.floor(appUserId / (36 * 36 * 36));
  let x2 = Math.floor(appUserId / (36 * 36));
  let x3 = Math.floor(appUserId / 36);
  let x4 = Math.floor(appUserId % 36);

  x1 = encodingTable[x1];
  x2 = encodingTable[x2];
  x3 = encodingTable[x3];
  x4 = encodingTable[x4];
  let hashReferCode = `${x1}${x2}${x3}${x4}`;
  return utilitiesFunction.padLeadingZeros(hashReferCode, 4);
}

function decodeReferCode(referCode) {
  const decodingTable = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  let y1 = decodingTable.indexOf(referCode.charAt(0));
  let y2 = decodingTable.indexOf(referCode.charAt(1));
  let y3 = decodingTable.indexOf(referCode.charAt(2));
  let y4 = decodingTable.indexOf(referCode.charAt(3));
  let appUserId = y1 * 36 * 36 * 36 + y2 * 36 * 36 + y3 * 36 + y4;
  return appUserId;
}

async function verifyUserCredentials(username, password) {
  let hashedPassword = hashPassword(password);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await AppUsersResourceAccess.find({
    username: username,
    password: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    let foundUser = verifyResult[0];

    foundUser = await retrieveUserDetail(foundUser.appUserId);

    return foundUser;
  } else {
    return undefined;
  }
}

async function lockUser(appUserId) {
  return new Promise(async (resolve, reject) => {
    const _foundUser = await AppUsersResourceAccess.find({
      appUserId,
    });

    if (_foundUser && _foundUser.length > 0) {
      let foundUser = _foundUser[0];
      if (foundUser.active === 0) {
        console.error(`User locked !`);
        reject(USER_ERROR.USER_LOCKED);
      } else if (foundUser.active === 1) {
        try {
          foundUser = await AppUsersResourceAccess.updateById(appUserId, {
            active: 0,
          });
          resolve(foundUser);
        } catch (e) {
          console.log("🚀 ~ file: AppUsersFunctions.js ~ line 727 ~ e", e);
        }
      }
    } else {
      console.error(`User not found !`);
      reject(USER_ERROR.USER_NOT_FOUND);
    }
    return;
  });
}

module.exports = {
  verifyUniqueUser,
  verifyUserCredentials,
  hashPassword,
  unhashPassword,
  retrieveUserDetail,
  changeUserPassword,
  changeUserSecondaryPassword,
  generate2FACode,
  verify2FACode,
  createNewUser,
  sendEmailToResetPassword,
  sendEmailToVerifyEmail,
  verifyUserSecondaryPassword,
  retrieveUserTransaction,
  encodeReferCode,
  decodeReferCode,
  lockUser,
};
