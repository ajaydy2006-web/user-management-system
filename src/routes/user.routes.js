const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { basicAuth } = require('../middleware/auth');

// All routes are secured with Basic Authentication
router.use(basicAuth);

// Base CRUD & Batch operations
router
  .route('/')
  .post(userController.createUser)
  .get(userController.getAllUsers);

router.post('/seed', userController.seedUsers);
router.get('/stats/summary', userController.getStats);

router
  .route('/:id')
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
