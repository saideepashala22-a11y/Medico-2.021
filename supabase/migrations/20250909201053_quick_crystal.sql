/*
  # Create Consultations Table

  1. New Tables
    - `consultations`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `doctor_name` (text, consulting doctor)
      - `consultation_date` (timestamp, consultation date/time)
      - `chief_complaint` (text, main complaint)
      - `present_illness_history` (text, current illness history)
      - `past_medical_history` (text, past medical history)
      - `examination` (text, examination findings)
      - `diagnosis` (text, clinical diagnosis)
      - `treatment` (text, treatment plan)
      - `prescription` (jsonb, prescribed medications)
      - `follow_up_date` (timestamp, next appointment)
      - `notes` (text, additional notes)
      - `consultation_type` (text, general/emergency/follow-up)
      - `status` (text, scheduled/in-progress/completed/cancelled)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `consultations` table
    - Add policy for authenticated users to access consultations
*/

CREATE TABLE IF NOT EXISTS consultations (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id varchar NOT NULL REFERENCES patients(id),
  doctor_name text NOT NULL,
  consultation_date timestamp NOT NULL,
  chief_complaint text NOT NULL,
  present_illness_history text,
  past_medical_history text,
  examination text,
  diagnosis text NOT NULL,
  treatment text,
  prescription jsonb,
  follow_up_date timestamp,
  notes text,
  consultation_type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'completed',
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access consultations"
  ON consultations
  FOR ALL
  TO authenticated
  USING (true);