# 🎯 Quick Reference - Testing Your App

## 🌐 URLs

**Frontend:** http://localhost:5173
**Backend:** http://localhost:5000
**Health Check:** http://localhost:5000/health

---

## 📝 Test User Credentials

Create a test account with:
```
Email: test@company.com
Password: Test@1234
Company: TestCorp
Industry: Technology
Size: 11-50
```

---

## 🔄 Complete Test Flow (5 Minutes)

### **1. SIGNUP (Browser)**
→ Go to: http://localhost:5173/signup
→ Fill form with test credentials
→ Click "Create Account"
→ ✅ Should show success message

### **2. CHECK EMAIL (Mailtrap)**
→ Open Mailtrap.io inbox
→ ✅ Should see verification email
→ Copy the token from email or backend console

### **3. VERIFY EMAIL (Thunder Client)**
```
POST http://localhost:5000/api/auth/verify-email

{
  "token": "paste-token-here"
}
```
→ ✅ Should return success

### **4. LOGIN (Browser)**
→ Go to: http://localhost:5173/login
→ Enter email and password
→ Click "Authorize Access"
→ ✅ Should redirect to dashboard

### **5. CHECK DASHBOARD (Browser)**
→ Should see dashboard with sidebar
→ ✅ Logged in successfully!

---

## 🛠️ Quick Fixes

### **Backend Not Running:**
```bash
cd backend
node server.js
```

### **Frontend Not Running:**
```bash
cd frontend
npm run dev
```

### **Clear Test Data:**
```bash
cd backend
node clearUsers.js
```

### **Check if Servers Running:**
- Backend: http://localhost:5000/health
- Frontend: http://localhost:5173

---

## 🎨 What You Should See

### **Login Page:**
- Email and password fields
- "Remember me" checkbox
- "Forgot Password?" link
- Blue "Authorize Access" button

### **Signup Page:**
- Step 1: Email & password
- Step 2: Company details
- Password strength indicator
- "Create Account" button

### **Dashboard:**
- Left sidebar with navigation
- Top bar with user info
- Main content area
- All navigation links working

---

## ✅ Success Indicators

**Frontend:**
- ✅ Toast notifications appear
- ✅ Forms submit without errors
- ✅ Redirects work properly
- ✅ Loading spinners show during API calls

**Backend:**
- ✅ Console shows "Server running on port 5000"
- ✅ Console shows "Connected to MongoDB"
- ✅ Email logs appear (📧 emoji)

**Mailtrap:**
- ✅ Verification email received
- ✅ Password reset email received

**LocalStorage (DevTools → Application):**
- ✅ `authToken`: JWT token exists
- ✅ `user`: User data exists

---

## 🐛 Common Errors & Quick Fixes

| Error | Fix |
|-------|-----|
| "Route not found" | Add `/api/` prefix to URL |
| "Invalid credentials" | Check email is verified first |
| "CORS error" | Backend already configured, restart servers |
| "Network error" | Check if backend is running on port 5000 |
| No email in Mailtrap | Check EMAIL_USER and EMAIL_PASSWORD in backend/.env |
| Dashboard redirects to login | Clear localStorage and login again |

---

## 📞 Key API Endpoints

```
POST /api/auth/signup        → Create account
POST /api/auth/verify-email  → Verify email
POST /api/auth/login         → Login
GET  /api/auth/me            → Get current user (protected)
POST /api/auth/forgot-password → Request password reset
POST /api/auth/reset-password/:token → Reset password
POST /api/auth/logout        → Logout (protected)
```

---

## 🎓 What Everything Does

**Backend (Node.js):**
- Handles all business logic
- Talks to MongoDB database
- Generates JWT tokens
- Sends emails via Mailtrap
- Validates data

**Frontend (React):**
- Shows UI to users
- Handles user input
- Calls backend APIs
- Stores JWT token
- Protects routes

**MongoDB:**
- Stores user data
- Passwords are hashed (encrypted)
- Email tokens stored temporarily

**JWT Token:**
- Proves user is logged in
- Valid for 7 days
- Sent with every protected request
- Format: "Bearer eyJhbGc..."

**Mailtrap:**
- Testing email service
- Catches all outgoing emails
- Safe for development
- No real emails sent

---

## 🚀 Ready to Test!

1. ✅ Backend running: http://localhost:5000
2. ✅ Frontend running: http://localhost:5173
3. ✅ MongoDB connected
4. ✅ Mailtrap configured

**Start here:** http://localhost:5173/signup

**Having issues?** Check:
1. Both servers running?
2. MongoDB installed and running?
3. Mailtrap credentials correct?
4. Console errors?

---

## 📚 Full Guides

- **Complete Testing:** See `INTEGRATION_TESTING.md`
- **Backend Testing:** See `TESTING_GUIDE.md`
- **Troubleshooting:** Check console logs first

---

**Everything is integrated and ready! Just test the signup flow now!** 🎉
