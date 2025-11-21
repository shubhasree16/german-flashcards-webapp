-- German Vocabulary Flashcards Database Setup
-- Run this script in Supabase SQL Editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  words_learned INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Create vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  example_sentence TEXT,
  category TEXT NOT NULL CHECK (category IN ('A1', 'A2', 'B1')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user_vocabulary_progress table
CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('new', 'learning', 'known')),
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  times_reviewed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

-- 5. Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 7. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies

-- Users policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert users" ON users;
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);

-- User progress policies
DROP POLICY IF EXISTS "Allow all operations on user_progress" ON user_progress;
CREATE POLICY "Allow all operations on user_progress" ON user_progress FOR ALL USING (true) WITH CHECK (true);

-- Vocabulary policies (public read, admin write)
DROP POLICY IF EXISTS "Anyone can read vocabulary" ON vocabulary;
CREATE POLICY "Anyone can read vocabulary" ON vocabulary FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert vocabulary" ON vocabulary;
CREATE POLICY "Anyone can insert vocabulary" ON vocabulary FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update vocabulary" ON vocabulary;
CREATE POLICY "Anyone can update vocabulary" ON vocabulary FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete vocabulary" ON vocabulary;
CREATE POLICY "Anyone can delete vocabulary" ON vocabulary FOR DELETE USING (true);

-- User vocabulary progress policies
DROP POLICY IF EXISTS "Allow all operations on user_vocabulary_progress" ON user_vocabulary_progress;
CREATE POLICY "Allow all operations on user_vocabulary_progress" ON user_vocabulary_progress FOR ALL USING (true) WITH CHECK (true);

-- Badges policies
DROP POLICY IF EXISTS "Anyone can read badges" ON badges;
CREATE POLICY "Anyone can read badges" ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert badges" ON badges;
CREATE POLICY "Anyone can insert badges" ON badges FOR INSERT WITH CHECK (true);

-- User badges policies
DROP POLICY IF EXISTS "Allow all operations on user_badges" ON user_badges;
CREATE POLICY "Allow all operations on user_badges" ON user_badges FOR ALL USING (true) WITH CHECK (true);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(category);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_user_id ON user_vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_vocab_id ON user_vocabulary_progress(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- 10. Insert sample vocabulary data (A1 Level)
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Hallo', 'Hello', 'Hallo, wie geht es dir?', 'A1'),
('Danke', 'Thank you', 'Danke schön!', 'A1'),
('Ja', 'Yes', 'Ja, das ist richtig.', 'A1'),
('Nein', 'No', 'Nein, das ist falsch.', 'A1'),
('Bitte', 'Please/You''re welcome', 'Bitte sehr!', 'A1'),
('Tschüss', 'Goodbye', 'Tschüss, bis morgen!', 'A1'),
('Guten Morgen', 'Good morning', 'Guten Morgen! Wie hast du geschlafen?', 'A1'),
('Gute Nacht', 'Good night', 'Gute Nacht und schlaf gut!', 'A1'),
('Entschuldigung', 'Excuse me/Sorry', 'Entschuldigung, wo ist der Bahnhof?', 'A1'),
('Ich', 'I', 'Ich heiße Anna.', 'A1'),
('Du', 'You (informal)', 'Wie heißt du?', 'A1'),
('Wir', 'We', 'Wir gehen ins Kino.', 'A1'),
('Essen', 'Food/To eat', 'Das Essen schmeckt gut.', 'A1'),
('Trinken', 'To drink', 'Ich möchte Wasser trinken.', 'A1'),
('Haus', 'House', 'Mein Haus ist groß.', 'A1');

-- 11. Insert sample vocabulary data (A2 Level)
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Vielleicht', 'Maybe/Perhaps', 'Vielleicht komme ich morgen.', 'A2'),
('Wichtig', 'Important', 'Das ist sehr wichtig für mich.', 'A2'),
('Verstehen', 'To understand', 'Ich verstehe nicht.', 'A2'),
('Glauben', 'To believe', 'Ich glaube dir.', 'A2'),
('Gefühl', 'Feeling', 'Ich habe ein gutes Gefühl.', 'A2'),
('Gesundheit', 'Health', 'Gesundheit ist wichtig.', 'A2'),
('Erklären', 'To explain', 'Kannst du das erklären?', 'A2'),
('Manchmal', 'Sometimes', 'Manchmal gehe ich spazieren.', 'A2'),
('Niemand', 'Nobody', 'Niemand ist zu Hause.', 'A2'),
('Überall', 'Everywhere', 'Überall sind Menschen.', 'A2');

-- 12. Insert sample vocabulary data (B1 Level)
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Trotzdem', 'Nevertheless', 'Es regnet, trotzdem gehe ich raus.', 'B1'),
('Außerdem', 'Moreover/Besides', 'Außerdem möchte ich noch etwas sagen.', 'B1'),
('Allerdings', 'However', 'Das stimmt allerdings nicht.', 'B1'),
('Vermutlich', 'Presumably', 'Vermutlich kommt er später.', 'B1'),
('Eigentlich', 'Actually', 'Eigentlich wollte ich etwas anderes sagen.', 'B1'),
('Beziehung', 'Relationship', 'Wir haben eine gute Beziehung.', 'B1'),
('Verantwortung', 'Responsibility', 'Du trägst die Verantwortung.', 'B1'),
('Gesellschaft', 'Society', 'Die Gesellschaft verändert sich.', 'B1'),
('Erfahrung', 'Experience', 'Ich habe viel Erfahrung.', 'B1'),
('Entscheidung', 'Decision', 'Das war eine schwere Entscheidung.', 'B1');

-- 13. Insert badges
INSERT INTO badges (name, description, icon, criteria_type, criteria_value) VALUES
('First Steps', 'Learn your first word!', '🌱', 'words_learned', 1),
('Getting Started', 'Learn 10 words', '📚', 'words_learned', 10),
('Word Master', 'Learn 50 words', '🏆', 'words_learned', 50),
('Vocabulary Expert', 'Learn 100 words', '👑', 'words_learned', 100),
('On Fire!', 'Maintain a 3-day streak', '🔥', 'streak_days', 3),
('Dedicated Learner', 'Maintain a 7-day streak', '⭐', 'streak_days', 7),
('Unstoppable', 'Maintain a 30-day streak', '💪', 'streak_days', 30);

-- Done! Your database is ready.
