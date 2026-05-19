CREATE TABLE IF NOT EXISTS t_p32437567_project_sunshine_6.works (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Без названия',
  type VARCHAR(50) NOT NULL DEFAULT 'photo',
  url TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);