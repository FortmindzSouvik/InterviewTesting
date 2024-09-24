const _ = require('lodash');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiSuccess = require('../utils/ApiSuccess');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, adminService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  new ApiSuccess(res, httpStatus.CREATED, 'user create', user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUserDetails = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  new ApiSuccess(res, httpStatus.OK, 'user details', user);
});

const getUserCities = catchAsync(async (req, res) => {
  const user = await userService.getUserCitiesById(req.body.location);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'cities not found');
  }
  new ApiSuccess(res, httpStatus.OK, 'city list', user);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  new ApiSuccess(res, httpStatus.OK, 'user details', user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.id, req.body);
  new ApiSuccess(res, httpStatus.OK, 'updated', user);
});

const deleteUser = catchAsync(async (req, res) => {
  const deletedUser = await userService.deleteUserById(req.params.id);
  new ApiSuccess(res, httpStatus.OK, 'user deleted', deletedUser);
});

const getUserList = catchAsync(async (req, res) => {
  const userInfo = await userService.listOfUsers();
  new ApiSuccess(res, httpStatus.OK, 'user list', userInfo);
});

const followEvents = catchAsync(async (req, res) => {
  const event = await adminService.getEvent(req.params.id);
  const followerCheck = await adminService.followerFollowStatus(req.params.id, req.user.id);
  const follow = await adminService.followEventByUser(req.params.id, req.user.id);
  new ApiSuccess(res, httpStatus.OK, 'follow', follow);
});

const unFollowEvents = catchAsync(async (req, res) => {
  const event = await adminService.getEvent(req.params.id);
  const unFollow = await adminService.unFollowEventByUser(req.params.id, req.user.id);
  new ApiSuccess(res, httpStatus.OK, 'unFollow', unFollow);
});

const getFollowerListEvent = catchAsync(async (req, res) => {
  const eventFollowerList = await userService.listOfFollowerEvent(req.params.id);
  new ApiSuccess(res, httpStatus.OK, 'event interested follower list', eventFollowerList);
});

module.exports = {
  getUserList,
  getUserCities,
  getUserDetails,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  followEvents,
  unFollowEvents,
  getFollowerListEvent,
};
