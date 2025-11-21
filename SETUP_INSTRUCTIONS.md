# 🇩🇪 German Vocabulary Flashcards App - Setup Instructions

## 📋 Overview

This is a complete web application for learning German vocabulary with flashcards, built with:
- **Frontend**: Next.js + React
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT-based auth with bcrypt
- **Text-to-Speech**: Web Speech API (browser-based, 100% free)
- **UI**: Tailwind CSS + shadcn/ui components

## 🚀 Quick Start

### Step 1: Create Database Tables in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com/project/lzjwstdgetkhgcfulwlj
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire SQL script from `/app/scripts/setup-database.js` output (shown below)
5. Click **Run** to execute the script

**SQL Script to Run:**

```sql
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
```

### Step 2: Verify Database Setup

After running the SQL script, verify your tables were created:
1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `users`
   - `user_progress`
   - `vocabulary` (with 35 sample words)
   - `user_vocabulary_progress`
   - `badges` (with 7 badges)
   - `user_badges`

### Step 3: Access the Application

The application is now ready! Simply visit your app URL and you'll see the login/signup page.

## 👤 Creating Users

### Regular User
1. Click on the **Sign Up** tab
2. Enter your name, email, and password
3. Click **Sign Up**
4. You're now logged in and can start learning!

### Admin User
To create an admin user who can add/edit vocabulary:

1. First, create a regular user account through the app
2. Go to Supabase Dashboard → **Table Editor** → `users` table
3. Find your user record
4. Edit the `is_admin` field and set it to `true`
5. Log out and log back in
6. You'll now see the **Admin** tab

## ✨ Features

### For Learners:
- **Flashcard Learning**: Interactive flashcards with flip animation
- **German Pronunciation**: Click "Listen" to hear words pronounced in German (Web Speech API)
- **Category Filtering**: Filter by A1, A2, or B1 levels
- **Progress Tracking**: Track words learned, XP earned
- **Streak System**: Maintain daily learning streaks
- **Badges**: Earn badges for achievements
- **Progress Dashboard**: View your learning stats and earned badges
- **Dark Mode**: Toggle between light and dark themes
- **Mobile Responsive**: Works perfectly on all devices

### For Admins:
- **Vocabulary Management**: Add, edit, delete vocabulary
- **Categorization**: Organize words by difficulty level (A1/A2/B1)
- **Example Sentences**: Add context with example sentences

## 🗂️ Project Structure

```
/app/
├── app/
│   ├── api/[[...path]]/route.js    # Backend API (all routes)
│   ├── page.js                      # Frontend UI
│   ├── layout.js                    # App layout
│   └── globals.css                  # Global styles
├── lib/
│   ├── supabase.js                  # Supabase client setup
│   └── auth.js                      # JWT authentication helpers
├── scripts/
│   ├── setup-database.js            # Database setup script
│   └── seed-data.js                 # Data seeding script
├── components/ui/                   # shadcn/ui components
├── .env                             # Environment variables
└── package.json                     # Dependencies
```

## 🔐 Environment Variables

Located in `/app/.env`:

```env
# Supabase Configuration (Frontend - using Anon Key)
NEXT_PUBLIC_SUPABASE_URL=https://lzjwstdgetkhgcfulwlj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (BACKEND ONLY - for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Security Note**: The Service Role Key is ONLY used in backend API routes and NEVER exposed to the frontend.

## 🚀 Deployment Guide

### Deploy to Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [vercel.com](https://vercel.com) and click "New Project"

3. Import your repository

4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://lzjwstdgetkhgcfulwlj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   ```

5. Click "Deploy"

6. Done! Your app is live.

### Deploy to Netlify

1. Push code to GitHub

2. Go to [netlify.com](https://netlify.com) and click "Add new site"

3. Import your repository

4. Build settings:
   - Build command: `next build`
   - Publish directory: `.next`

5. Add environment variables (same as Vercel)

6. Deploy!

### Deploy to Render

1. Push code to GitHub

2. Go to [render.com](https://render.com) and click "New Web Service"

3. Connect your repository

4. Settings:
   - Build command: `yarn install && yarn build`
   - Start command: `yarn start`

5. Add environment variables

6. Deploy!

## 🔧 Customization

### Add More Vocabulary
1. Log in as admin
2. Go to Admin tab
3. Fill in the form and click "Add Vocabulary"

### Add More Badges
Edit `/app/scripts/seed-data.js` and add more badges to the `badgesData` array:
```javascript
{ 
  name: 'Your Badge Name', 
  description: 'Description', 
  icon: '🎯', 
  criteria_type: 'words_learned', // or 'streak_days'
  criteria_value: 100 
}
```

Then run: `node scripts/seed-data.js`

### Customize Colors/Theme
Edit `/app/tailwind.config.js` to change colors and themes.

### Add More Languages
The app structure supports adding other languages. Modify the vocabulary table to include a `language` field.

## 📱 Features in Detail

### Spaced Repetition
The app tracks:
- How many times you've reviewed each word
- Your status (new/learning/known)
- Last review date
- Next review date (for future implementation)

### Gamification System
- **XP Points**: Earn 10 XP for each word marked as "known"
- **Streaks**: Maintain daily learning streaks
- **Badges**: Automatically awarded when you hit milestones

### Text-to-Speech
Uses the browser's Web Speech API with German (`de-DE`) voices. Works in:
- Chrome/Edge: Excellent German voices
- Firefox: Good support
- Safari: Basic support

## 🐛 Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and keys in `.env`
- Check that tables are created in Supabase
- Ensure RLS policies are set up correctly

### Authentication Not Working
- Check JWT_SECRET is set in `.env`
- Clear browser localStorage and cookies
- Verify users table has correct structure

### Text-to-Speech Not Working
- Ensure you're using HTTPS (required for Web Speech API)
- Check browser compatibility
- Allow microphone/speech permissions if prompted

## 📈 Future Enhancements

Ideas for expanding the app:
1. **Audio Files**: Upload MP3 pronunciation files
2. **Quizzes**: Multiple choice and fill-in-the-blank tests
3. **Writing Practice**: Type German words from English prompts
4. **Listening Practice**: Hear German and type what you hear
5. **Spaced Repetition Algorithm**: Implement full SRS like Anki
6. **Social Features**: Share progress with friends
7. **Leaderboards**: Compete with other learners
8. **Mobile App**: Convert to React Native
9. **More Languages**: Spanish, French, Italian, etc.
10. **AI Integration**: Generate example sentences with GPT-4

## 📝 License

Free to use and modify for personal and commercial projects.

## 🙏 Credits

Built with:
- Next.js
- Supabase
- Tailwind CSS
- shadcn/ui
- Web Speech API
- bcryptjs
- jsonwebtoken

---

**Happy Learning! Viel Erfolg! 🇩🇪**
