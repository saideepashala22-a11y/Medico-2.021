/*
  # Create Lab Tests Table

  1. New Tables
    - `lab_tests`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients_registration)
      - `test_types` (jsonb, array of selected tests)
      - `results` (jsonb, test results data)
      - `doctor_notes` (text, doctor's notes)
      - `total_cost` (decimal, total cost)
      - `status` (text, pending/completed)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `lab_tests` table
    - Add policy for authenticated users to access lab tests
*/

CREATE TABLE IF NOT EXISTS lab_tests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id varchar NOT NULL REFERENCES patients_registration(id),
  test_types jsonb NOT NULL,
  results jsonb,
  doctor_notes text,
  total_cost decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access lab tests"
  ON lab_tests
  FOR ALL
  TO authenticated
  USING (true);