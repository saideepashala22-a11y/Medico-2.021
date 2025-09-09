/*
  # Create Prescriptions Table

  1. New Tables
    - `prescriptions`
      - `id` (uuid, primary key)
      - `bill_number` (text, unique bill number)
      - `patient_id` (uuid, foreign key to patients_registration)
      - `medicines` (jsonb, array of prescribed medicines)
      - `subtotal` (decimal, subtotal amount)
      - `tax` (decimal, tax amount)
      - `total` (decimal, total amount)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `prescriptions` table
    - Add policy for authenticated users to access prescriptions
*/

CREATE TABLE IF NOT EXISTS prescriptions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text NOT NULL UNIQUE,
  patient_id varchar NOT NULL REFERENCES patients_registration(id),
  medicines jsonb NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  tax decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access prescriptions"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (true);