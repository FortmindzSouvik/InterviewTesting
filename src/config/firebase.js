const firebase = require('firebase-admin');
const { serviceAccount } = require('./service');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

const fs = firebase.firestore();
module.exports = {
  firebase,
  fs,
};
