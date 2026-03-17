/**
 * Authenticate User Use Case
 */
const jwt = require('jsonwebtoken');

class AuthenticateUser {
  constructor(userRepository, jwtSecret) {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
  }

  async execute(username, password) {
    // Authenticate through repository
    const user = await this.userRepository.authenticate(username, password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.userId, 
        username: user.username, 
        fullName: user.fullName,
        role: user.role 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: user.toSafeObject()
    };
  }
}

module.exports = AuthenticateUser;
