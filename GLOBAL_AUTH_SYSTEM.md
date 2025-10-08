# Global Authentication System

This document explains the centralized authentication system that automatically handles redirects throughout the app.

## 🎯 Overview

The Global Authentication System eliminates the need for manual redirect logic in individual pages. It automatically:
- Redirects unauthenticated users to `/login` when accessing protected routes
- Redirects authenticated users away from auth pages (like `/login`) to `/home`
- Handles root path (`/`) redirects based on authentication status

## 🏗️ Architecture

### Components

1. **`GlobalAuthChecker`** - The main component that wraps the entire app
2. **`AuthContext`** - Provides authentication state throughout the app
3. **`RouteConfig`** - Centralized configuration for route handling

### File Structure

```
components/auth/
├── GlobalAuthChecker.tsx    # Main authentication checker
├── AuthGuard.tsx           # Individual route guards (optional)
└── withAuth.tsx            # HOC wrappers (optional)

lib/config/
└── routes.ts               # Route configuration

lib/contexts/
└── AuthContext.tsx         # Authentication context
```

## 🚀 Usage

### 1. App-Level Setup

The `GlobalAuthChecker` is already integrated in `app/layout.tsx`:

```tsx
<AuthProvider>
  <GlobalAuthChecker>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </GlobalAuthChecker>
</AuthProvider>
```

### 2. Page Components

**No manual redirect logic needed!** Just create your page components normally:

```tsx
// ✅ Good - No redirect logic needed
export default function MyPage() {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      {/* Your content */}
    </div>
  );
}
```

**Avoid this pattern:**
```tsx
// ❌ Bad - Don't do this anymore
export default function MyPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login'); // ❌ GlobalAuthChecker handles this
    }
  }, [isAuthenticated]);
  
  return <div>Content</div>;
}
```

### 3. Route Configuration

Configure public routes in `lib/config/routes.ts`:

```typescript
export const ROUTE_CONFIG = {
  // Routes that don't require authentication
  PUBLIC_ROUTES: [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/',
  ],

  // Routes that redirect authenticated users away
  AUTH_REDIRECT_ROUTES: [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],

  // Default redirects
  DEFAULT_REDIRECTS: {
    AUTHENTICATED: '/home',
    UNAUTHENTICATED: '/login',
    ROOT: '/home',
  },
};
```

## 🔄 How It Works

### Authentication Flow

1. **User visits any page**
2. **GlobalAuthChecker checks authentication status**
3. **Based on route and auth status:**
   - If unauthenticated + protected route → Redirect to `/login`
   - If authenticated + auth page → Redirect to `/home`
   - If root path → Redirect based on auth status
   - Otherwise → Allow access

### Route Types

| Route Type | Description | Example |
|------------|-------------|---------|
| **Public** | No authentication required | `/login`, `/signup` |
| **Protected** | Authentication required | `/profile`, `/rooms` |
| **Auth Redirect** | Redirects authenticated users | `/login`, `/signup` |
| **Root** | Special handling for `/` | Redirects based on auth |

## 🛠️ Customization

### Adding New Public Routes

```typescript
// In lib/config/routes.ts
export const ROUTE_CONFIG = {
  PUBLIC_ROUTES: [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/', // Add new public routes here
    '/about',
    '/contact',
  ],
  // ... rest of config
};
```

### Changing Default Redirects

```typescript
// In lib/config/routes.ts
export const ROUTE_CONFIG = {
  DEFAULT_REDIRECTS: {
    AUTHENTICATED: '/dashboard', // Changed from '/home'
    UNAUTHENTICATED: '/login',
    ROOT: '/dashboard',
  },
};
```

### Adding Route-Specific Logic

If you need custom logic for specific routes, you can still use the individual `AuthGuard` components:

```tsx
import { ProtectedRoute } from '@/components/auth/AuthGuard';

export default function SpecialPage() {
  return (
    <ProtectedRoute redirectTo="/custom-login">
      <div>Special content</div>
    </ProtectedRoute>
  );
}
```

## 🐛 Debugging

The system includes comprehensive logging. Check the browser console for:

```
🔐 GlobalAuthChecker: {
  pathname: "/profile",
  isAuthenticated: true,
  loading: false,
  isPublic: false,
  isAuthRedirect: false
}
```

## ✅ Benefits

1. **Centralized Logic** - All redirect logic in one place
2. **No Duplication** - No need to add redirect logic to every page
3. **Consistent Behavior** - Same redirect logic across the entire app
4. **Easy Maintenance** - Change redirect logic in one place
5. **Type Safety** - TypeScript support for route configuration
6. **Performance** - Single authentication check per route change

## 🔧 Migration Guide

### Before (Manual Redirects)

```tsx
// ❌ Old way - Manual redirects in every page
export default function MyPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Redirecting...</div>;

  return <div>Content</div>;
}
```

### After (Global System)

```tsx
// ✅ New way - No redirect logic needed
export default function MyPage() {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      {/* Content */}
    </div>
  );
}
```

## 🎉 Result

- **Cleaner Code** - No more redirect logic in individual pages
- **Better UX** - Consistent redirect behavior
- **Easier Maintenance** - Single place to manage authentication logic
- **Type Safety** - TypeScript support throughout
- **Performance** - Optimized authentication checks
