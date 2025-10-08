# Migration Guide: Old → New Structure

This guide helps you understand the changes from the old structure to the new optimized architecture.

## 📋 What Changed?

### Old Structure ❌
```
chat-app/
├── app/
├── components/
├── lib/
│   ├── api.ts          # Single file with all API calls
│   ├── auth.ts
│   └── utils.ts
└── server/
    ├── routes/
    │   ├── auth.ts     # Routes with business logic mixed
    │   └── user.ts
    ├── middleware/
    │   └── auth.ts
    └── utils/
        └── storage.ts  # Simple storage
```

### New Structure ✅
```
chat-app/
├── app/
├── components/
├── hooks/              # NEW: Custom React hooks
├── lib/
│   ├── api/           # NEW: Organized API layer
│   │   ├── client.ts
│   │   └── index.ts
│   ├── auth.ts
│   └── utils.ts
├── types/             # NEW: Shared types
├── constants/         # NEW: Centralized constants
└── server/
    ├── config/        # NEW: Configuration
    ├── controllers/   # NEW: Request handlers
    ├── services/      # NEW: Business logic
    ├── models/        # NEW: Data access
    ├── validators/    # NEW: Zod schemas
    ├── middleware/
    ├── routes/
    └── utils/
        └── errors.ts  # NEW: Custom errors
```

## 🔄 File Migrations

### 1. Types (NEW)

**Before**: Types scattered in files
```typescript
// In various files
interface User { ... }
interface ApiResponse { ... }
```

**After**: Centralized in `types/index.ts`
```typescript
// types/index.ts
export interface User { ... }
export interface ApiResponse { ... }
```

**Action**: ✅ Created `types/index.ts` with all shared types

---

### 2. Constants (NEW)

**Before**: Magic strings everywhere
```typescript
fetch('http://localhost:3001/api/auth/login')
throw new Error('Unauthorized')
```

**After**: Centralized constants
```typescript
// constants/index.ts
export const API_ENDPOINTS = {
  AUTH: { LOGIN: '/auth/login' }
};
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized'
};
```

**Action**: ✅ Created `constants/index.ts`

---

### 3. API Client

**Before**: `lib/api.ts` (single file)
```typescript
export const api = {
  async login(mobile, otp) {
    const response = await fetch(...)
    return response.json();
  }
};
```

**After**: Organized in `lib/api/`
```typescript
// lib/api/client.ts
export class ApiClient {
  async request<T>() { ... }
}

// lib/api/index.ts
export const api = {
  async login() { return apiClient.post(...) }
};
```

**Action**: ✅ Refactored into `lib/api/` directory

---

### 4. Backend Routes

**Before**: `server/routes/auth.ts`
```typescript
// Business logic mixed with routes
router.post('/login', async (req, res) => {
  const { mobileNumber, otp } = req.body;
  
  // Validation here
  if (!mobileNumber) {
    return res.status(400).json({ error: '...' });
  }
  
  // Business logic here
  let user = storage.getUserByMobile(mobileNumber);
  if (!user) {
    user = storage.createUser(...);
  }
  
  // Token generation here
  const token = jwt.sign(...);
  
  res.json({ user, token });
});
```

**After**: Separated layers
```typescript
// server/routes/auth.routes.ts
router.post('/login', validate(loginSchema), authController.login);

// server/controllers/auth.controller.ts
async login(req, res, next) {
  const result = await authService.login(req.body);
  res.json(result);
}

// server/services/auth.service.ts
async login(data) {
  // Business logic
  let user = storage.getUserByMobile(data.mobileNumber);
  // ...
  return { user, token };
}
```

**Action**: 
- ✅ Created `server/controllers/`
- ✅ Created `server/services/`
- ✅ Updated `server/routes/`

---

### 5. Validation (NEW)

**Before**: Manual validation in routes
```typescript
if (!mobileNumber) {
  return res.status(400).json({ error: 'Required' });
}
if (otp.length !== 6) {
  return res.status(400).json({ error: 'Invalid OTP' });
}
```

**After**: Zod schemas
```typescript
// server/validators/auth.validator.ts
export const loginSchema = z.object({
  body: z.object({
    mobileNumber: z.string().min(10),
    otp: z.string().length(6),
  }),
});

// server/routes/auth.routes.ts
router.post('/login', validate(loginSchema), authController.login);
```

**Action**: ✅ Created `server/validators/`

---

### 6. Error Handling (NEW)

**Before**: Generic errors
```typescript
throw new Error('Something went wrong');
res.status(500).json({ error: 'Error' });
```

**After**: Custom error classes
```typescript
// server/utils/errors.ts
throw new UnauthorizedError('Invalid token');
throw new ValidationError('Invalid input');

// server/middleware/errorHandler.ts
if (err instanceof AppError) {
  res.status(err.statusCode).json({ error: err.message });
}
```

**Action**: ✅ Created `server/utils/errors.ts`

---

### 7. Configuration (NEW)

**Before**: Environment variables used directly
```typescript
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
```

**After**: Centralized config
```typescript
// server/config/index.ts
export const config = {
  port: parseInt(process.env.PORT || '3001'),
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: '7d',
  },
};

// Usage
import config from './config';
app.listen(config.port);
```

**Action**: ✅ Created `server/config/index.ts`

---

### 8. Custom Hooks (NEW)

**Before**: Logic repeated in components
```typescript
// In login page
const [user, setUser] = useState();
const login = async () => {
  const response = await api.login(...);
  setUser(response.user);
};

// In profile page
const [user, setUser] = useState();
useEffect(() => {
  // Load user again
}, []);
```

**After**: Reusable hooks
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState();
  const login = async () => { ... };
  return { user, login };
};

// In any component
const { user, login } = useAuth();
```

**Action**: ✅ Created `hooks/useAuth.ts`, `hooks/useLocation.ts`

---

## 🎯 Key Benefits

### 1. **Type Safety**
- ✅ Shared types prevent frontend/backend mismatches
- ✅ Better IDE autocomplete
- ✅ Catch errors at compile time

### 2. **Maintainability**
- ✅ Easy to find code (clear structure)
- ✅ Single Responsibility Principle
- ✅ Easy to modify without breaking other parts

### 3. **Scalability**
- ✅ Easy to add new features
- ✅ Services can be split into microservices
- ✅ Clear dependencies

### 4. **Testability**
- ✅ Services can be tested independently
- ✅ Mock dependencies easily
- ✅ Clear interfaces

### 5. **Developer Experience**
- ✅ Less boilerplate
- ✅ Reusable hooks
- ✅ Consistent patterns

## 📝 Code Comparison

### Example: User Profile Update

#### Before ❌
```typescript
// app/profile/page.tsx
const handleUpdate = async () => {
  const response = await fetch('http://localhost:3001/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ birthDate, age, gender })
  });
  
  if (!response.ok) {
    setError('Failed to update');
    return;
  }
  
  const data = await response.json();
  setSuccess('Updated!');
};
```

#### After ✅
```typescript
// app/profile/page.tsx
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { user } = useAuth();

const handleUpdate = async () => {
  try {
    await api.updateProfile(token, { birthDate, age, gender });
    setSuccess(SUCCESS_MESSAGES.PROFILE_UPDATED);
  } catch (error) {
    setError(ERROR_MESSAGES.SERVER_ERROR);
  }
};
```

**Improvements**:
- ✅ Type-safe API calls
- ✅ Centralized error messages
- ✅ Less boilerplate
- ✅ Easier to test

---

## 🔄 Migration Steps (If Starting From Old Code)

### Step 1: Add Types
```bash
# Create types directory
mkdir types
```

Move all interfaces to `types/index.ts`

### Step 2: Add Constants
```bash
# Create constants directory
mkdir constants
```

Create `constants/index.ts` with API endpoints, messages, etc.

### Step 3: Refactor Backend
```bash
# Create new directories
mkdir server/config
mkdir server/controllers
mkdir server/services
mkdir server/models
mkdir server/validators
```

Move code:
- Configuration → `server/config/`
- Route handlers → `server/controllers/`
- Business logic → `server/services/`
- Data access → `server/models/`
- Create validators in `server/validators/`

### Step 4: Add Custom Hooks
```bash
# Create hooks directory
mkdir hooks
```

Create `hooks/useAuth.ts` and `hooks/useLocation.ts`

### Step 5: Refactor API Client
```bash
# Reorganize lib
mkdir lib/api
```

Create `lib/api/client.ts` and `lib/api/index.ts`

### Step 6: Update Imports
Update all imports to use new paths:
```typescript
// Old
import { User } from '../types';

// New
import { User } from '@/types';
```

### Step 7: Test Everything
```bash
npm run dev
# Test all features
```

---

## ✅ Checklist

After migration, verify:

- [ ] All types in `types/index.ts`
- [ ] All constants in `constants/index.ts`
- [ ] Backend split into controllers/services/models
- [ ] Validation using Zod schemas
- [ ] Custom error classes
- [ ] API client refactored
- [ ] Custom hooks created
- [ ] No linter errors
- [ ] All features working
- [ ] Tests passing (if any)

---

## 🆘 Troubleshooting

### Import Errors
```typescript
// Error: Cannot find module '@/types'

// Fix: Check tsconfig.json paths
"paths": {
  "@/*": ["./*"],
  "@/types": ["./types"]
}
```

### Type Errors
```typescript
// Error: Type mismatch

// Fix: Use shared types from types/
import { User } from '@/types';
```

### Runtime Errors
```typescript
// Error: Module not found

// Fix: Restart dev server
npm run dev
```

---

## 📚 Next Steps

1. Read [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Follow examples for adding features
4. Join community discussions

---

**Migration Complete! 🎉**

Your codebase is now:
- ✅ More maintainable
- ✅ More scalable
- ✅ More type-safe
- ✅ More testable
- ✅ Better organized



