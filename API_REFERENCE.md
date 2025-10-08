# API Reference

Complete API documentation for the chat app backend.

## Base URL

**Development**: `http://localhost:3001/api`  
**Production**: Update in environment variables

---

## Authentication Endpoints

### 1. Send OTP

Send OTP to a mobile number for authentication.

**Endpoint**: `POST /api/auth/send-otp`

**Request Body**:
```json
{
  "mobileNumber": "+1234567890"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "mockOTP": "123456"  // Only in development
}
```

**Response** (Error):
```json
{
  "error": "Mobile number is required"
}
```

---

### 2. Login

Authenticate user with mobile number and OTP.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "mobileNumber": "+1234567890",
  "otp": "123456"
}
```

**Response** (Success):
```json
{
  "success": true,
  "user": {
    "id": "user_1234567890_abc123",
    "mobileNumber": "+1234567890",
    "profile": {
      "birthDate": "",
      "age": 0,
      "gender": "",
      "location": {
        "latitude": 0,
        "longitude": 0,
        "address": ""
      }
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (Error):
```json
{
  "error": "Mobile number is required"
}
```

**Notes**:
- Sets HTTP-only cookie with JWT token
- Returns token in response body for localStorage
- Token expires in 7 days

---

### 3. Logout

Log out the current user.

**Endpoint**: `POST /api/auth/logout`

**Headers**: None required

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Notes**:
- Clears the authentication cookie

---

## User Management Endpoints

All user endpoints require authentication.

**Authentication Header**:
```
Authorization: Bearer <token>
```

Or use cookies (automatically sent by browser).

---

### 1. Get Profile

Get current user's profile information.

**Endpoint**: `GET /api/user/profile`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (Success):
```json
{
  "success": true,
  "user": {
    "id": "user_1234567890_abc123",
    "mobileNumber": "+1234567890",
    "profile": {
      "birthDate": "1990-01-01",
      "age": 34,
      "gender": "male",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address": "San Francisco, CA"
      }
    }
  }
}
```

**Response** (Error - Unauthorized):
```json
{
  "error": "Access denied. No token provided."
}
```

**Response** (Error - Not Found):
```json
{
  "error": "User not found"
}
```

---

### 2. Update Profile

Update user's personal information.

**Endpoint**: `PUT /api/user/profile`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "birthDate": "1990-01-01",
  "age": 34,
  "gender": "male"
}
```

**Notes**:
- All fields are optional
- Only provided fields will be updated

**Response** (Success):
```json
{
  "success": true,
  "user": {
    "id": "user_1234567890_abc123",
    "mobileNumber": "+1234567890",
    "profile": {
      "birthDate": "1990-01-01",
      "age": 34,
      "gender": "male",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address": "San Francisco, CA"
      }
    }
  }
}
```

---

### 3. Update Location

Update user's location information.

**Endpoint**: `PUT /api/user/location`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "address": "San Francisco, CA"
}
```

**Notes**:
- All fields are optional
- Only provided fields will be updated

**Response** (Success):
```json
{
  "success": true,
  "user": {
    "id": "user_1234567890_abc123",
    "mobileNumber": "+1234567890",
    "profile": {
      "birthDate": "1990-01-01",
      "age": 34,
      "gender": "male",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address": "San Francisco, CA"
      }
    }
  }
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - No token provided |
| 403 | Forbidden - Invalid or expired token |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## Data Models

### User

```typescript
interface User {
  id: string;
  mobileNumber: string;
  profile: {
    birthDate: string;
    age: number;
    gender: 'male' | 'female' | 'other' | '';
    location: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Authentication Flow

```
1. User enters mobile number
   ↓
2. Frontend calls /api/auth/send-otp
   ↓
3. Backend sends OTP (mocked in dev)
   ↓
4. User enters OTP
   ↓
5. Frontend calls /api/auth/login
   ↓
6. Backend verifies OTP and creates/finds user
   ↓
7. Backend generates JWT token
   ↓
8. Backend sets HTTP-only cookie and returns token
   ↓
9. Frontend stores token in localStorage
   ↓
10. All subsequent requests include token
```

---

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (development)

Update CORS settings in `server/index.ts` for production.

---

## Rate Limiting

⚠️ **Not implemented yet**

For production, implement rate limiting to prevent abuse:
- Login attempts: 5 per 15 minutes
- OTP requests: 3 per hour per number
- Profile updates: 10 per minute

---

## Testing with cURL

### Send OTP
```bash
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+1234567890"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"mobileNumber": "+1234567890", "otp": "123456"}'
```

### Get Profile
```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer <your-token>" \
  -b cookies.txt
```

### Update Profile
```bash
curl -X PUT http://localhost:3001/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -b cookies.txt \
  -d '{"birthDate": "1990-01-01", "age": 34, "gender": "male"}'
```

---

## Security Notes

🔒 **Important for Production**:

1. **JWT Secret**: Use a strong, random 64+ character secret
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiry**: Consider shorter expiry times (e.g., 24 hours)
4. **Refresh Tokens**: Implement refresh token mechanism
5. **Input Validation**: Add comprehensive validation
6. **Rate Limiting**: Implement rate limiting on all endpoints
7. **OTP Verification**: Integrate real SMS service
8. **Database**: Replace in-memory storage with persistent database

---

## Frontend Integration

The API client is available at `lib/api.ts`:

```typescript
import { api } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

// Send OTP
const response = await api.sendOTP(mobileNumber);

// Login
const response = await api.login(mobileNumber, otp);

// Get Profile
const token = getAuthToken();
const response = await api.getProfile(token);

// Update Profile
const response = await api.updateProfile(token, {
  birthDate: '1990-01-01',
  age: 34,
  gender: 'male'
});

// Update Location
const response = await api.updateLocation(token, {
  latitude: 37.7749,
  longitude: -122.4194,
  address: 'San Francisco, CA'
});
```



