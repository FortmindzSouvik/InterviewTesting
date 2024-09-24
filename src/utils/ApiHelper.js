const { fs, firebase } = require('../config/firebase');
const _ = require('lodash');

const replaceMessagePlaceholders = async (template, values) => {
  return template.replace(/\$(\d)/g, (_, index) => values[index - 1]);
};

/**
 *notification details in fireStore based on userId
 */
const firebaseDataStore = async (
  userData,
  followerData,
  notificationMessage,
  notificationType,
  notificationTypeId,
  eventData
) => {
  let userRef = fs.collection('users').doc(userData._id.toString());
  let notificationsRef = userRef.collection('notifications');
  return (newNotificationRef = await notificationsRef.add({
    message: notificationMessage,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    payload: {
      eventName: _.isEmpty(eventData) ? null : eventData.name,
      userId: _.isEmpty(followerData) ? null : followerData._id.toString(),
      profilePhoto: _.isEmpty(followerData) ? null : followerData.profilePhoto,
      eventPhoto: _.isEmpty(eventData) ? null : eventData.banner,
      type: notificationType,
      typeId: notificationTypeId.toString(),
      read: false,
    },
  }));
};

module.exports = {
  replaceMessagePlaceholders,
  firebaseDataStore,
};
