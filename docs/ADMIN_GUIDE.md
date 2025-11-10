# Administrator Guide

Guide for setting up and managing the admin approval system for user registration.

## Overview

The Healthcare Facility Finder uses an approval-based user registration system:

1. **Users sign up** → Request goes to `signup_requests` table (status: `pending`)
2. **Admin reviews** → Admin sees pending requests in dashboard
3. **Admin approves** → User created in Supabase Auth, receives password setup email
4. **User logs in** → User can now access the application

---

## Initial Admin Setup

### Step 1: Create User Profiles Table

Run this in **Supabase SQL Editor:**

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('policymaker', 'healthcare_professional', 'researcher', 'admin')),
  is_admin boolean DEFAULT false,
  approval_status text DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin);
```

### Step 2: Create First Admin User

**In Supabase Dashboard:**

1. Go to **Authentication** → **Users** → **Add User**
2. Enter:
   - Email: your-admin@example.com
   - Password: (choose strong password)
   - ✅ Check "Auto Confirm User"
3. Click **Create User**
4. **Copy the User ID** (UUID format: abc12345-6789-...)

**In SQL Editor:**

```sql
-- Insert admin profile (replace USER-ID)
INSERT INTO user_profiles (id, email, first_name, last_name, role, is_admin, approval_status)
VALUES (
  'PASTE-USER-ID-HERE',
  'your-admin@example.com',
  'Admin',
  'User',
  'admin',
  true,
  'approved'
);

-- Verify
SELECT * FROM user_profiles WHERE is_admin = true;
```

### Step 3: Log In

1. Go to **http://localhost:3000/login**
2. Enter admin credentials
3. You'll be redirected to **/admin/dashboard**

---

## Admin Dashboard Features

### View Pending Requests

The dashboard shows:
- **Total signups** (pending + approved)
- **Pending requests** (awaiting approval)
- **Declined requests** (rejected)

### Approve Users

1. Find user in **"Registered Users"** section
2. Click **"Approve"** button
3. User receives email to set password
4. User can now log in

### Decline Users

1. Find user in list
2. Click **"Decline"** button
3. Request marked as rejected
4. User cannot access system

### Search Users

Use search bar to filter by:
- Name
- Email
- Role

---

## Managing Admins

### Create Additional Admins

After first admin is set up:

1. User signs up normally via `/signup`
2. You approve them
3. Grant admin privileges:

```sql
UPDATE user_profiles
SET is_admin = true, role = 'admin'
WHERE email = 'new-admin@example.com';
```

### Remove Admin Privileges

```sql
UPDATE user_profiles
SET is_admin = false, role = 'policymaker'
WHERE email = 'former-admin@example.com';
```

---

## User Roles

The system supports 4 roles:

| Role | Description | Capabilities |
|------|-------------|--------------|
| **admin** | System administrator | Approve users, full access |
| **policymaker** | Government officials | Create recommendations, view analytics |
| **healthcare_professional** | Medical staff | View facilities, create analysis |
| **researcher** | Academic researchers | Read-only access, export data |

### Change User Role

```sql
UPDATE user_profiles
SET role = 'researcher'
WHERE email = 'user@example.com';
```

---

## Troubleshooting

### ❌ "Unauthorized: Admin access required"

**Cause:** User not marked as admin

**Solution:**
```sql
UPDATE user_profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

---

### ❌ Can't see pending requests

**Cause:** No users have signed up yet

**Solution:**
1. Open incognito window
2. Go to http://localhost:3000/signup
3. Create test user
4. Refresh admin dashboard

---

### ❌ Approve button doesn't work

**Cause:** Database permissions or missing user creation logic

**Temporary workaround:**
```sql
-- Manual approval
UPDATE signup_requests
SET status = 'approved'
WHERE id = 'request-id-here';

-- Then create user manually in Supabase Dashboard
```

---

### ❌ Admin dashboard shows 404

**Cause:** Not logged in as admin

**Solution:**
1. Log out
2. Log in with admin credentials
3. Verify `is_admin = true` in user_profiles

---

## Security Best Practices

### Admin Account Security

- ✅ Use strong passwords (16+ characters)
- ✅ Enable 2FA in Supabase Auth settings
- ✅ Limit number of admin accounts
- ✅ Regularly audit admin actions

### User Approval Guidelines

**Approve if:**
- Valid email domain (organizational)
- Legitimate role selection
- Complete profile information

**Decline if:**
- Suspicious email (temporary, fake)
- Inappropriate role
- Duplicate requests

### Regular Maintenance

**Weekly:**
- Review pending requests
- Check for suspicious signups

**Monthly:**
- Audit user list
- Remove inactive accounts
- Review admin privileges

---

## Email Configuration

### Customize Approval Email

In **Supabase Dashboard** → **Settings** → **Auth** → **Email Templates:**

Edit **Invite User** template:

```html
<h2>Welcome to Healthcare Facility Finder!</h2>
<p>Your account has been approved. Click below to set your password:</p>
<a href="{{ .ConfirmationURL }}">Set Password</a>
```

### Email Settings

Configure SMTP in Supabase:
- **SMTP Host:** smtp.gmail.com
- **SMTP Port:** 587
- **From Email:** noreply@yourapp.com

---

## Database Queries

### View All Users

```sql
SELECT
  u.email,
  p.first_name,
  p.last_name,
  p.role,
  p.is_admin,
  p.created_at
FROM auth.users u
JOIN user_profiles p ON u.id = p.id
ORDER BY p.created_at DESC;
```

### View Pending Requests

```sql
SELECT
  email,
  first_name,
  last_name,
  role,
  status,
  created_at
FROM signup_requests
WHERE status = 'pending'
ORDER BY created_at ASC;
```

### User Statistics

```sql
SELECT
  role,
  COUNT(*) as count
FROM user_profiles
GROUP BY role
ORDER BY count DESC;
```

---

## Verification Checklist

- [ ] user_profiles table exists
- [ ] Admin user created in Supabase Auth
- [ ] Admin profile has `is_admin = true`
- [ ] Can log in as admin
- [ ] Admin dashboard loads
- [ ] Can see pending requests
- [ ] Approve/decline buttons work
- [ ] Email notifications sent

---

## Next Steps

1. ✅ Set up first admin (this guide)
2. 📧 Configure email templates
3. 🔐 Set password policies
4. 👥 Approve team members
5. 📊 Monitor user activity

---

**Last Updated:** 2025-11-10
