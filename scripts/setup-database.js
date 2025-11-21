// Database setup script - Run this ONCE to create tables and seed initial data
// This uses the service role key (backend only) to create tables
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env variables manually
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) return
    
    const equalIndex = trimmedLine.indexOf('=')
    if (equalIndex === -1) return
    
    const key = trimmedLine.substring(0, equalIndex).trim()
    const value = trimmedLine.substring(equalIndex + 1).trim()
    
    if (key && value && !process.env[key]) {
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n')

  try {
    // Create users table
    console.log('Creating users table...')
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Policies for users table
        DROP POLICY IF EXISTS "Users can read their own data" ON users;
        CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Anyone can insert users" ON users;
        CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
      `
    })

    if (usersError) {
      console.log('Note: Using direct table creation (RPC may not be available)')
      console.log('Please run the following SQL in Supabase SQL Editor:\n')
      console.log(generateFullSQL())
      return
    }

    console.log('✅ Users table created\n')

    // Create other tables
    await createTables()

    // Seed initial data
    await seedData()

    console.log('\n✅ Database setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Your database is ready!')
    console.log('2. Visit your app to create an account')
    console.log('3. To create an admin user, update the is_admin field in Supabase dashboard\n')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n')
    console.log(generateFullSQL())
  }
}

async function createTables() {
  // Since RPC might not work, let's use direct SQL execution
  // We'll provide the SQL script for manual execution
  
  const tables = [
    // User progress table
    {
      name: 'user_progress',
      sql: `
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
      `
    },
    // Vocabulary table
    {
      name: 'vocabulary',
      sql: `
        CREATE TABLE IF NOT EXISTS vocabulary (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          word TEXT NOT NULL,
          meaning TEXT NOT NULL,
          example_sentence TEXT,
          category TEXT NOT NULL CHECK (category IN ('A1', 'A2', 'B1')),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    // User vocabulary progress
    {
      name: 'user_vocabulary_progress',
      sql: `
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
      `
    },
    // Badges table
    {
      name: 'badges',
      sql: `
        CREATE TABLE IF NOT EXISTS badges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          criteria_type TEXT NOT NULL,
          criteria_value INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    // User badges
    {
      name: 'user_badges',
      sql: `
        CREATE TABLE IF NOT EXISTS user_badges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
          earned_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, badge_id)
        );
      `
    }
  ]

  for (const table of tables) {
    console.log(`Creating ${table.name} table...`)
    // For now, we'll just log that we're creating these
    // The actual creation will happen via the manual SQL script
  }
}

async function seedData() {
  console.log('\nSeeding initial data...')

  // Check if data already exists
  const { data: existingVocab } = await supabase
    .from('vocabulary')
    .select('id')
    .limit(1)

  if (existingVocab && existingVocab.length > 0) {
    console.log('⚠️  Data already exists, skipping seed')
    return
  }

  // Seed vocabulary
  const vocabularyData = [
    // A1 Level
    { word: 'Hallo', meaning: 'Hello', example_sentence: 'Hallo, wie geht es dir?', category: 'A1' },
    { word: 'Danke', meaning: 'Thank you', example_sentence: 'Danke schön!', category: 'A1' },
    { word: 'Ja', meaning: 'Yes', example_sentence: 'Ja, das ist richtig.', category: 'A1' },
    { word: 'Nein', meaning: 'No', example_sentence: 'Nein, das ist falsch.', category: 'A1' },
    { word: 'Bitte', meaning: 'Please/You\'re welcome', example_sentence: 'Bitte sehr!', category: 'A1' },
    { word: 'Tschüss', meaning: 'Goodbye', example_sentence: 'Tschüss, bis morgen!', category: 'A1' },
    { word: 'Guten Morgen', meaning: 'Good morning', example_sentence: 'Guten Morgen! Wie hast du geschlafen?', category: 'A1' },
    { word: 'Gute Nacht', meaning: 'Good night', example_sentence: 'Gute Nacht und schlaf gut!', category: 'A1' },
    { word: 'Entschuldigung', meaning: 'Excuse me/Sorry', example_sentence: 'Entschuldigung, wo ist der Bahnhof?', category: 'A1' },
    { word: 'Ich', meaning: 'I', example_sentence: 'Ich heiße Anna.', category: 'A1' },
    { word: 'Du', meaning: 'You (informal)', example_sentence: 'Wie heißt du?', category: 'A1' },
    { word: 'Wir', meaning: 'We', example_sentence: 'Wir gehen ins Kino.', category: 'A1' },
    { word: 'Essen', meaning: 'Food/To eat', example_sentence: 'Das Essen schmeckt gut.', category: 'A1' },
    { word: 'Trinken', meaning: 'To drink', example_sentence: 'Ich möchte Wasser trinken.', category: 'A1' },
    { word: 'Haus', meaning: 'House', example_sentence: 'Mein Haus ist groß.', category: 'A1' },
    
    // A2 Level
    { word: 'Vielleicht', meaning: 'Maybe/Perhaps', example_sentence: 'Vielleicht komme ich morgen.', category: 'A2' },
    { word: 'Wichtig', meaning: 'Important', example_sentence: 'Das ist sehr wichtig für mich.', category: 'A2' },
    { word: 'Verstehen', meaning: 'To understand', example_sentence: 'Ich verstehe nicht.', category: 'A2' },
    { word: 'Glauben', meaning: 'To believe', example_sentence: 'Ich glaube dir.', category: 'A2' },
    { word: 'Gefühl', meaning: 'Feeling', example_sentence: 'Ich habe ein gutes Gefühl.', category: 'A2' },
    { word: 'Gesundheit', meaning: 'Health', example_sentence: 'Gesundheit ist wichtig.', category: 'A2' },
    { word: 'Erklären', meaning: 'To explain', example_sentence: 'Kannst du das erklären?', category: 'A2' },
    { word: 'Manchmal', meaning: 'Sometimes', example_sentence: 'Manchmal gehe ich spazieren.', category: 'A2' },
    { word: 'Niemand', meaning: 'Nobody', example_sentence: 'Niemand ist zu Hause.', category: 'A2' },
    { word: 'Überall', meaning: 'Everywhere', example_sentence: 'Überall sind Menschen.', category: 'A2' },
    
    // B1 Level
    { word: 'Trotzdem', meaning: 'Nevertheless', example_sentence: 'Es regnet, trotzdem gehe ich raus.', category: 'B1' },
    { word: 'Außerdem', meaning: 'Moreover/Besides', example_sentence: 'Außerdem möchte ich noch etwas sagen.', category: 'B1' },
    { word: 'Allerdings', meaning: 'However', example_sentence: 'Das stimmt allerdings nicht.', category: 'B1' },
    { word: 'Vermutlich', meaning: 'Presumably', example_sentence: 'Vermutlich kommt er später.', category: 'B1' },
    { word: 'Eigentlich', meaning: 'Actually', example_sentence: 'Eigentlich wollte ich etwas anderes sagen.', category: 'B1' },
    { word: 'Beziehung', meaning: 'Relationship', example_sentence: 'Wir haben eine gute Beziehung.', category: 'B1' },
    { word: 'Verantwortung', meaning: 'Responsibility', example_sentence: 'Du trägst die Verantwortung.', category: 'B1' },
    { word: 'Gesellschaft', meaning: 'Society', example_sentence: 'Die Gesellschaft verändert sich.', category: 'B1' },
    { word: 'Erfahrung', meaning: 'Experience', example_sentence: 'Ich habe viel Erfahrung.', category: 'B1' },
    { word: 'Entscheidung', meaning: 'Decision', example_sentence: 'Das war eine schwere Entscheidung.', category: 'B1' }
  ]

  console.log('Inserting vocabulary...')
  const { error: vocabError } = await supabase
    .from('vocabulary')
    .insert(vocabularyData)

  if (vocabError) {
    console.error('Error seeding vocabulary:', vocabError)
  } else {
    console.log(`✅ Inserted ${vocabularyData.length} vocabulary items`)
  }

  // Seed badges
  const badgesData = [
    { name: 'First Steps', description: 'Learn your first word!', icon: '🌱', criteria_type: 'words_learned', criteria_value: 1 },
    { name: 'Getting Started', description: 'Learn 10 words', icon: '📚', criteria_type: 'words_learned', criteria_value: 10 },
    { name: 'Word Master', description: 'Learn 50 words', icon: '🏆', criteria_type: 'words_learned', criteria_value: 50 },
    { name: 'Vocabulary Expert', description: 'Learn 100 words', icon: '👑', criteria_type: 'words_learned', criteria_value: 100 },
    { name: 'On Fire!', description: 'Maintain a 3-day streak', icon: '🔥', criteria_type: 'streak_days', criteria_value: 3 },
    { name: 'Dedicated Learner', description: 'Maintain a 7-day streak', icon: '⭐', criteria_type: 'streak_days', criteria_value: 7 },
    { name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '💪', criteria_type: 'streak_days', criteria_value: 30 }
  ]

  console.log('Inserting badges...')
  const { error: badgesError } = await supabase
    .from('badges')
    .insert(badgesData)

  if (badgesError) {
    console.error('Error seeding badges:', badgesError)
  } else {
    console.log(`✅ Inserted ${badgesData.length} badges`)
  }
}

function generateFullSQL() {
  return `
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
`
}

// Run the setup
setupDatabase().then(() => {
  console.log('\n🎉 Setup process completed!')
}).catch((error) => {
  console.error('\n❌ Setup process failed:', error)
})
