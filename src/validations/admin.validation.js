const Joi = require('joi');
const { password, userName, objectId } = require('./custom.validation');

const sendOtp = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};
const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
    // deviceToken: Joi.string(),
  }),
};

module.exports = {
  sendOtp,
  logout,
};
