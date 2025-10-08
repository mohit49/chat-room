# Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js 15 App                                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Pages     │  │  Components│  │   Hooks    │    │  │
│  │  │  (app/)    │  │  (Shadcn)  │  │  useAuth   │    │  │
│  │  └─────┬──────┘  └────────────┘  └─────┬──────┘    │  │
│  │        │                                 │           │  │
│  │  ┌─────▼─────────────────────────────────▼──────┐   │  │
│  │  │      API Client (lib/api/)                   │   │  │
│  │  │  - HTTP methods                              │   │  │
│  │  │  - Error handling                            │   │  │
│  │  │  - Token management                          │   │  │
│  │  └──────────────────────┬───────────────────────┘   │  │
│  └───────────────────────────┼───────────────────────────┘  │
└────────────────────────────┼─────────────────────────────┘
                             │ HTTP/JSON
                             │ REST API
┌────────────────────────────▼─────────────────────────────┐
│                         BACKEND                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Express.js Server                                    ││
│  │  ┌────────────────────────────────────────────────┐  ││
│  │  │           Routes (routes/)                     │  ││
│  │  │  /api/auth/*    /api/user/*                   │  ││
│  │  └────────┬────────────────────────────────────────┘  ││
│  │           │                                            ││
│  │  ┌────────▼────────────────────────────────────────┐  ││
│  │  │      Middleware                                 │  ││
│  │  │  - Authentication (JWT)                        │  ││
│  │  │  - Validation (Zod)                            │  ││
│  │  │  - Error Handler                               │  ││
│  │  └────────┬────────────────────────────────────────┘  ││
│  │           │                                            ││
│  │  ┌────────▼────────────────────────────────────────┐  ││
│  │  │      Controllers (controllers/)                 │  ││
│  │  │  - authController                              │  ││
│  │  │  - userController                              │  ││
│  │  └────────┬────────────────────────────────────────┘  ││
│  │           │                                            ││
│  │  ┌────────▼────────────────────────────────────────┐  ││
│  │  │       Services (services/)                      │  ││
│  │  │  - Business Logic                              │  ││
│  │  │  - authService                                 │  ││
│  │  │  - userService                                 │  ││
│  │  └────────┬────────────────────────────────────────┘  ││
│  │           │                                            ││
│  │  ┌────────▼────────────────────────────────────────┐  ││
│  │  │       Models (models/)                          │  ││
│  │  │  - Data Access                                 │  ││
│  │  │  - storage (in-memory)                         │  ││
│  │  └────────┬────────────────────────────────────────┘  ││
│  └───────────┼────────────────────────────────────────┘│
└──────────────┼──────────────────────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │   Database   │
        │  (Future)    │
        └──────────────┘
```

## 🔄 Request Flow

### Authentication Flow

```
┌──────────┐
│  Browser │
└────┬─────┘
     │ 1. User enters mobile number
     │
     ▼
┌──────────────────┐
│  Login Page      │
│  (app/login)     │
└────┬─────────────┘
     │ 2. Call useAuth.login()
     │
     ▼
┌──────────────────┐
│  useAuth Hook    │
│  (hooks/)        │
└────┬─────────────┘
     │ 3. Call api.login()
     │
     ▼
┌──────────────────┐
│  API Client      │
│  (lib/api/)      │
└────┬─────────────┘
     │ 4. POST /api/auth/login
     │    { mobileNumber, otp }
     │
     ▼
┌──────────────────┐
│  Auth Route      │
│  (routes/)       │
└────┬─────────────┘
     │ 5. Pass through middleware
     │
     ▼
┌──────────────────┐
│  Validator       │
│  (Zod schema)    │
└────┬─────────────┘
     │ 6. Validate input
     │
     ▼
┌──────────────────┐
│  Auth Controller │
│  (controllers/)  │
└────┬─────────────┘
     │ 7. Call authService.login()
     │
     ▼
┌──────────────────┐
│  Auth Service    │
│  (services/)     │
└────┬─────────────┘
     │ 8. Verify OTP
     │ 9. Get/Create user
     │
     ▼
┌──────────────────┐
│  Storage Model   │
│  (models/)       │
└────┬─────────────┘
     │ 10. Return user data
     │
     ▼
┌──────────────────┐
│  Auth Service    │
└────┬─────────────┘
     │ 11. Generate JWT
     │
     ▼
┌──────────────────┐
│  Auth Controller │
└────┬─────────────┘
     │ 12. Set cookie
     │ 13. Return { user, token }
     │
     ▼
┌──────────────────┐
│  API Client      │
└────┬─────────────┘
     │ 14. Handle response
     │
     ▼
┌──────────────────┐
│  useAuth Hook    │
└────┬─────────────┘
     │ 15. Store token
     │ 16. Update state
     │
     ▼
┌──────────────────┐
│  Navigate to     │
│  Profile Page    │
└──────────────────┘
```

## 📦 Module Dependencies

### Frontend Dependencies

```
app/
  ├── Uses: hooks/, lib/api/, components/
  └── Imports: types/, constants/

hooks/
  ├── Uses: lib/api/, lib/auth
  └── Imports: types/

lib/api/
  ├── Uses: lib/api/client
  └── Imports: types/, constants/

components/
  └── Imports: constants/
```

### Backend Dependencies

```
server/index.ts
  └── Uses: routes/, middleware/, config/

routes/
  ├── Uses: controllers/, middleware/, validators/
  └── Clean separation

controllers/
  ├── Uses: services/
  └── Imports: types/, validators/

services/
  ├── Uses: models/
  └── Imports: types/, utils/errors

models/
  └── Imports: types/

validators/
  └── Imports: zod
```

## 🎯 Design Patterns

### 1. **Dependency Injection**

```typescript
// Service is created once
export const authService = new AuthService();

// Injected into controller
import { authService } from '../services/auth.service';

export class AuthController {
  async login() {
    const result = await authService.login();
    // ...
  }
}
```

### 2. **Repository Pattern**

```typescript
// Model layer abstracts data access
class StorageModel {
  getUserById(id: string): User | undefined { }
  createUser(data: CreateUserData): User { }
  updateUser(id: string, data: UpdateData): User { }
}

// Service uses the repository
class UserService {
  getUser(id: string): User {
    return storage.getUserById(id);
  }
}
```

### 3. **Middleware Chain**

```typescript
// Request flows through middleware
router.post(
  '/login',
  validate(loginSchema),      // 1. Validate
  authController.login        // 2. Handle
);

// Error handling middleware at the end
app.use(errorHandler);
```

### 4. **Custom Error Classes**

```typescript
// Throw specific errors
throw new UnauthorizedError('Invalid token');

// Caught by error handler
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
  }
};
```

### 5. **Factory Pattern**

```typescript
// API Client factory
class ApiClient {
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Common logic
  }
}

export const apiClient = new ApiClient(API_URL);
```

## 🔐 Security Architecture

### Authentication Flow

```
┌────────────┐
│   Client   │
└──────┬─────┘
       │ 1. Login request
       │    { mobileNumber, otp }
       ▼
┌────────────────┐
│  Auth Service  │
│  - Verify OTP  │
│  - Get user    │
└──────┬─────────┘
       │ 2. Generate JWT
       │    { userId }
       ▼
┌────────────────┐
│  JWT signed    │
│  with secret   │
└──────┬─────────┘
       │ 3. Return token
       │    Set cookie
       ▼
┌────────────────┐
│  Client stores │
│  - Cookie      │
│  - LocalStorage│
└──────┬─────────┘
       │ 4. Future requests
       │    Include token
       ▼
┌────────────────┐
│  Auth Middleware│
│  - Verify JWT   │
│  - Extract user │
└──────┬──────────┘
       │ 5. req.userId set
       │
       ▼
┌────────────────┐
│  Protected     │
│  Route Handler │
└────────────────┘
```

### Validation Flow

```
Request → Zod Schema → Parsed Data → Controller
                ↓
            Validation Error
                ↓
            Error Handler
                ↓
        Client (422 error)
```

## 📊 Data Flow

### State Management

```typescript
// Frontend state flow
User Input → Component State → API Call → Response
                                              ↓
                                        Update State
                                              ↓
                                         Re-render
```

### Backend data flow

```typescript
Request → Controller → Service → Model → Database
                                           ↓
Response ← Controller ← Service ← Model ← Data
```

## 🧩 Extensibility Points

### Adding New Entities

1. **Define Types** (`types/`)
2. **Add Constants** (`constants/`)
3. **Create Validator** (`server/validators/`)
4. **Create Model** (`server/models/`)
5. **Create Service** (`server/services/`)
6. **Create Controller** (`server/controllers/`)
7. **Define Routes** (`server/routes/`)
8. **Add API Methods** (`lib/api/`)
9. **Create Hooks** (`hooks/`) - optional

### Adding Middleware

```typescript
// server/middleware/logger.ts
export const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

// server/index.ts
app.use(logger);
```

### Adding Custom Hooks

```typescript
// hooks/useCustomHook.ts
export const useCustomHook = () => {
  const [state, setState] = useState();
  
  // Custom logic
  
  return { state, actions };
};
```

## 🎨 Code Organization Principles

### 1. **Single Responsibility**
Each module has one clear purpose

### 2. **Separation of Concerns**
Frontend, backend, shared code separated

### 3. **DRY (Don't Repeat Yourself)**
Shared types, constants, utilities

### 4. **SOLID Principles**
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### 5. **Convention over Configuration**
Clear naming, structure conventions

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless services
- JWT tokens (no session storage)
- Separate frontend/backend

### Vertical Scaling
- Modular architecture
- Easy to add features
- Clear dependencies

### Future Improvements
- Add Redis for caching
- Add message queue
- Add database connection pool
- Add load balancer
- Add CDN for static assets

---

This architecture is designed for:
- ✅ Maintainability
- ✅ Scalability
- ✅ Testability
- ✅ Type Safety
- ✅ Developer Experience



