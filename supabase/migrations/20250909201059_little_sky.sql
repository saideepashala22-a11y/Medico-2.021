/*
  # Create Surgical Case Sheets Table

  1. New Tables
    - `surgical_case_sheets`
      - `id` (uuid, primary key)
      - `case_number` (text, unique, SCS-XXXX-XX format)
      - `patient_id` (uuid, foreign key to patients)
      - `patient_name` (text, patient name)
      - `husband_father_name` (text)
      - `religion` (text, patient religion)
      - `nationality` (text, patient nationality)
      - `age` (integer, patient age)
      - `sex` (text, patient gender)
      - `address` (text, patient address)
      - `village` (text, village name)
      - `district` (text, district name)
      - `diagnosis` (text, medical diagnosis)
      - `nature_of_operation` (text, surgery type)
      - `edd` (timestamp, expected delivery date)
      - `date_of_admission` (timestamp)
      - `date_of_operation` (timestamp)
      - `date_of_discharge` (timestamp)
      - `lp_no` (text, LP number)
      - `complaints_and_duration` (text)
      - `history_of_present_illness` (text)
      - Investigation fields (hb, bsa, ct, bt, etc.)
      - Examination fields (general_condition, temperature, etc.)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `surgical_case_sheets` table
    - Add policy for authenticated users to access surgical case sheets
*/

CREATE TABLE IF NOT EXISTS surgical_case_sheets (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL UNIQUE,
  patient_id varchar NOT NULL REFERENCES patients(id),
  patient_name text NOT NULL,
  husband_father_name text,
  religion text,
  nationality text,
  age integer NOT NULL,
  sex text NOT NULL,
  address text,
  village text,
  district text,
  diagnosis text,
  nature_of_operation text,
  edd timestamp,
  date_of_admission timestamp,
  date_of_operation timestamp,
  date_of_discharge timestamp,
  lp_no text,
  complaints_and_duration text,
  history_of_present_illness text,
  
  -- Investigation fields
  hb text,
  bsa text,
  ct text,
  bt text,
  blood_grouping text,
  rh_factor text,
  prl text,
  rbs text,
  urine_sugar text,
  xray text,
  ecg text,
  blood_urea text,
  serum_creatinine text,
  serum_bilirubin text,
  hbsag text,
  
  -- On Examination fields
  general_condition text,
  temperature text,
  pulse text,
  blood_pressure text,
  respiratory_rate text,
  heart text,
  lungs text,
  abdomen text,
  cns text,
  
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE surgical_case_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access surgical case sheets"
  ON surgical_case_sheets
  FOR ALL
  TO authenticated
  USING (true);