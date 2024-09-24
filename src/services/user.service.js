const httpStatus = require('http-status');
const otpGenerator = require('otp-generator');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getAdminUserByEmail = async (email) => {
  return Admin.findOne({ email, role: 'superAdmin' });
};

/**
 * register admin email
 * @param {*} email
 * @returns
 */
const getAdminRegisterEmail = async (email) => {
  return Admin.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 * generate OTP
 * @param {*} userId
 * @returns
 */
const generateUserOTP = async (userId) => {
  const currentDateTime = moment(new Date());
  currentDateTime.add(5, 'minutes');
  const otpExpiry = moment.utc(currentDateTime).format();
  const otp = otpGenerator.generate(4, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const userData = await updateUserById(userId, {
    otp,
    otpExpiry,
  });
  return userData.otp;
};

/**
 * event  follower list
 * @param {*} eventData
 * @returns
 */
const listOfFollowerEvent = async (eventData) => {
  const eventFollowerListData = await Follow.find({ eventId: eventData }).populate('eventId').sort({ createdAt: -1 });
  return eventFollowerListData;
};

/**
 * booking event
 * @param {*} bookData
 * @returns
 */
const eventBookingCreate = async (bookData) => {
  if (bookData.isBooking == 'cancelled') {
    return await Booking.findOneAndUpdate(
      { _id: bookData.bookingId, userId: bookData.userId },
      { status: bookData.isBooking },
      { new: true, useFindAndModify: false }
    );
  } else {
    const eventBookingData = await Booking.create(bookData);
    return eventBookingData;
  }
};

/**
 * upcoming event booking list
 * @param {*} bookDataUserId
 * @param {*} skip
 * @param {*} limit
 * @param {*} page
 * @returns
 */
const eventUpcomingBookingList = async (bookDataUserId, skip, limit, page) => {
  const eventBookingData = await Booking.find({ userId: bookDataUserId.userId }).populate('eventId').skip(skip).limit(limit);

  const totalCount = await Booking.countDocuments({ userId: bookDataUserId.userId });
  const totalPages = Math.ceil(totalCount / limit);

  const currentDateTime = new Date();

  const upcomingBookings = eventBookingData.filter((booking) => booking.eventId.startDateTime >= currentDateTime);

  return {
    upcomingBookings,
    totalPages,
    currentPage: page,
  };
};

/**
 * all booking list
 * @param {*} bookDataUserId
 * @param {*} skip
 * @param {*} limit
 * @param {*} page
 * @returns
 */
const eventAllBookingList = async (bookDataUserId, skip, limit, page) => {
  const eventAllBookingData = await Booking.find({ userId: bookDataUserId.userId })
    .populate('eventId')
    .skip(skip)
    .limit(limit);

  const totalCount = await Booking.countDocuments({ userId: bookDataUserId.userId });
  const totalPages = Math.ceil(totalCount / limit);

  return {
    eventAllBookingData,
    totalPages,
    currentPage: page,
  };
};

/**
 *  past event booking list
 * @param {*} bookDataUserId
 * @param {*} skip
 * @param {*} limit
 * @param {*} page
 * @returns
 */
const eventPastBookingList = async (bookDataUserId, skip, limit, page) => {
  const eventBookingData = await Booking.find({ userId: bookDataUserId.userId }).populate('eventId').skip(skip).limit(limit);

  const totalCount = await Booking.countDocuments({ userId: bookDataUserId.userId });
  const totalPages = Math.ceil(totalCount / limit);

  const currentDateTime = new Date();

  const pastBookings = eventBookingData.filter((booking) => booking.eventId.endDateTime < currentDateTime);
  return {
    past: pastBookings,
    totalPages,
    currentPage: page,
  };
};

/**
 * check user exist based on uuid
 * @param {*} userBody
 * @returns
 */
const checkUserExist = async (uuid) => {
  return await User.find({
    uid: uuid,
  });
};

/**
 * event favorite added
 * @returns
 */
const eventFavoriteAdded = async (eventId, userId) => {
  const favoriteCheck = await Event.findOne({ _id: eventId, 'favorite.userId': userId });

  if (favoriteCheck) {
    const eventFavoriteDetails = await Event.findOneAndUpdate(
      { _id: eventId },
      { $pull: { favorite: { userId: userId } } },
      { new: true, useFindAndModify: false }
    );
    return eventFavoriteDetails;
  } else {
    const eventFavoriteDetails = await Event.findOneAndUpdate(
      { _id: eventId },
      { $push: { favorite: { userId: userId } } },
      { new: true, useFindAndModify: false }
    );
    return eventFavoriteDetails;
  }
};

/**
 * user favorite event list
 * @param {*} favoriteEventData
 * @returns
 */
const userEventFavoriteList = async (userId) => {
  const eventFavoriteDetails = await Event.find({ 'favorite.userId': userId });
  return eventFavoriteDetails;
};

/**
 * review added
 * @param {*} rateBody
 * @returns
 */
const createRatingEvent = async (rateBody) => {
  return Review.create(rateBody);
};

/**
 * particular event review & rate
 * @param {*} eventId
 * @returns
 */
const getRatingEvent = async (eventId) => {
  return Review.find({ eventId }).populate('eventId').populate('userId').sort({ like: -1 });
};

/**
 * trending event
 * @param {*} eventId
 * @returns
 */
const getTrendingEventList = async () => {
  const currentDateTime = new Date();
  return await Event.find({ startDateTime: { $gt: currentDateTime }, isPermitted: true }).sort({ favorite: -1 });
};

/**
 * like dislike on review
 * @param {*} reviewId
 * @param {*} eventBody
 * @returns
 */
const likeDislikeRatingEvent = async (reviewId, eventBody) => {
  if (eventBody.isLike) {
    return await Review.findOneAndUpdate(
      { _id: reviewId },
      { $push: { like: { userId: eventBody.userId } } },
      { new: true, useFindAndModify: false }
    );
  }

  if (!eventBody.isLike) {
    return await Review.findOneAndUpdate(
      { _id: reviewId },
      {
        $pull: { like: { userId: eventBody.userId } },
      },
      { new: true, useFindAndModify: false }
    );
  }

  if (eventBody.isDisLike) {
    return await Review.findOneAndUpdate(
      { _id: reviewId },
      {
        $push: { disLike: { userId: eventBody.userId } },
      },
      { new: true, useFindAndModify: false }
    );
  }

  if (!eventBody.isDisLike) {
    return await Review.findOneAndUpdate(
      { _id: reviewId },
      {
        $pull: { disLike: { userId: eventBody.userId } },
      },
      { new: true, useFindAndModify: false }
    );
  }
};

/**
 * like dislike checking
 * @param {*} reviewId
 * @param {*} eventBody
 */
const likeDislikeRatingEventCheck = async (reviewId, eventBody) => {
  if (eventBody.isLike) {
    const reviewCheck = await Review.findOne(
      { _id: reviewId },
      { 'like.userId': eventBody.userId },
      { new: true, useFindAndModify: false }
    );
    if (!_.isEmpty(reviewCheck.like)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'You already like this review');
    }
  }
  if (eventBody.isDisLike) {
    const reviewCheck = await Review.findOne(
      { _id: reviewId },
      {
        'disLike.userId': eventBody.userId,
      },
      { new: true, useFindAndModify: false }
    );

    if (!_.isEmpty(reviewCheck.isDisLike)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'You already dislike this review');
    }
  }
};

/**
 * check rating exist
 * @param {*} eventId
 * @param {*} userId
 * @returns
 */
const checkRatingExist = async (eventId, userId) => {
  return Review.find({
    eventId,
    userId,
  });
};

/**
 * coordinate check
 * @param {*} UserBody
 */
const coordinateLocationCheck = async (UserBody) => {
  if (
    !UserBody.location.coordinates ||
    UserBody.location.coordinates.length !== 2 ||
    !UserBody.location.name ||
    !UserBody.location.address
  ) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Kindly Allow Your Location');
  }
};

/**
 * modify the event details
 * @param {*} eventData
 * @param {*} eventId
 * @param {*} eventUserId
 * @returns
 */
const modifyEvent = async (eventData, eventId, eventUserId) => {
  const checkEventUpdatePermission = await Event.findOne({
    _id: eventId,
    userId: eventUserId,
  });

  if (!checkEventUpdatePermission) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `you are not authorized`);
  }

  const eventDetails = await Event.findOneAndUpdate(
    {
      _id: eventId,
    },
    eventData,
    { new: true, useFindAndModify: false }
  );
  return eventDetails;
};

const listOfUsers = async () => {
  const userDetails = await User.find().sort({ createdAt: -1 }).select('-otpExpiry -otp');
  return userDetails;
};

module.exports = {
  modifyEvent,
  likeDislikeRatingEventCheck,
  listOfUsers,
  likeDislikeRatingEvent,
  coordinateLocationCheck,
  getTrendingEventList,
  getRatingEvent,
  checkRatingExist,
  createRatingEvent,

  userEventFavoriteList,
  eventFavoriteAdded,
  eventBookingCreate,
  eventUpcomingBookingList,
  eventPastBookingList,
  eventAllBookingList,
  generateUserOTP,
  createUser,
  queryUsers,
  checkUserExist,
  getUserById,
  getUserByEmail,
  getAdminUserByEmail,
  getAdminRegisterEmail,
  updateUserById,
  deleteUserById,
  listOfFollowerEvent,
};
