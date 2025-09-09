/*
  # Create Medical History Table

  1. New Tables
    - `medical_history`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `entry_type` (text, diagnosis/allergy/medication/procedure/note)
      - `title` (text, entry title)
      - `description` (text, detailed description)
      - `category` (text, chronic/acute/surgical/etc.)
      - `severity` (text, mild/moderate/severe/critical)
      - `status` (text, active/resolved/inactive)
      - `start_date` (timestamp, condition start date)
      - `end_date` (timestamp, condition end date)
      - `provider_name` (text, healthcare provider)
      - `notes` (text, additional notes)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `medical_history` table
    - Add policy for authenticated users to access medical history
*/

CREATE TABLE IF NOT EXISTS medical_history (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id varchar NOT NULL REFERENCES patients(id),
  entry_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text,
  severity text,
  status text NOT NULL DEFAULT 'active',
  start_date timestamp,
  end_date timestamp,
  provider_name text,
  notes text,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access medical history"
  ON medical_history
  FOR ALL
  TO authenticated
  USING (true);