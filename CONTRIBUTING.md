# Contributing to Robotics Club Door Lock System

Thank you for your interest in contributing to our door lock system! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/robotics-club-door-lock.git
   cd robotics-club-door-lock
   ```

3. **Set up the development environment**:
   ```bash
   npm run setup
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow ESLint configuration for frontend
- Use meaningful variable and function names
- Add comments for complex logic

### Backend Development
- Follow RESTful API conventions
- Validate all inputs
- Handle errors gracefully
- Update API documentation for new endpoints

### Frontend Development
- Use TypeScript for type safety
- Follow React best practices
- Ensure responsive design
- Test components thoroughly

### Environment Variables
- Never commit `.env` files
- Update `.env.example` when adding new variables
- Document new environment variables in README

## 🧪 Testing

Before submitting a pull request:

1. **Test the backend**:
   ```bash
   npm test
   ```

2. **Test the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Test the full application**:
   ```bash
   npm start
   # Verify all features work correctly
   ```

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Test your changes** thoroughly
3. **Create a pull request** with:
   - Clear title and description
   - List of changes made
   - Screenshots for UI changes
   - Test instructions

4. **Address review feedback** promptly

## 🐛 Bug Reports

When reporting bugs, include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error logs if applicable

## 💡 Feature Requests

For new features:
- Describe the use case
- Explain why it's needed
- Provide mockups for UI changes
- Consider security implications

## 🔒 Security

- Report security vulnerabilities privately
- Never commit sensitive data
- Follow security best practices
- Test authentication thoroughly

## 📞 Contact

For questions or discussions:
- Open an issue on GitHub
- Contact the Robotics Club NIT Allahabad team

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🤖