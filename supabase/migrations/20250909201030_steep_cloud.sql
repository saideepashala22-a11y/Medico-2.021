/*
  # Create Medicine Inventory Table

  1. New Tables
    - `medicine_inventory`
      - `id` (uuid, primary key)
      - `medicine_name` (text, medicine name)
      - `batch_number` (text, batch number)
      - `quantity` (integer, available quantity)
      - `units` (text, tablets/ml/grams/etc.)
      - `mrp` (decimal, maximum retail price)
      - `manufacture_date` (timestamp)
      - `expiry_date` (timestamp)
      - `manufacturer` (text, manufacturer name)
      - `category` (text, tablets/syrup/injection/etc.)
      - `description` (text, medicine description)
      - `is_active` (boolean, availability status)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `medicine_inventory` table
    - Add policy for authenticated users to access medicine inventory
*/

CREATE TABLE IF NOT EXISTS medicine_inventory (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name text NOT NULL,
  batch_number text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  units text NOT NULL DEFAULT 'tablets',
  mrp decimal(10,2) NOT NULL,
  manufacture_date timestamp,
  expiry_date timestamp,
  manufacturer text,
  category text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE medicine_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access medicine inventory"
  ON medicine_inventory
  FOR ALL
  TO authenticated
  USING (true);