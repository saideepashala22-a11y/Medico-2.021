/*
  # Create Activities Table

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `type` (text, activity type)
      - `title` (text, activity title)
      - `description` (text, activity description)
      - `entity_id` (uuid, related entity ID)
      - `entity_type` (text, entity type)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `activities` table
    - Add policy for authenticated users to access activities
*/

CREATE TABLE IF NOT EXISTS activities (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  entity_id varchar,
  entity_type text,
  user_id varchar REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access activities"
  ON activities
  FOR ALL
  TO authenticated
  USING (true);