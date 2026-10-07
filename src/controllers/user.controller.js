const User = require('../models/User');
const { getIsInMemoryStore } = require('../config/db');
const MemoryUserStore = require('../services/memoryStore');

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Protected / Basic Auth
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, status, department, phone, bio } = req.body;

    if (getIsInMemoryStore()) {
      const user = await MemoryUserStore.create({ name, email, password, role, status, department, phone, bio });
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    }

    // Mongoose path
    const existingUser = await User.findOne({ email: email ? email.toLowerCase() : '' });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Email',
        message: `A user with email '${email}' already exists.`,
      });
    }

    const user = await User.create({ name, email, password, role, status, department, phone, bio });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with search, filtering, sorting, pagination
 * @route   GET /api/users
 * @access  Protected / Basic Auth
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, sortBy = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    if (getIsInMemoryStore()) {
      const query = {};
      if (search) query.$or = [{ name: { $regex: search } }, { email: { $regex: search } }, { department: { $regex: search } }];
      if (role) query.role = role;
      if (status) query.status = status;

      const { users, total } = await MemoryUserStore.find(query, { page: pageNum, limit: limitNum, sortBy, order });
      return res.status(200).json({
        success: true,
        count: users.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: users,
      });
    }

    // Mongoose path
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query).sort({ [sortBy]: sortOrder }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Protected / Basic Auth
 */
exports.getUserById = async (req, res, next) => {
  try {
    if (getIsInMemoryStore()) {
      const user = await MemoryUserStore.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `User with ID '${req.params.id}' not found.`,
        });
      }
      return res.status(200).json({ success: true, data: user });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `User with ID '${req.params.id}' not found.`,
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user details
 * @route   PUT /api/users/:id
 * @access  Protected / Basic Auth
 */
exports.updateUser = async (req, res, next) => {
  try {
    if (getIsInMemoryStore()) {
      const updatedUser = await MemoryUserStore.updateById(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `User with ID '${req.params.id}' not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `User with ID '${req.params.id}' not found.`,
      });
    }

    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate Email',
          message: `The email '${req.body.email}' is already in use by another user.`,
        });
      }
    }

    const fieldsToUpdate = ['name', 'email', 'role', 'status', 'department', 'phone', 'bio'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Protected / Basic Auth
 */
exports.deleteUser = async (req, res, next) => {
  try {
    if (getIsInMemoryStore()) {
      const deletedUser = await MemoryUserStore.deleteById(req.params.id);
      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `User with ID '${req.params.id}' not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        message: `User '${deletedUser.name}' (${deletedUser._id}) has been deleted successfully.`,
        data: { id: deletedUser._id, name: deletedUser.name, email: deletedUser.email },
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `User with ID '${req.params.id}' not found.`,
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' (${user._id}) has been deleted successfully.`,
      data: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Seed sample users into database
 * @route   POST /api/users/seed
 * @access  Protected / Basic Auth
 */
exports.seedUsers = async (req, res, next) => {
  try {
    const sampleUsers = [
      {
        name: 'Sarah Connor',
        email: 'sarah.connor@cyberdyne.io',
        password: 'password123',
        role: 'admin',
        status: 'active',
        department: 'Security & Operations',
        phone: '+1 555-0199',
        bio: 'Lead Operations Engineer & Security Auditor',
      },
      {
        name: 'Alex Mercer',
        email: 'alex.mercer@gentek.org',
        password: 'password123',
        role: 'manager',
        status: 'active',
        department: 'Research & Development',
        phone: '+1 555-0142',
        bio: 'Senior Director of Virology & Bio-Tech Architecture',
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@neura.com',
        password: 'password123',
        role: 'user',
        status: 'active',
        department: 'Engineering',
        phone: '+1 555-0188',
        bio: 'Full Stack Node.js & Cloud Developer',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.vance@blackmesa.gov',
        password: 'password123',
        role: 'user',
        status: 'pending',
        department: 'Anomalous Materials',
        phone: '+1 555-0176',
        bio: 'Junior Theoretical Physicist',
      },
      {
        name: 'Diana Prince',
        email: 'diana.prince@themyscira.net',
        password: 'password123',
        role: 'admin',
        status: 'active',
        department: 'Executive Management',
        phone: '+1 555-0133',
        bio: 'Chief Information Security Officer',
      },
    ];

    let createdCount = 0;
    for (const u of sampleUsers) {
      if (getIsInMemoryStore()) {
        try {
          await MemoryUserStore.create(u);
          createdCount++;
        } catch (err) {
          // ignore duplicate email in seeding
        }
      } else {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          await User.create(u);
          createdCount++;
        }
      }
    }

    let allUsers;
    if (getIsInMemoryStore()) {
      const resData = await MemoryUserStore.find();
      allUsers = resData.users;
    } else {
      allUsers = await User.find();
    }

    res.status(200).json({
      success: true,
      message: `Seeded ${createdCount} new sample users. Total users in database: ${allUsers.length}`,
      count: allUsers.length,
      data: allUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary statistics
 * @route   GET /api/users/stats/summary
 * @access  Protected / Basic Auth
 */
exports.getStats = async (req, res, next) => {
  try {
    if (getIsInMemoryStore()) {
      const total = await MemoryUserStore.count();
      const active = await MemoryUserStore.count({ status: 'active' });
      const inactive = await MemoryUserStore.count({ status: 'inactive' });
      const pending = await MemoryUserStore.count({ status: 'pending' });
      const admins = await MemoryUserStore.count({ role: 'admin' });
      const managers = await MemoryUserStore.count({ role: 'manager' });
      const regularUsers = await MemoryUserStore.count({ role: 'user' });

      return res.status(200).json({
        success: true,
        stats: {
          total,
          status: { active, inactive, pending },
          roles: { admin: admins, manager: managers, user: regularUsers },
        },
      });
    }

    const total = await User.countDocuments();
    const active = await User.countDocuments({ status: 'active' });
    const inactive = await User.countDocuments({ status: 'inactive' });
    const pending = await User.countDocuments({ status: 'pending' });
    const admins = await User.countDocuments({ role: 'admin' });
    const managers = await User.countDocuments({ role: 'manager' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    res.status(200).json({
      success: true,
      stats: {
        total,
        status: { active, inactive, pending },
        roles: { admin: admins, manager: managers, user: regularUsers },
      },
    });
  } catch (error) {
    next(error);
  }
};
