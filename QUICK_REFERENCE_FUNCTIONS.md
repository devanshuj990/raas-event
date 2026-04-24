# ⚡ QUICK REFERENCE - CRITICAL FUNCTIONS

## 🎫 Ticket Creation
**File:** app.js | **Function:** `generateAndSaveTickets()`

**Key Points:**
- Uses `addDoc()` - generates unique Firestore ID
- Requires authenticated user (`window.currentUserId`)
- Includes userId in every ticket
- Uses `serverTimestamp()` for automatic timestamps
- Comprehensive error handling with try-catch

**Verification Command (Console):**
```javascript
// Check if userId is captured
console.log('Current User:', window.currentUserId);
```

---

## 📅 Event Creation
**File:** admin.js | **Function:** `handleCreateEvent()`

**Key Points:**
- Uses `addDoc()` - prevents ID conflicts
- Requires admin or owner role
- Validates all inputs (name, date, time, venue, description)
- Checks banner image upload
- Enforces future dates only
- Validates ticket prices

**Verification Command (Admin Console):**
```javascript
// Check admin role
console.log('Current Role:', window.currentRole);
```

---

## 🔐 Role Assignment
**File:** admin.js | **Function:** `updateUserRole(uid, role)`

**Usage Example:**
```javascript
// From admin dashboard or console
await updateUserRole('user_uid_here', 'scanner');
// or
window.updateUserRole('user_uid_here', 'admin');
```

**Valid Roles:**
- 'user' - Browse and book tickets
- 'scanner' - Scan QR codes
- 'admin' - Manage events
- 'owner' - Full system access

---

## 🎟️ Scanner Validation
**File:** scan.js | **Function:** `validateAndDisplayTicket(qrData)`

**Validation Flow:**
1. Input validation
2. Database check
3. Direct ID lookup
4. Fallback field search
5. Data completeness check
6. Used status check
7. Cancellation status check
8. Mark as used
9. Grant entry

**Console Debugging:**
```javascript
// Check scanner role
console.log('Can scan:', window.currentRole === 'scanner' || window.currentRole === 'admin' || window.currentRole === 'owner');
```

---

## 🔍 Event Filtering
**File:** app.js | **Function:** `loadEventsFromFirebase()`

**Status Behaviors:**
- **active** → Show, allow booking
- **inactive** → Show, disable booking (opacity: 0.5)
- **postponed** → Show, disable booking, display "Event Postponed"
- **cancelled** → Hidden completely

---

## 🛡️ Page Protection

### Admin Panel (admin.html)
```javascript
// Automatically checked on load
if (role !== 'admin' && role !== 'owner') {
  window.location.href = 'index.html';
}
```

### Scanner Page (scan.html)
```javascript
// Automatically checked on load
if (role !== 'scanner' && role !== 'admin' && role !== 'owner') {
  window.location.href = 'index.html';
}
```

---

## 📊 Database Structure

### Events Collection
```
events/{auto_generated_id}
├── eventName (string)
├── eventDate (string)
├── eventTime (string)
├── venue (string)
├── status (active|inactive|postponed|cancelled)
├── priceSingle (number)
├── priceCouple (number)
├── priceGroup5 (number)
├── priceGroup10 (number)
├── priceGroup20 (number)
├── banner (base64)
├── createdAt (timestamp)
├── createdBy (string: uid)
└── description (string)
```

### Tickets Collection
```
tickets/{auto_generated_id}
├── ticketId (string: same as doc ID)
├── userId (string: required)
├── eventId (string)
├── eventName (string)
├── ticketType (string)
├── price (number)
├── used (boolean)
├── usedAt (timestamp)
├── status (active|cancelled)
├── createdAt (timestamp)
├── customerName (string)
├── customerEmail (string)
├── customerPhone (string)
└── scannerUserId (string: who scanned it)
```

### Users Collection
```
users/{uid}
├── phone (string)
├── role (user|scanner|admin|owner)
├── name (string)
├── joinedAt (timestamp)
├── roleUpdatedAt (timestamp)
└── roleUpdatedBy (string: who changed it)
```

---

## ✅ SUCCESS INDICATORS

### Event Created Successfully:
- Firestore shows unique doc ID
- `createdAt` timestamp exists
- `createdBy` shows admin UID
- Status set correctly

### Ticket Generated Successfully:
- Unique Firestore doc ID
- `userId` matches current user
- `qrData` equals doc ID
- `used: false`

### Ticket Scanned Successfully:
- `used: true` set
- `usedAt` timestamp added
- `scannerUserId` recorded
- "Entry Granted" displayed

### Role Assigned Successfully:
- Users collection updated
- `roleUpdatedAt` timestamp added
- `roleUpdatedBy` shows admin UID
- User can access restricted pages

---

## 🚨 ERROR HANDLING

**All functions have try-catch blocks:**
- ❌ If error occurs → Log to console
- ❌ Show user-friendly message
- ❌ Never block user from entry (fail-safe)
- ❌ Admin notified for manual verification

---

## 🧪 TESTING CHECKLIST

```
□ Create event with admin account
□ Verify unique ID in Firestore
□ Book ticket with user account
□ Verify userId in Firestore
□ Scan ticket QR code
□ Verify used:true in Firestore
□ Try scanning again
□ Should show "Already Used"
□ Assign scanner role to user
□ User can access scan.html
□ Remove scanner role
□ User redirected from scan.html
```

---

## 📞 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Event won't create | Check role (admin/owner?), verify banner uploaded |
| Ticket ID not generated | Check user is logged in, verify Firestore initialized |
| Scanner shows "not found" | Check ticket exists in Firestore, verify QR code |
| Page redirects to login | Check user is authenticated, role may have expired |
| Role change not working | Verify Firestore Rules deployed, check userId format |

---

**Last Updated:** April 24, 2026  
**System Version:** Production Ready v1.0
