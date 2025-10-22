# Pre-Commit Hooks Setup

This project uses **Husky** and **lint-staged** to automatically run quality checks before every commit.

## What Happens on Commit?

When you run `git commit`, the following checks run automatically:

### 1. ✅ TypeScript Type Checking
```bash
npm run type-check
# Runs: tsc --noEmit
```
- Checks for TypeScript type errors across the entire project
- Ensures type safety before committing

### 2. ✅ ESLint
```bash
npm run lint
# Runs: next lint
```
- Checks for code quality issues
- Identifies potential bugs and code smells
- Enforces consistent coding style

### 3. ✅ Lint-Staged (Auto-fix)
```bash
npx lint-staged
```
- Automatically fixes linting issues in staged files
- Formats code using Prettier
- Only runs on files you're about to commit

## Installation

The hooks are automatically set up when you run:
```bash
npm install
```

## Manual Setup

If you need to set up manually:

```bash
# Install dependencies
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# The pre-commit hook is already created in .husky/pre-commit
```

## Configuration

### package.json Scripts
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "next lint",
    "prepare": "husky"
  }
}
```

### lint-staged Configuration
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## What If Checks Fail?

If any check fails, the commit will be **blocked**:

```
❌ TypeScript error found - commit blocked
❌ Linting error found - commit blocked
```

### How to Fix:

1. **Review the errors** shown in the terminal
2. **Fix the issues** in your code
3. **Stage the fixes**: `git add .`
4. **Try committing again**: `git commit -m "your message"`

## Bypassing Hooks (Not Recommended)

In rare cases, if you need to bypass the hooks:

```bash
git commit -m "your message" --no-verify
```

⚠️ **Warning**: This skips all quality checks. Only use when absolutely necessary!

## Benefits

✅ **Catch errors early** - Before they reach the repository  
✅ **Consistent code quality** - Every commit meets standards  
✅ **Automatic formatting** - Code is automatically formatted  
✅ **Team collaboration** - Everyone follows the same rules  
✅ **Cleaner git history** - No commits with broken code  

## Testing the Hooks

To test if hooks are working:

1. Make a change to any `.ts` or `.tsx` file
2. Stage it: `git add <file>`
3. Try to commit: `git commit -m "test"`
4. You should see the checks running

## Troubleshooting

### Hooks not running?

```bash
# Ensure git hooks are configured
git config core.hooksPath .husky

# Make sure husky is initialized
npx husky init
```

### Permission denied (Unix/Mac)?

```bash
chmod +x .husky/pre-commit
```

### Hooks running on all files?

This is normal for `type-check` and `lint` - they check the entire project for consistency.

## Files Involved

- `.husky/pre-commit` - The pre-commit hook script
- `package.json` - Scripts and lint-staged config
- `.eslintrc.json` - ESLint configuration
- `tsconfig.json` - TypeScript configuration

## Customization

To modify what runs before commits, edit `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Add or remove checks here
npm run type-check
npm run lint
npx lint-staged
```

## Disabling Hooks

To temporarily disable hooks project-wide:

```bash
# Disable
git config core.hooksPath /dev/null

# Re-enable
git config core.hooksPath .husky
```

---

**Note**: These hooks ensure code quality and prevent broken code from being committed. They're an essential part of our development workflow! 🚀


