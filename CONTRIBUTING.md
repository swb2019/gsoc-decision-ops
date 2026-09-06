# Contributing to Hourglass Command

[Hourglass Command](README.md) · [Live simulation](https://swb2019.github.io/gsoc-decision-ops/) · [Training methodology](docs/TRAINING.md)

Thank you for your interest in contributing to Hourglass Command. This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and professional environment. We expect all contributors to:

- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the project and community
- Show empathy towards other community members

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. **Search existing issues** to avoid duplicates
2. **Create a new issue** with a clear title and description
3. **Provide context**: Include steps to reproduce bugs, expected vs. actual behavior
4. **Label appropriately**: bug, enhancement, documentation, etc.

### Pull Requests

1. **Fork the repository** and create a feature branch
2. **Follow code style**: Run `npm run lint` and `npm run format` before committing
3. **Write tests**: All new functionality should include tests
4. **Update documentation**: If your change affects the API or usage
5. **Create a pull request** with a clear description of changes

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/gsoc-decision-ops.git
cd gsoc-decision-ops

# Install dependencies
npm install

# Build the core library
npm run build --workspace=packages/core

# Run tests
npm test

# Start development server
npm run dev
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Write clear, concise commit messages:

```
feat: add bridge call recording to decision log
fix: correct timestamp formatting in export
docs: update quickstart instructions
test: add decision log edge case tests
```

## Code Guidelines

### TypeScript

- Use strict TypeScript (`"strict": true`)
- Prefer explicit return types on functions
- Use interfaces over types where appropriate
- Document public APIs with JSDoc comments

### Testing

- Write unit tests for all new functionality
- Use descriptive test names
- Test edge cases and error conditions
- Maintain test coverage for core functionality

### Documentation

- Keep README.md current with API changes
- Document complex logic with inline comments
- Update examples when APIs change

## Content Guidelines

### Training Scenarios

When contributing new training scenarios:

1. **Mark as synthetic**: All scenarios must be clearly marked as fictional training exercises
2. **No real vendor names**: Use fictional vendor names only
3. **No real incidents**: Do not base scenarios on actual incidents without explicit permission
4. **Professional framing**: Scenarios should be realistic but educational

### Playbooks

When contributing new playbooks:

1. **Include governance notes**: Human-in-the-loop considerations
2. **Phase structure**: Clear objectives, key questions, and checklists
3. **Time estimates**: Realistic durations for each phase
4. **Escalation triggers**: Clear criteria for escalation

## Questions?

If you have questions about contributing, please open an issue with the `question` label.

---

Thank you for contributing to Hourglass Command!
