/*
  # Create Lab Test Definitions Table

  1. New Tables
    - `lab_test_definitions`
      - `id` (uuid, primary key)
      - `test_name` (text, name of the test)
      - `department` (text, Pathology/Radiology/etc.)
      - `cost` (decimal, test cost)
      - `description` (text, test description)
      - `normal_ranges` (jsonb, reference ranges)
      - `is_active` (boolean, test availability)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `lab_test_definitions` table
    - Add policy for authenticated users to access test definitions
*/

CREATE TABLE IF NOT EXISTS lab_test_definitions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  department text NOT NULL,
  cost decimal(10,2) NOT NULL,
  description text,
  normal_ranges jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE lab_test_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access lab test definitions"
  ON lab_test_definitions
  FOR ALL
  TO authenticated
  USING (true);