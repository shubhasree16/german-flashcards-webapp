// Seed data script - Seeds vocabulary and badges after tables are created
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

async function seedData() {
  console.log('🌱 Starting data seeding...\n')

  try {
    // Check if vocabulary already exists
    const { data: existingVocab, error: checkError } = await supabase
      .from('vocabulary')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking existing data:', checkError.message)
      console.log('\n⚠️  Make sure you have run the SQL script in Supabase SQL Editor first!')
      console.log('The SQL script was output by setup-database.js\n')
      return
    }

    if (existingVocab && existingVocab.length > 0) {
      console.log('⚠️  Vocabulary data already exists. Skipping seed.\n')
    } else {
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
      const { data: vocabInserted, error: vocabError } = await supabase
        .from('vocabulary')
        .insert(vocabularyData)
        .select()

      if (vocabError) {
        console.error('❌ Error seeding vocabulary:', vocabError.message)
      } else {
        console.log(`✅ Inserted ${vocabInserted.length} vocabulary items\n`)
      }
    }

    // Check if badges already exist
    const { data: existingBadges } = await supabase
      .from('badges')
      .select('id')
      .limit(1)

    if (existingBadges && existingBadges.length > 0) {
      console.log('⚠️  Badges data already exists. Skipping seed.\n')
    } else {
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
      const { data: badgesInserted, error: badgesError } = await supabase
        .from('badges')
        .insert(badgesData)
        .select()

      if (badgesError) {
        console.error('❌ Error seeding badges:', badgesError.message)
      } else {
        console.log(`✅ Inserted ${badgesInserted.length} badges\n`)
      }
    }

    console.log('✅ Data seeding completed!\n')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }
}

// Run the seeding
seedData().then(() => {
  console.log('🎉 Seeding process completed!')
  process.exit(0)
}).catch((error) => {
  console.error('\n❌ Seeding process failed:', error)
  process.exit(1)
})
