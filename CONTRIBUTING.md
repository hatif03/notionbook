# Contributing to Prototyper

First off, thank you for considering contributing to Prototyper! 🎉

It's people like you that make Prototyper such a great tool. We welcome contributions from everyone, whether you're fixing a typo, adding a feature, or reporting a bug.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please be respectful, inclusive, and considerate in all interactions.

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details** (Chrome version, OS, extension version)
- **Console errors** if any

**Bug Report Template:**

```markdown
**Description**
A clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- Chrome Version: [e.g. 120.0.6099.109]
- OS: [e.g. macOS 14.1]
- Extension Version: [e.g. 1.0.0]

**Additional Context**
Any other relevant information
```

### Suggesting Features

We love new ideas! Before suggesting a feature:

1. **Check existing feature requests** to avoid duplicates
2. **Describe the problem** your feature would solve
3. **Explain your proposed solution** in detail
4. **Consider alternatives** you've thought about

**Feature Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives you've considered**
Other solutions you thought about

**Additional context**
Mockups, examples, or references
```

### Your First Code Contribution

Unsure where to start? Look for issues labeled:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we'd appreciate community help
- `documentation` - Improvements to docs

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** with clear, logical commits
3. **Test thoroughly** in Chrome
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- Chrome browser
- Git

### Setup Steps

1. **Fork and clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/prototyper.git
   cd prototyper
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Add your ANTHROPIC_API_KEY to .env
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Load extension in Chrome**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `extension` folder

### Testing Your Changes

1. **Extension changes:**
   - Make changes to extension files
   - Go to `chrome://extensions/`
   - Click refresh icon on Prototyper
   - Test on a website

2. **Server changes:**
   - Server auto-reloads with `tsx watch`
   - Test API endpoints
   - Check console for errors

3. **Manual testing checklist:**
   - [ ] Add components
   - [ ] Drag and resize
   - [ ] Style changes apply correctly
   - [ ] AI generation works
   - [ ] PNG export includes components
   - [ ] Save/load functionality
   - [ ] No console errors

## 🔄 Pull Request Process

1. **Update documentation** for any user-facing changes

2. **Follow the PR template:**
   ```markdown
   **What does this PR do?**
   Brief description
   
   **Type of change**
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   **Testing**
   How you tested your changes
   
   **Screenshots**
   If applicable
   
   **Checklist**
   - [ ] Code follows style guidelines
   - [ ] Self-reviewed code
   - [ ] Commented complex logic
   - [ ] Updated documentation
   - [ ] No new warnings
   - [ ] Tested in Chrome
   ```

3. **Link related issues** using keywords like "Fixes #123"

4. **Wait for review** - maintainers will review and may request changes

5. **Make requested changes** if any

6. **Get approved and merged!** 🎉

## 📝 Style Guidelines

### JavaScript/TypeScript

- **Use 2 spaces** for indentation
- **Semicolons** are required
- **Camel case** for variables and functions
- **Pascal case** for classes and components
- **Descriptive names** over short names
- **Comment complex logic** 

```javascript
// Good
function calculateComponentPosition(element, offset) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + offset.x,
    y: rect.top + offset.y
  };
}

// Bad
function calc(e, o) {
  let r = e.getBoundingClientRect();
  return { x: r.left + o.x, y: r.top + o.y }
}
```

### CSS

- **Use semantic class names** (`pm-toolbar-header`, not `div1`)
- **Group related styles**
- **Use CSS variables** for colors/spacing
- **Mobile-first approach** when applicable

### Commit Messages

Follow conventional commits:

- `feat: add component duplication feature`
- `fix: resolve resize handle positioning bug`
- `docs: update installation instructions`
- `style: format code with prettier`
- `refactor: simplify drag handler logic`
- `test: add tests for style application`
- `chore: update dependencies`

### Documentation

- **Use clear, simple language**
- **Include code examples**
- **Add screenshots for UI changes**
- **Keep README.md up to date**

## 🎯 Good First Issues

Here are some ideas for first contributions:

- Add new component templates (badges, alerts, breadcrumbs)
- Improve error messages
- Add keyboard shortcuts
- Enhance documentation
- Fix typos or improve wording
- Add more color presets
- Improve mobile responsiveness

## 🌟 Recognition

Contributors will be:
- Listed in our Contributors section
- Credited in release notes
- Thanked in our community channels

## 💬 Community

- **GitHub Discussions** - Ask questions, share ideas
- **Issues** - Bug reports and feature requests
- **Pull Requests** - Code contributions

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [MDN Web Docs](https://developer.mozilla.org/)

## ❓ Questions?

Don't hesitate to ask! Open a discussion or reach out to maintainers.

---

Thank you for contributing to Prototyper! 🚀

