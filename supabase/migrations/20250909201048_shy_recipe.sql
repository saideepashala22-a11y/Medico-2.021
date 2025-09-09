/*
  # Create Patient Profiles Table

  1. New Tables
    - `patient_profiles`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients, unique)
      - `date_of_birth` (timestamp)
      - `blood_type` (text, blood group)
      - `height` (decimal, height in cm)
      - `weight` (decimal, weight in kg)
      - `emergency_contact_name` (text)
      - `emergency_contact_phone` (text)
      - `emergency_contact_relation` (text)
      - `address` (text, patient address)
      - `insurance` (text, insurance details)
      - `primary_physician` (text, primary doctor)
      - `known_allergies` (jsonb, array of allergies)
      - `current_medications` (jsonb, array of medications)
      - `chronic_conditions` (jsonb, array of conditions)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `patient_profiles` table
    - Add policy for authenticated users to access patient profiles
*/

CREATE TABLE IF NOT EXISTS patient_profiles (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id varchar NOT NULL REFERENCES patients(id) UNIQUE,
  date_of_birth timestamp,
  blood_type text,
  height decimal(5,2),
  weight decimal(5,2),
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  address text,
  insurance text,
  primary_physician text,
  known_allergies jsonb,
  current_medications jsonb,
  chronic_conditions jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access patient profiles"
  ON patient_profiles
  FOR ALL
  TO authenticated
  USING (true);