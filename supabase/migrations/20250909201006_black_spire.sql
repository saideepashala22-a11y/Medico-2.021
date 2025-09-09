/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text, hashed)
      - `role` (text, doctor/staff)
      - `name` (text, full name)
      - `email` (text, optional)
      - `phone_number` (text, for OTP)
      - `specialization` (text, medical specialty)
      - `license_number` (text, medical license)
      - `is_owner` (boolean, hospital owner)
      - `is_current` (boolean, current doctor for reports)
      - `is_active` (boolean, account status)
      - `reset_otp` (text, password reset OTP)
      - `otp_expires` (timestamp, OTP expiration)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL,
  name text NOT NULL,
  email text,
  phone_number text,
  specialization text,
  license_number text,
  is_owner boolean NOT NULL DEFAULT false,
  is_current boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  reset_otp text,
  otp_expires timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id);