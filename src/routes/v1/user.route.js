const express = require('express');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post('/employee/create', userController.createUser);
router.put('/employee-update/:id', userController.updateUser);
router.get('/employee/list', userController.getUserList);
router.get('/employee/:id', userController.getUserDetails);
router.delete('/employee-remove/:id', userController.deleteUser);

module.exports = router;
