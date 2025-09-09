/*
  # Create Patients Table

  1. New Tables
    - `patients`
      - `id` (uuid, primary key)
      - `patient_id` (text, unique, HMS-YYYY-XXX format)
      - `name` (text, patient name)
      - `age` (integer, patient age)
      - `gender` (text, patient gender)
      - `contact` (text, contact number)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `patients` table
    - Add policy for authenticated users to access patient data
*/

CREATE TABLE IF NOT EXISTS patients (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text NOT NULL UNIQUE,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  contact text,
  created_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (true);