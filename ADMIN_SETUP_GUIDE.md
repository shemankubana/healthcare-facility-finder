# Administrator Setup Guide

## Understanding the Admin System

Your application uses an **approval-based user registration system**:

1. **Users sign up** → Their request goes into `signup_requests` table with status `pending`
2. **Admin reviews** → Admin logs in and sees pending requests
3. **Admin approves** → User gets created in Supabase Auth and receives email to set password
4. **User logs in** → User can now access the application

## Problem: No Admin Exists Yet!

Since this is a new installation, **you need to create the first admin manually**.

---

## Step 1: Run Database Migrations

First, create the `user_profiles` table:

### In Supabase Dashboard → SQL Editor:

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

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert profiles (allows first admin to be created)
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Trigger to update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Click **Run** ✅

---

## Step 2: Create Your First Admin User

You have **two options** to create the first admin:

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard** → **Authentication** → **Users**

2. **Click "Add User"** button

3. **Fill in the form**:
   - **Email**: your-admin-email@example.com
   - **Password**: Choose a strong password
   - **Auto Confirm User**: ✅ Check this box

4. **Click "Create User"**

5. **Note the User ID** (you'll need it next - looks like: `abc12345-6789-...`)

6. **Go to SQL Editor** and run this (replace with your user ID):

```sql
-- Insert admin profile
INSERT INTO user_profiles (id, email, first_name, last_name, role, is_admin, approval_status)
VALUES (
  'PASTE-YOUR-USER-ID-HERE',  -- Replace with the UUID from step 5
  'your-admin-email@example.com',
  'Admin',
  'User',
  'admin',
  true,
  'approved'
);
```

7. **Verify it worked**:

```sql
SELECT * FROM user_profiles WHERE is_admin = true;
```

You should see your admin user! ✅

---

### Option B: Using SQL Only (Alternative)

If you prefer to do everything in SQL:

```sql
-- Step 1: Create admin user in Supabase Auth
-- Note: This uses Supabase's admin API, so you need service_role key
-- Easier to do via Dashboard (Option A above)

-- Step 2: After creating user via dashboard, get the user ID
SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Step 3: Insert into user_profiles (use the ID from step 2)
INSERT INTO user_profiles (id, email, first_name, last_name, role, is_admin, approval_status)
VALUES (
  'user-id-from-step-2',
  'your-admin-email@example.com',
  'Admin',
  'User',
  'admin',
  true,
  'approved'
);
```

---

## Step 3: Log In as Admin

1. **Go to your application**: `http://localhost:3000/login`

2. **Enter your admin credentials**:
   - Email: your-admin-email@example.com
   - Password: (the one you set)

3. **Click "Sign In"**

4. You should be redirected to: `http://localhost:3000/admin/dashboard` ✅

---

## Step 4: Approve User Signups

Now that you're logged in as admin:

1. You'll see the **Admin Dashboard**
2. Look for **"Registered Users"** section
3. You'll see your test signup with status **"Pending"**
4. Click **"Approve"** button
5. The user will receive an email to set their password
6. They can then log in!

---

## Admin Dashboard Features

As an admin, you can:

- ✅ View all signup requests
- ✅ Approve pending requests (creates user account + sends password email)
- ✅ Decline requests (marks as rejected)
- ✅ Search users by name or email
- ✅ See statistics (total users, approved, declined)

---

## Important Notes

### Security Considerations

⚠️ **The first admin must be created manually** (Steps 1-2 above)

⚠️ **Only admins can approve new users** - Regular users cannot self-approve

⚠️ **Admin status is checked via**:
1. `user_profiles.is_admin = true` (database)
2. OR `auth.users.user_metadata.is_admin = true` (auth metadata)

### Creating Additional Admins

After you have your first admin, you can create more admins:

1. They sign up normally (via `/signup` page)
2. You approve them as admin
3. Then in **SQL Editor**, run:

```sql
UPDATE user_profiles
SET is_admin = true, role = 'admin'
WHERE email = 'new-admin@example.com';
```

---

## Troubleshooting

### ❌ Error: "Unauthorized: Admin access required"

**Cause**: User is not marked as admin

**Solution**: Run this SQL (replace with user's email):

```sql
UPDATE user_profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

---

### ❌ Error: "Please log in"

**Cause**: Not authenticated

**Solution**: Go to `/login` and sign in first

---

### ❌ Can't see any pending requests

**Cause**: No users have signed up yet

**Solution**:
1. Open incognito window
2. Go to `http://localhost:3000/signup`
3. Create a test user
4. Refresh admin dashboard

---

### ❌ Approve button does nothing

**Cause**: Missing Supabase Edge Function for user creation

**Solution**: Check if `approve-user` function exists. You may need to:
1. Create the function in Supabase dashboard
2. Or approve manually via SQL:

```sql
-- Manual approval (temporary workaround)
UPDATE signup_requests
SET status = 'approved'
WHERE id = 'request-id-here';

-- Then create auth user manually in Supabase Dashboard → Authentication → Add User
```

---

## Quick Verification Checklist

- [ ] `user_profiles` table exists
- [ ] Admin user created in Supabase Auth
- [ ] Admin profile inserted in `user_profiles` with `is_admin = true`
- [ ] Can log in as admin
- [ ] Admin dashboard loads at `/admin/dashboard`
- [ ] Can see "Registered Users" section
- [ ] Test user signup appears in pending list

---

## Next Steps After Setup

1. ✅ Create your admin account (follow this guide)
2. 📧 Configure email templates in Supabase (Settings → Auth → Email Templates)
3. 🔐 Set up password policies (Settings → Auth → Policies)
4. 👥 Approve your team members' signup requests
5. 🚀 Start using the application!

---

**Need Help?**

If you're stuck, check:
1. Supabase logs (Dashboard → Logs)
2. Browser console (F12 → Console)
3. Backend terminal output
4. Verify all migrations ran successfully

**Last Updated**: 2025-11-06
