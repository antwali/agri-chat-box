# Contributing to Agri-Chat

Thank you for your interest in contributing to Agri-Chat! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/agri-chat-box.git
   cd agri-chat-box
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

Follow the setup instructions in [RUN.md](RUN.md) to get the development environment running.

## Code Style

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints
- Format code with `black`
- Maximum line length: 100 characters

```bash
# Format code
black backend/

# Check style
flake8 backend/
```

### TypeScript/React (Frontend)

- Use TypeScript for all new code
- Follow React best practices
- Use functional components with hooks
- Format with Prettier (if configured)

```bash
# Format code
npm run format  # if available
```

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add document export functionality
fix: Resolve OpenSearch connection timeout
docs: Update API documentation
refactor: Simplify document processing logic
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features (if applicable)
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** (if exists)
5. **Submit PR** with clear description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)
```

## Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 Test coverage
- 🎨 UI/UX improvements
- ⚡ Performance optimizations
- 🔒 Security enhancements

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain a positive environment

Thank you for contributing! 🎉

