# Google OAuth Integration Guide

## 📋 Overview

This guide covers the complete Google OAuth implementation in the blog application, which allows users to sign in using their Google accounts while maintaining the existing traditional authentication system.


### Run Commands
```bash
# Frontend
npm run dev
# Backend
npm run server
```

## 🚀 Features Implemented

### ✅ Core Features
- **Google OAuth Login** - Users can sign in with Google
- **Traditional Auth Preserved** - Existing login/signup still works
- **JWT Token Management** - Access & refresh token system
- **JWT Decoding & Logging** - Debug information in console
- **User Profile Integration** - Google profile pictures and info
- **Automatic Token Refresh** - Enhanced security with token rotation

### ✅ Security Features
- **Access Tokens** (15-minute expiry) - Short-lived for API calls
- **Refresh Tokens** (7-day expiry) - Long-lived for token renewal
- **Automatic Token Rotation** - Refreshes every 14 minutes
- **HTTP-Only Cookies** - Secure token storage
- **CSRF Protection** - SameSite cookie configuration

## 🏗️ Architecture

### Backend Structure
```
backend/
├── src/
│   ├── controllers/
│   │   └── auth.ts                 # Google OAuth & refresh token logic
│   ├── routes/
│   │   └── auth.ts                 # OAuth routes
│   ├── utils/
│   │   ├── generateJwtToken.ts     # Original JWT generation
│   │   └── tokenUtils.ts           # New token pair generation
│   └── types/
│       └── user.d.ts               # Updated user interface
└── prisma/
    └── schema.prisma               # Updated User model
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/
│   │   └── GoogleOAuthProvider.tsx # OAuth provider wrapper
│   ├── features/auth/
│   │   ├── api/
│   │   │   └── googleLogin.ts      # Google login API call
│   │   ├── components/
│   │   │   ├── GoogleLoginButton.tsx # OAuth button component
│   │   │   ├── LoginForm.tsx       # Updated with Google button
│   │   │   └── SignupForm.tsx      # Updated with Google button
│   │   └── hooks/
│   │       └── useTokenRefresh.ts  # Automatic token refresh
│   └── App.tsx                     # Wrapped with OAuth provider
```

## 🔧 Setup Instructions

### 1. Environment Variables

**Backend (.env)**
```bash
# Google OAuth Configuration
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# JWT Secret (keep secure)
TOKEN_SECRET=your_jwt_secret_key

# Database
DATABASE_URL=your_database_connection_string
```

### 2. Google Cloud Console Setup

1. **Create/Select Project** in [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable Google+ API** and **Google Identity API**
3. **Create OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173` (development)
   - Authorized redirect URIs: `http://localhost:5173` (development)
4. **Copy Client ID** and **Client Secret** to environment variables

### 3. Database Migration

The User model has been updated to support Google OAuth:

```prisma
model User {
  id          String    @id @default(cuid())
  username    String    @unique
  password    String?                    # Now optional for Google users
  bio         String?   @db.Char(120)
  avatar      String?
  fullName    String
  email       String?   @unique         # New: Google email
  googleId    String?   @unique         # New: Google user ID
  isGoogleUser Boolean   @default(false) # New: Google user flag
  posts       Post[]
  likes       Like[]
  comments    Comment[]
}
```

**Apply the migration:**
```bash
cd backend
npx prisma generate
npx prisma db push
```

## 📚 API Documentation

### Google OAuth Endpoints

#### POST `/auth/google-login`
Authenticates user with Google OAuth token.

**Request Body:**
```json
{
  "credential": "google_jwt_token_here"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "username": "user@gmail.com",
    "fullName": "User Name",
    "email": "user@gmail.com",
    "avatar": "https://google-profile-pic-url",
    "bio": "",
    "googleId": "google_user_id",
    "isGoogleUser": true
  }
}
```

#### POST `/auth/refresh-token`
Refreshes the access token using refresh token from cookie.

**Response:**
```json
{
  "accessToken": "new_access_token",
  "user": {
    // user object
  }
}
```

## 🎯 Usage Examples

### Frontend Integration

#### 1. Using Google Login Button
```tsx
import { GoogleLoginButton } from '../components/GoogleLoginButton';

const LoginPage = () => {
  return (
    <div>
      {/* Traditional login form */}
      <LoginForm />
      
      {/* Google OAuth button */}
      <GoogleLoginButton />
    </div>
  );
};
```

#### 2. JWT Decoding Example
```typescript
import { jwtDecode } from "jwt-decode";

// Decode Google JWT for debugging
const decoded = jwtDecode<GoogleJWTPayload>(credential);
console.log("Google User Info:", {
  userId: decoded.sub,
  email: decoded.email,
  name: decoded.name,
  picture: decoded.picture
});
```

#### 3. Token Refresh Hook
```tsx
import { useTokenRefresh } from '../hooks/useTokenRefresh';

const App = () => {
  // Automatically refresh tokens
  useTokenRefresh();
  
  return <AppContent />;
};
```

## 🔒 Security Best Practices

### 1. Token Management
- **Access tokens** expire in 15 minutes
- **Refresh tokens** expire in 7 days
- Tokens automatically refresh every 14 minutes
- HTTP-only cookies prevent XSS attacks

### 2. Environment Security
- Keep `AUTH_GOOGLE_SECRET` secure and never expose it
- Use different Google OAuth credentials for production
- Rotate `TOKEN_SECRET` regularly

### 3. CORS Configuration
```javascript
// Ensure CORS is properly configured
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true // Required for cookies
}));
```

## 🧪 Testing Guide

### 1. Console Debugging
When testing Google OAuth, check browser console for:
```
✅ Google login credential received: [JWT_TOKEN]
✅ Decoded Google JWT: {userId, email, name, picture}
✅ Google login successful: {user_object}
```

### 2. Database Verification
Check that Google users are created with:
- `email` field populated
- `googleId` field populated
- `isGoogleUser` set to `true`
- `password` field as `null`

### 3. Token Flow Testing
1. Login with Google
2. Wait 14+ minutes
3. Verify token refresh happens automatically
4. Check console for refresh messages

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid Google token" Error
**Cause:** Google Client ID mismatch
**Solution:** Verify `AUTH_GOOGLE_ID` matches Google Cloud Console

#### 2. Database Connection Issues
**Cause:** Prisma schema not applied
**Solution:**
```bash
npx prisma generate
npx prisma db push --force-reset
```

#### 3. CORS Errors
**Cause:** Frontend origin not allowed
**Solution:** Add your frontend URL to Google OAuth authorized origins

#### 4. Token Refresh Fails
**Cause:** Cookie not being sent
**Solution:** Ensure `credentials: true` in API calls

### Debug Commands
```bash
# Check Prisma connection
npx prisma studio

# View database schema
npx prisma db pull

# Reset database (development only)
npx prisma db push --force-reset
```

## 📈 Performance Considerations

### 1. Token Refresh Optimization
- Refresh happens every 14 minutes (1 minute before expiry)
- Only refreshes when user is active
- Automatic cleanup on logout

### 2. Database Queries
- Google users are identified by `googleId` or `email`
- Indexed fields for faster lookups
- Minimal user data fetching

## 🔮 Future Enhancements

### Potential Improvements
1. **Multiple OAuth Providers** - Add Facebook, GitHub, etc.
2. **Account Linking** - Link Google account to existing traditional account
3. **Profile Sync** - Periodic sync of Google profile data
4. **Advanced Scopes** - Request additional Google permissions
5. **SSO Integration** - Enterprise single sign-on

### Migration Path
If you need to add more OAuth providers:
1. Update User model with provider-specific fields
2. Create provider-specific controllers
3. Add provider buttons to UI
4. Update token refresh logic

## 📞 Support

### Logs to Check
- **Browser Console** - Frontend errors and JWT decoding
- **Backend Logs** - Authentication errors and token issues
- **Database Logs** - User creation and update issues

### Key Files to Review
- `backend/src/controllers/auth.ts` - OAuth logic
- `frontend/src/features/auth/api/googleLogin.ts` - Frontend OAuth
- `backend/prisma/schema.prisma` - Database schema
- `.env` - Environment configuration

---

## 🎉 Success Indicators

Your Google OAuth is working correctly when you see:
- ✅ Google login button appears on login/signup pages
- ✅ Console shows decoded JWT information
- ✅ User is created/logged in successfully
- ✅ Google profile picture is displayed
- ✅ Token refresh happens automatically
- ✅ Traditional auth still works alongside Google OAuth

**Congratulations! Your Google OAuth integration is complete and functional!** 🚀
