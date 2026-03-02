/**
 * Auth Controller
 */
class AuthController {
  constructor(container) {
    this.authenticateUser = container.get('authenticateUser');
    this.userRepository = container.get('userRepository');
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await this.authenticateUser.execute(username, password);
      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: error.message });
    }
  }

  async getMe(req, res) {
    try {
      const user = await this.userRepository.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user.toSafeObject());
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await this.userRepository.findAll();
      res.json(users.map(u => u.toSafeObject()));
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async register(req, res) {
    try {
      const { username, password, fullName, email, role } = req.body;
      
      // Check if user already exists
      const existingUser = await this.userRepository.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Generate new user ID
      const userId = await this.userRepository.generateNextId();
      
      // Create user (using plain text password to match current system)
      // TODO: In production, use bcryptjs to hash passwords
      const User = require('../../domain/entities/User');
      const newUser = new User({
        userId,
        username,
        password, // Plain text (matches current authenticate method)
        fullName,
        email,
        role: role || 'User',
        createdDate: new Date(),
        isActive: true
      });

      await this.userRepository.create(newUser);
      
      res.status(201).json({ 
        message: 'User created successfully',
        user: newUser.toSafeObject()
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: error.message || 'Error creating user' });
    }
  }
}

module.exports = AuthController;
