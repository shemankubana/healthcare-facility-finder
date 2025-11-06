/*
  # Create signup_requests table for user registration

  1. New Table
    - `signup_requests` - Stores user signup requests pending admin approval

  2. Security
    - Enable RLS
    - Allow anyone to insert (for signup)
    - Only authenticated users can read (for admin approval)
*/

CREATE TABLE IF NOT EXISTS signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('policymaker', 'healthcare_professional', 'researcher')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz
);

-- Enable RLS
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert signup requests (public signup)
CREATE POLICY "Anyone can submit signup requests"
  ON signup_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view signup requests (for admin)
CREATE POLICY "Authenticated users can view signup requests"
  ON signup_requests FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update signup requests (for admin approval)
CREATE POLICY "Authenticated users can update signup requests"
  ON signup_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_signup_requests_status ON signup_requests(status);
CREATE INDEX idx_signup_requests_email ON signup_requests(email);
CREATE INDEX idx_signup_requests_created_at ON signup_requests(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_signup_requests_updated_at
  BEFORE UPDATE ON signup_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
