/*
  # Create Hospital Settings Table

  1. New Tables
    - `hospital_settings`
      - `id` (uuid, primary key)
      - `hospital_name` (text, hospital name)
      - `hospital_subtitle` (text, hospital subtitle)
      - `address` (text, hospital address)
      - `phone` (text, contact phone)
      - `email` (text, contact email)
      - `accreditation` (text, certifications)
      - `logo` (text, logo file path)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `hospital_settings` table
    - Add policy for authenticated users to access hospital settings
*/

CREATE TABLE IF NOT EXISTS hospital_settings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name text NOT NULL DEFAULT 'NAKSHATRA HOSPITAL',
  hospital_subtitle text DEFAULT 'Multi Specialty Hospital & Research Centre',
  address text DEFAULT '123 Medical District, Healthcare City, State - 123456',
  phone text DEFAULT '+91-1234567890',
  email text DEFAULT 'info@nakshatrahospital.com',
  accreditation text DEFAULT 'NABL Accredited Laboratory | ISO 15189:2012 Certified',
  logo text,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE hospital_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access hospital settings"
  ON hospital_settings
  FOR ALL
  TO authenticated
  USING (true);