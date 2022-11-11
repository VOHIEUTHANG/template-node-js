/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const AppUsers = require("./AppUsersRoute");

module.exports = [
  // AppUsers APIs
  // { method: 'POST', path: '/AppUsers/registerUser', config: AppUsers.registerUser },
  // InfoUsers APIs
  {
    method: "POST",
    path: "/AppUsers/registerUserByPhone",
    config: AppUsers.registerUserByPhone,
  },
  {
    method: "POST",
    path: "/AppUsers/sendPhoneOTP",
    config: AppUsers.sendPhoneOTP,
  },
  {
    method: "POST",
    path: "/AppUsers/confirmPhoneOTP",
    config: AppUsers.confirmPhoneOTP,
  },
  {
    method: "POST",
    path: "/AppUsers/loginByPhone",
    config: AppUsers.loginByPhone,
  },
  {
    method: "POST",
    path: "/AppUsers/loginByToken",
    config: AppUsers.loginByToken,
  },
  {
    method: "POST",
    path: "/AppUsers/getDetailUserById",
    config: AppUsers.userGetDetailById,
  },
  {
    method: "POST",
    path: "/AppUsers/uploadAvatar",
    config: AppUsers.uploadAvatar,
  },
  {
    method: "POST",
    path: "/AppUsers/updateInfoUser",
    config: AppUsers.userUpdateInfo,
  },
  // { method: 'POST', path: '/AppUsers/registerUserByEmail', config: AppUsers.registerUserByEmail },
  // { method: 'POST', path: '/AppUsers/loginUser', config: AppUsers.loginUser },
  // { method: 'POST', path: '/AppUsers/loginByEmail', config: AppUsers.loginByEmail },
  // { method: 'POST', path: '/AppUsers/loginApple', config: AppUsers.loginApple },
  // { method: 'POST', path: '/AppUsers/loginFacebook', config: AppUsers.loginFacebook },
  // { method: 'POST', path: '/AppUsers/loginGoogle', config: AppUsers.loginGoogle },
  // { method: 'POST', path: '/AppUsers/loginZalo', config: AppUsers.loginZalo },
  { method: "POST", path: "/AppUsers/find", config: AppUsers.find },
  { method: "POST", path: "/AppUsers/findById", config: AppUsers.findById },
  {
    method: "POST",
    path: "/AppUsers/updateUserById",
    config: AppUsers.updateById,
  },
  {
    method: "POST",
    path: "/AppUsers/changePasswordUser",
    config: AppUsers.changePasswordUser,
  },
  { method: "POST", path: "/AppUsers/verify2FA", config: AppUsers.verify2FA },
  { method: "GET", path: "/AppUsers/get2FACode", config: AppUsers.get2FACode },
  {
    method: "POST",
    path: "/AppUsers/verifyInfoUser",
    config: AppUsers.verifyInfoUser,
  },
  {
    method: "POST",
    path: "/AppUsers/rejectInfoUser",
    config: AppUsers.rejectInfoUser,
  },
  {
    method: "POST",
    path: "/AppUsers/getUsersByMonth",
    config: AppUsers.getUsersByMonth,
  },
  {
    method: "POST",
    path: "/AppUsers/uploadImageIdentityCardBefore",
    config: AppUsers.uploadIdentityCardBefore,
  },
  {
    method: "POST",
    path: "/AppUsers/uploadImageIdentityCardAfter",
    config: AppUsers.uploadIdentityCardAfter,
  },
  {
    method: "POST",
    path: "/AppUsers/user/submitIdentity",
    config: AppUsers.userSubmitIdentity,
  },
  {
    method: "POST",
    path: "/AppUsers/user/checkExistingAccount",
    config: AppUsers.userCheckExistingAccount,
  },
  {
    method: "POST",
    path: "/AppUsers/exportExcel",
    config: AppUsers.exportExcelFile,
  },
  {
    method: "POST",
    path: "/AppUsers/forgotPassword",
    config: AppUsers.forgotPassword,
  },
  {
    method: "POST",
    path: "/AppUsers/forgotPasswordOTP",
    config: AppUsers.forgotPasswordOTP,
  },
  // { method: 'POST', path: '/AppUsers/verifyEmailUser', config: AppUsers.verifyEmailUser },
  {
    method: "POST",
    path: "/AppUsers/userResetPassword",
    config: AppUsers.resetPasswordBaseOnToken,
  },
  {
    method: "POST",
    path: "/AppUsers/adminResetPasswordUser",
    config: AppUsers.adminResetPasswordUser,
  },
  // { method: 'POST', path: '/AppUsers/sendMailToVerifyEmail', config: AppUsers.sendMailToVerify },
  {
    method: "POST",
    path: "/AppUsers/adminChangePasswordUser",
    config: AppUsers.adminChangePasswordUser,
  },
  {
    method: "POST",
    path: "/AppUsers/adminChangeSecondaryPasswordUser",
    config: AppUsers.adminChangeSecondaryPasswordUser,
  },
  {
    method: "POST",
    path: "/AppUsers/userViewsListMembership",
    config: AppUsers.userViewsListMembership,
  },
  {
    method: "POST",
    path: "/AppUsers/findAllUsersFollowingReferId",
    config: AppUsers.findAllUsersFollowingReferId,
  },
  // { method: 'POST', path: '/AppUsers/sendEmailOTP', config: AppUsers.sendEmailOTP },
  // { method: 'POST', path: '/AppUsers/user/sendEmailOTP', config: AppUsers.sendEmailOTP },
  // { method: 'POST', path: '/AppUsers/confirmEmailOTP', config: AppUsers.confirmEmailOTP },
  // { method: 'POST', path: '/AppUsers/user/changePasswordviaEmailOTP', config: AppUsers.changePasswordviaEmailOTP },
  {
    method: "POST",
    path: "/AppUsers/user/changeSecondaryPassword",
    config: AppUsers.userChangeSecondaryPassword,
  },
];
