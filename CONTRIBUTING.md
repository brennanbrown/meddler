# Contributing to Meddler

Thank you for your interest in contributing to Meddler! This guide will help you get started.

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git

### Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/meddler.git
   cd meddler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build all packages**
   ```bash
   npm run build
   ```

4. **Run tests** (if available)
   ```bash
   npm test
   ```

## Project Structure

```
meddler/
├── packages/
│   ├── core/          # Core conversion library
│   ├── cli/           # Command-line interface
│   ├── web/           # Web interface
│   └── meddler-cli/   # Unscoped CLI wrapper
├── README.md
├── CONTRIBUTING.md
└── netlify.toml
```

### Packages

- **@berryhouse/core**: Core parsing and conversion logic
- **@berryhouse/meddler**: CLI tool
- **meddler-cli**: Unscoped wrapper for easy installation
- **@meddler/web**: Web interface (private, not published)

## Development

### Running the CLI

```bash
# Development mode with watch
npm run dev -w packages/cli

# Or run directly
npm run meddler --help
```

### Running the Web App

```bash
# Start dev server
npm run dev -w packages/web

# Build for production
npm run build -w packages/web
```

### Working with the Core Library

```bash
# Build core in watch mode
npm run dev -w packages/core
```

## Bug Reports

When filing a bug report, please include:

1. **Environment**: OS, Node.js version, package version
2. **Steps to reproduce**: Clear, numbered steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happened
5. **Sample files**: If applicable, a minimal Medium export that reproduces the issue

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Environment
- OS: [e.g., macOS 14.0]
- Node.js: [e.g., 18.17.0]
- Meddler: [e.g., 1.0.2]

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happened

## Additional Context
Any other relevant information
```

## Feature Requests

Feature requests are welcome! Please:

1. Check if there's an existing issue
2. Describe the use case
3. Consider if it fits the project scope
4. Suggest implementation ideas if you have them

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about
```

## Code Contributions

### Before You Start

1. Check for existing issues and PRs
2. Discuss major changes in an issue first
3. Follow the existing code style
4. Keep changes focused and minimal

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code patterns
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run build
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Use conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add support for Astro SSG
fix: handle malformed HTML in posts
docs: update installation instructions
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific package
npm test -w packages/core
```

### Writing Tests

- Test core functionality in `@berryhouse/core`
- Test CLI commands and options
- Test edge cases and error conditions
- Keep tests focused and fast

## Documentation

### Types of Documentation

1. **Code comments**: Complex logic, algorithms
2. **README files**: Package-specific documentation
3. **API docs**: Function signatures and examples
4. **User docs**: Installation and usage guides

### Updating Documentation

- Keep README files up to date
- Document new features
- Update examples when changing behavior
- Check for broken links

## Areas for Contribution

### High Priority

- **Test coverage**: Add tests for core functionality
- **Error handling**: Improve error messages and handling
- **Documentation**: Improve docs and examples
- **Performance**: Optimize large export processing

### Medium Priority

- **New SSG support**: Add presets for other static site generators
- **UI improvements**: Enhance the web interface
- **CLI options**: Add new conversion options
- **Internationalization**: Add i18n support

### Low Priority

- **Plugins**: Plugin system for custom processors
- **Themes**: Built-in themes for generated sites
- **Analytics**: Usage statistics (privacy-preserving)

## Code of Conduct

Please be respectful and inclusive:

- Use inclusive language
- Welcome newcomers
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Help

- **Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Email**: For private matters (brennan@brennan.day)

## Recognition

Contributors will be recognized in:

- README contributors section
- Release notes
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0-or-later](LICENSE) license.

---

Thank you for contributing to Meddler! Your help makes this project better for everyone.
