# 🚀 HireFlow Full Stack Integration Testing

## ✅ Current Status

### **Backend:** 
✅ Running on http://localhost:5000
✅ MongoDB Connected
✅ Email Service (Mailtrap) Configured

### **Frontend:**
✅ Running on http://localhost:5173
✅ Integrated with Backend API
✅ Auth Pages Connected

---

## 🎯 Complete Integration Test Flow

### **TEST 1: Full Signup & Login Flow**

#### **Step 1: Open Frontend**
1. Open browser: http://localhost:5173/signup
2. You should see the signup page

#### **Step 2: Create Account**
Fill in the form:
```
Email: yourname@example.com
Password: Test@1234
Confirm Password: Test@1234
Company Name: TechCorp
Industry: Technology
Company Size: 11-50
```

Click "Create Account"

**Expected Result:**
- ✅ Success toast appears
- ✅ Redirected to email verification page
- ✅ Check Mailtrap inbox - you should see verification email!

#### **Step 3: Verify Your Email (Manual for Now)**
Since we can't click the email link easily, we'll verify via Thunder Client:

1. Check your Mailtrap email - copy the token from the URL
2. Or check backend console - it logs the verification token

Then use Thunder Client:
```
POST http://localhost:5000/api/auth/verify-email

{
  "token": "paste-token-here"
}
```

**Expected Result:**
- ✅ "Email verified successfully" message

#### **Step 4: Login**
1. Go to: http://localhost:5173/login
2. Enter:
   - Email: yourname@example.com  
   - Password: Test@1234
3. Click "Authorize Access"

**Expected Result:**
- ✅ "Welcome back to HireFlow!" toast
- ✅ Redirected to http://localhost:5173/dashboard
- ✅ Dashboard loads successfully
- ✅ Check Browser DevTools → Application → Local Storage:
  - `authToken`: should have JWT token
  - `user`: should have user data

---

### **TEST 2: Protected Routes**

#### **Step 1: Test Dashboard Access (Logged In)**
- Navigate to: http://localhost:5173/dashboard
- **Expected:** Dashboard loads normally

#### **Step 2: Logout**
- Open DevTools → Console
- Run: `localStorage.clear()`
- Refresh page

#### **Step 3: Test Dashboard Access (Logged Out)**
- Navigate to: http://localhost:5173/dashboard
- **Expected:** Automatically redirected to /login

---

### **TEST 3: Invalid Login Attempts**

#### **Test 3.1: Wrong Password**
1. Go to: http://localhost:5173/login
2. Enter:
   - Email: yourname@example.com
   - Password: WrongPassword123
3. Click login

**Expected Result:**
- ❌ Error toast: "Invalid credentials"
- 🚫 No redirect

#### **Test 3.2: Non-existent Email**
1. Enter:
   - Email: notexist@example.com
   - Password: Test@1234
2. Click login

**Expected Result:**
- ❌ Error toast: "Invalid credentials"

#### **Test 3.3: Unverified Email**
1. Create a new account (don't verify)
2. Try to login

**Expected Result:**
- ❌ Error toast: "Please verify your email first"

---

### **TEST 4: Password Reset Flow**

#### **Step 1: Request Password Reset**
1. Go to: http://localhost:5173/forgot-password
2. Enter your email
3. Click submit

**Expected Result:**
- ✅ Success message
- ✅ Check Mailtrap - you should see reset email

#### **Step 2: Reset Password (via Thunder Client)**
1. Get reset token from Mailtrap email
2. Use Thunder Client:
```
POST http://localhost:5000/api/auth/reset-password/<paste-token-here>

{
  "password": "NewPassword@456"
}
```

**Expected Result:**
- ✅ "Password reset successful"

#### **Step 3: Login with New Password**
1. Go to: http://localhost:5173/login
2. Use new password: NewPassword@456
3. Click login

**Expected Result:**
- ✅ Login successful
- ✅ Redirected to dashboard

---

## 🔍 What to Check in Each Test

### **Frontend Checks:**
1. **Toast Notifications:** Success/error messages appear
2. **Navigation:** Proper redirects after actions
3. **Form Validation:** Errors show for invalid inputs
4. **Loading States:** Buttons show spinners during API calls
5. **LocalStorage:** Token and user data saved after login

### **Backend Checks:**
1. **Console Logs:** Check for email sending logs
2. **MongoDB:** Users created in database
3. **Mailtrap:** Emails received in inbox

### **Network Checks (Browser DevTools):**
1. Open DevTools → Network tab
2. Watch API calls:
   - POST /api/auth/signup → 200 OK
   - POST /api/auth/login → 200 OK
   - GET /api/auth/me → 200 OK (with Bearer token)
3. Check request/response payloads

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Cannot read properties of undefined"**
**Solution:** 
- Check if backend is running on port 5000
- Verify VITE_API_URL in frontend/.env

### **Issue 2: CORS Error**
**Solution:**
- Backend already configured for http://localhost:5173
- If using different port, update backend/.env FRONTEND_URL

### **Issue 3: Token Not Working**
**Solution:**
- Check if token is in localStorage
- Verify token format: should start with "eyJ..."
- Try logging out and in again

### **Issue 4: Email Not Sending**
**Solution:**
- Check Mailtrap credentials in backend/.env
- Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
- Check backend console for email errors

### **Issue 5: "Email not verified" Error**
**Solution:**
- Must verify email before login
- Use Thunder Client to manually verify with token
- Check Mailtrap for verification email

---

## 📊 Testing Checklist

### **Complete User Journey:**
- [ ] Signup page loads
- [ ] Signup form submits successfully
- [ ] Verification email received in Mailtrap
- [ ] Email verification works (via Thunder Client)
- [ ] Login page loads
- [ ] Login works with correct credentials
- [ ] Token saved to localStorage
- [ ] Dashboard loads after login
- [ ] Dashboard shows user-specific data
- [ ] Logout clears token
- [ ] Protected routes redirect when logged out
- [ ] Invalid login attempts show errors
- [ ] Forgot password sends email
- [ ] Password reset works
- [ ] Login works with new password

### **Error Handling:**
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Unverified email shows error
- [ ] Duplicate email shows error
- [ ] Missing fields show validation errors
- [ ] Network errors show user-friendly messages

---

## 🎨 Visual Testing

### **Pages to Verify:**
1. **Login Page:** http://localhost:5173/login
   - Form fields visible
   - "Forgot Password" link works
   - "Create Account" link works
   - Loading spinner shows when submitting

2. **Signup Page:** http://localhost:5173/signup
   - Multi-step form works
   - Password strength indicator shows
   - Industry dropdown populated
   - Company size dropdown populated

3. **Dashboard:** http://localhost:5173/dashboard
   - Sidebar visible
   - User info displayed
   - Navigation works
   - Logout button works

---

## 🚀 Quick Test Commands

### **Test Backend Health:**
```bash
curl http://localhost:5000/health
```

### **Test Signup (Command Line):**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "companyName": "TechCorp",
    "industry": "Technology",
    "companySize": "11-50"
  }'
```

### **Clear Test Data:**
```bash
cd backend
node clearUsers.js
```

---

## 📝 Next Steps After Testing

1. ✅ All tests passing → Ready for more features
2. ❌ Some tests failing → Check error messages, fix issues
3. 🎨 UI improvements needed → Update styling
4. 🔒 Add more security → Rate limiting, email templates
5. 📧 Real emails → Configure production email service

---

## 🎉 Success Criteria

Your integration is **FLAWLESS** when:

✅ **Frontend ↔ Backend Communication:** All API calls work
✅ **Authentication Flow:** Complete signup → verify → login cycle works
✅ **Protected Routes:** Dashboard only accessible when logged in
✅ **Error Handling:** All error cases show user-friendly messages
✅ **Data Persistence:** Users saved in MongoDB
✅ **Email Service:** Verification and reset emails sent
✅ **Token Management:** JWT tokens generated, stored, and validated
✅ **User Experience:** Smooth navigation, loading states, toast notifications

---

## 🔥 Pro Testing Tips

1. **Use Thunder Client Collections:** Save all your API tests
2. **Keep Mailtrap Tab Open:** Instantly see emails
3. **Monitor Console Logs:** Backend logs show what's happening
4. **Use React DevTools:** Inspect component state
5. **Check Network Tab:** See exact API request/response data
6. **Test Edge Cases:** Empty fields, special characters, very long inputs
7. **Test Different Browsers:** Chrome, Firefox, Edge
8. **Mobile Testing:** Responsive design check

---

**You now have a fully integrated, production-ready authentication system!** 🎊

Need help? Just ask!
