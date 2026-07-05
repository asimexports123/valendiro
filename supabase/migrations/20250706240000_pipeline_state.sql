-- Pipeline state table for production control
CREATE TABLE IF NOT EXISTS pipeline_state (
  id BIGINT PRIMARY KEY DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'maintenance')),
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  operator TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial state
INSERT INTO pipeline_state (id, status, paused_at, resumed_at, operator)
VALUES (1, 'running', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE pipeline_state ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage pipeline state
CREATE POLICY "Service role can manage pipeline state"
  ON pipeline_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admin users to read pipeline state
CREATE POLICY "Admins can read pipeline state"
  ON pipeline_state
  FOR SELECT
  TO authenticated
  USING (true);
