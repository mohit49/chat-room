# Optimized Project Structure

This document explains the improved project structure with modern best practices.

## 📁 Directory Structure

```
chat-app/
├── 📂 app/                          # Next.js App Router pages
│   ├── login/                       # Login page
│   ├── profile/                     # Profile management page
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page
│   └── globals.css                  # Global styles
│
├── 📂 components/                   # React components
│   └── ui/                          # Shadcn UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ...
│
├── 📂 hooks/                        # Custom React hooks
│   ├── useAuth.ts                   # Authentication hook
│   └── useLocation.ts               # Geolocation hook
│
├── 📂 lib/                          # Frontend utilities
│   ├── api/                         # API client layer
│   │   ├── client.ts                # Base API client
│   │   └── index.ts                 # API methods
│   ├── auth.ts                      # Auth utilities
│   └── utils.ts                     # General utilities
│
├── 📂 types/                        # Shared TypeScript types
│   └── index.ts                     # Type definitions
│
├── 📂 constants/                    # Application constants
│   └── index.ts                     # Enums, constants
│
├── 📂 server/                       # Backend (Express.js)
│   ├── config/                      # Configuration
│   │   └── index.ts                 # Environment config
│   │
│   ├── controllers/                 # Route controllers
│   │   ├── auth.controller.ts       # Auth controller
│   │   └── user.controller.ts       # User controller
│   │
│   ├── services/                    # Business logic
│   │   ├── auth.service.ts          # Auth service
│   │   └── user.service.ts          # User service
│   │
│   ├── models/                      # Data models
│   │   └── storage.model.ts         # In-memory storage
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── auth.ts                  # JWT authentication
│   │   ├── validate.ts              # Request validation
│   │   └── errorHandler.ts         # Error handling
│   │
│   ├── routes/                      # Route definitions
│   │   ├── auth.routes.ts           # Auth routes
│   │   └── user.routes.ts           # User routes
│   │
│   ├── validators/                  # Zod validation schemas
│   │   ├── auth.validator.ts        # Auth validators
│   │   └── user.validator.ts        # User validators
│   │
│   ├── utils/                       # Backend utilities
│   │   └── errors.ts                # Custom error classes
│   │
│   └── index.ts                     # Server entry point
│
├── 📂 public/                       # Static assets
│
├── 📄 .env.local                    # Local environment
├── 📄 .env.development              # Dev environment
├── 📄 .env.production               # Production environment
├── 📄 tsconfig.json                 # TypeScript config (frontend)
├── 📄 tsconfig.server.json          # TypeScript config (backend)
├── 📄 package.json                  # Dependencies
└── 📄 README.md                     # Documentation
```

## 🎯 Design Patterns & Principles

### 1. **Layered Architecture (Backend)**

```
Controllers → Services → Models
     ↓           ↓          ↓
  Routes    Business    Data Access
            Logic
```

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Data access and storage

### 2. **Separation of Concerns**

- **Frontend**: React components, hooks, utilities
- **Backend**: Express server with clear layers
- **Shared**: Types and constants used by both

### 3. **Dependency Injection**

Services are instantiated once and injected into controllers:

```typescript
// services/auth.service.ts
export const authService = new AuthService();

// controllers/auth.controller.ts
import { authService } from '../services/auth.service';
```

### 4. **Error Handling**

Centralized error handling with custom error classes:

```typescript
// Throw custom errors
throw new UnauthorizedError('Invalid token');

// Caught by error handler middleware
app.use(errorHandler);
```

### 5. **Validation Layer**

Request validation using Zod schemas:

```typescript
router.post('/login', validate(loginSchema), authController.login);
```

## 📋 Key Features

### ✅ Type Safety

- Shared types between frontend and backend
- Full TypeScript coverage
- Runtime validation with Zod

### ✅ Centralized Configuration

```typescript
// server/config/index.ts
export const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwt: { secret: process.env.JWT_SECRET },
  // ...
};
```

### ✅ Custom Hooks

```typescript
// hooks/useAuth.ts
const { user, login, logout, isAuthenticated } = useAuth();

// hooks/useLocation.ts
const { location, getCurrentLocation } = useLocation();
```

### ✅ API Client Layer

```typescript
// lib/api/client.ts
export class ApiClient {
  async get<T>(endpoint: string, token?: string): Promise<T>
  async post<T>(endpoint: string, data?: any, token?: string): Promise<T>
  // ...
}
```

### ✅ Constants Management

```typescript
// constants/index.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    // ...
  }
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Access denied',
  // ...
};
```

## 🔄 Request Flow

### Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend: useAuth hook calls api.login()
   ↓
3. API Client: Makes HTTP request
   ↓
4. Backend Route: /api/auth/login
   ↓
5. Middleware: Validates request (Zod)
   ↓
6. Controller: auth.controller.login()
   ↓
7. Service: authService.login()
   ↓
8. Model: storage.getUserByMobile()
   ↓
9. Service: Returns user + token
   ↓
10. Controller: Sets cookie, returns response
    ↓
11. Frontend: Stores token, updates state
```

## 🚀 Benefits

### 1. **Scalability**

- Easy to add new features
- Clear separation of concerns
- Modular structure

### 2. **Maintainability**

- Easy to locate code
- Clear responsibilities
- Consistent patterns

### 3. **Testability**

- Services can be tested independently
- Mock dependencies easily
- Clear interfaces

### 4. **Type Safety**

- Shared types prevent mismatches
- Compile-time error checking
- Better IDE support

### 5. **Error Handling**

- Consistent error responses
- Custom error classes
- Centralized handling

### 6. **Validation**

- Request validation at route level
- Type-safe validators
- Runtime checking

## 📝 Usage Examples

### Creating a New Feature

#### 1. Add Types

```typescript
// types/index.ts
export interface Message {
  id: string;
  content: string;
  senderId: string;
}
```

#### 2. Add Constants

```typescript
// constants/index.ts
export const API_ENDPOINTS = {
  // ...
  MESSAGES: {
    LIST: '/messages',
    SEND: '/messages/send',
  }
};
```

#### 3. Add Validator

```typescript
// server/validators/message.validator.ts
export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(1000),
    recipientId: z.string(),
  }),
});
```

#### 4. Add Service

```typescript
// server/services/message.service.ts
export class MessageService {
  async sendMessage(senderId: string, recipientId: string, content: string) {
    // Business logic
  }
}
```

#### 5. Add Controller

```typescript
// server/controllers/message.controller.ts
export class MessageController {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    // Handle request
  }
}
```

#### 6. Add Route

```typescript
// server/routes/message.routes.ts
router.post('/send', validate(sendMessageSchema), messageController.sendMessage);
```

#### 7. Add API Method

```typescript
// lib/api/index.ts
export const api = {
  // ...
  async sendMessage(token: string, data: SendMessageRequest) {
    return apiClient.post(API_ENDPOINTS.MESSAGES.SEND, data, token);
  }
};
```

#### 8. Create Hook (Optional)

```typescript
// hooks/useMessages.ts
export const useMessages = () => {
  // Custom hook logic
};
```

## 🔧 Migration Guide

If you have existing code:

1. **Types**: Move to `types/index.ts`
2. **Constants**: Move to `constants/index.ts`
3. **API calls**: Use `lib/api/index.ts`
4. **Auth logic**: Use `hooks/useAuth.ts`
5. **Server code**: Refactor into controllers/services

## 📚 Best Practices

1. **Always use shared types** from `types/`
2. **Use constants** instead of magic strings
3. **Validate all inputs** with Zod schemas
4. **Handle errors** with custom error classes
5. **Keep controllers thin** - business logic in services
6. **Use custom hooks** for reusable logic
7. **Centralize API calls** in `lib/api/`

## 🎓 Learning Resources

- **Layered Architecture**: [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- **TypeScript Best Practices**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- **Zod Validation**: [Zod Documentation](https://zod.dev/)
- **React Hooks**: [React Hooks API](https://react.dev/reference/react)
- **Express Best Practices**: [Express Guide](https://expressjs.com/en/advanced/best-practice-performance.html)

---

This structure is designed to grow with your application while maintaining code quality and developer experience! 🚀



