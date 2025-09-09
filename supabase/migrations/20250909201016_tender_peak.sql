/*
  # Create Patients Registration Table

  1. New Tables
    - `patients_registration`
      - `id` (uuid, primary key)
      - `mru_number` (text, unique, MRU25-XXXX format)
      - `visit_id` (text, unique, VID-XXXXXX format)
      - `salutation` (text, Mr./Mrs./Dr./etc.)
      - `full_name` (text, complete patient name)
      - `age` (integer, patient age)
      - `age_unit` (text, years/months/days)
      - `gender` (text, male/female/other)
      - `date_of_birth` (timestamp)
      - `contact_phone` (text, phone number)
      - `email` (text, email address)
      - `address` (text, patient address)
      - `blood_group` (text, A+/B+/O+/etc.)
      - `emergency_contact_name` (text)
      - `emergency_contact_phone` (text)
      - `medical_history` (text, allergies/conditions)
      - `referring_doctor` (text, doctor name)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `patients_registration` table
    - Add policy for authenticated users to access registration data
*/

CREATE TABLE IF NOT EXISTS patients_registration (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  mru_number text NOT NULL UNIQUE,
  visit_id text NOT NULL UNIQUE,
  salutation text,
  full_name text NOT NULL,
  age integer NOT NULL,
  age_unit text NOT NULL DEFAULT 'years',
  gender text NOT NULL,
  date_of_birth timestamp,
  contact_phone text NOT NULL,
  email text,
  address text,
  blood_group text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_history text,
  referring_doctor text,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE patients_registration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access patient registrations"
  ON patients_registration
  FOR ALL
  TO authenticated
  USING (true);