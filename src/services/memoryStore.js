const bcrypt = require('bcryptjs');

let usersCollection = [];
let idCounter = 1;

class MemoryUserStore {
  static async create(data) {
    // Validate required fields
    if (!data.name || data.name.trim().length < 2) {
      const err = new Error('Name must be at least 2 characters long');
      err.name = 'ValidationError';
      err.errors = { name: { message: err.message } };
      throw err;
    }
    if (!data.email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
      const err = new Error('Please enter a valid email address');
      err.name = 'ValidationError';
      err.errors = { email: { message: err.message } };
      throw err;
    }
    if (!data.password || data.password.length < 6) {
      const err = new Error('Password must be at least 6 characters long');
      err.name = 'ValidationError';
      err.errors = { password: { message: err.message } };
      throw err;
    }

    // Check duplicate email
    const emailLower = data.email.toLowerCase();
    const existing = usersCollection.find((u) => u.email === emailLower);
    if (existing) {
      const err = new Error(`Duplicate value entered for 'email'. Must be unique.`);
      err.code = 11000;
      err.keyValue = { email: emailLower };
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const now = new Date();
    const newUser = {
      _id: `mem_user_${idCounter++}_${Date.now()}`,
      name: data.name.trim(),
      email: emailLower,
      password: hashedPassword,
      role: ['admin', 'manager', 'user'].includes(data.role) ? data.role : 'user',
      status: ['active', 'inactive', 'pending'].includes(data.status) ? data.status : 'active',
      department: data.department ? data.department.trim() : 'Engineering',
      phone: data.phone ? data.phone.trim() : '',
      bio: data.bio ? data.bio.trim() : '',
      createdAt: now,
      updatedAt: now,
    };

    usersCollection.push(newUser);
    return this.toPublicUser(newUser);
  }

  static async find(query = {}, options = {}) {
    let result = [...usersCollection];

    if (query.$or) {
      const regexes = query.$or.map((cond) => cond[Object.keys(cond)[0]].$regex);
      result = result.filter((u) => {
        return regexes.some(
          (reg) =>
            new RegExp(reg, 'i').test(u.name) ||
            new RegExp(reg, 'i').test(u.email) ||
            new RegExp(reg, 'i').test(u.department)
        );
      });
    }

    if (query.role) {
      result = result.filter((u) => u.role === query.role);
    }

    if (query.status) {
      result = result.filter((u) => u.status === query.status);
    }

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.order === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
      if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
      return 0;
    });

    const page = options.page || 1;
    const limit = options.limit || 20;
    const startIndex = (page - 1) * limit;

    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      users: paginated.map((u) => this.toPublicUser(u)),
      total: result.length,
    };
  }

  static async findById(id) {
    const user = usersCollection.find((u) => u._id === id);
    if (!user) return null;
    return this.toPublicUser(user);
  }

  static async findByEmailWithPassword(email) {
    const user = usersCollection.find((u) => u.email === email.toLowerCase());
    return user || null;
  }

  static async updateById(id, updateData) {
    const user = usersCollection.find((u) => u._id === id);
    if (!user) return null;

    if (updateData.email && updateData.email.toLowerCase() !== user.email) {
      const existing = usersCollection.find(
        (u) => u.email === updateData.email.toLowerCase() && u._id !== id
      );
      if (existing) {
        const err = new Error(`Duplicate value entered for 'email'. Must be unique.`);
        err.code = 11000;
        err.keyValue = { email: updateData.email };
        throw err;
      }
      user.email = updateData.email.toLowerCase();
    }

    if (updateData.name !== undefined) user.name = updateData.name.trim();
    if (updateData.role !== undefined) user.role = updateData.role;
    if (updateData.status !== undefined) user.status = updateData.status;
    if (updateData.department !== undefined) user.department = updateData.department.trim();
    if (updateData.phone !== undefined) user.phone = updateData.phone.trim();
    if (updateData.bio !== undefined) user.bio = updateData.bio.trim();

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updateData.password, salt);
    }

    user.updatedAt = new Date();
    return this.toPublicUser(user);
  }

  static async deleteById(id) {
    const index = usersCollection.findIndex((u) => u._id === id);
    if (index === -1) return null;
    const deleted = usersCollection.splice(index, 1)[0];
    return this.toPublicUser(deleted);
  }

  static async count(query = {}) {
    let result = [...usersCollection];
    if (query.role) result = result.filter((u) => u.role === query.role);
    if (query.status) result = result.filter((u) => u.status === query.status);
    return result.length;
  }

  static toPublicUser(user) {
    const clone = { ...user };
    delete clone.password;
    return clone;
  }

  static reset() {
    usersCollection = [];
    idCounter = 1;
  }
}

module.exports = MemoryUserStore;
