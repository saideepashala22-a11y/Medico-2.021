/*
  # Create Discharge Summaries Table

  1. New Tables
    - `discharge_summaries`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `primary_diagnosis` (text, main diagnosis)
      - `secondary_diagnosis` (text, additional diagnosis)
      - `treatment_summary` (text, treatment provided)
      - `medications` (text, discharge medications)
      - `followup_instructions` (text, follow-up care)
      - `discharge_date` (timestamp, discharge date)
      - `attending_physician` (text, doctor name)
      - `admission_date` (timestamp, admission date)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `discharge_summaries` table
    - Add policy for authenticated users to access discharge summaries
*/

CREATE TABLE IF NOT EXISTS discharge_summaries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id varchar NOT NULL REFERENCES patients(id),
  primary_diagnosis text NOT NULL,
  secondary_diagnosis text,
  treatment_summary text NOT NULL,
  medications text,
  followup_instructions text,
  discharge_date timestamp NOT NULL,
  attending_physician text NOT NULL,
  admission_date timestamp,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access discharge summaries"
  ON discharge_summaries
  FOR ALL
  TO authenticated
  USING (true);