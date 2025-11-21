-- Update German Vocabulary Categories to Thematic System
-- Run this in Supabase SQL Editor to update categories

-- 1. First, update the CHECK constraint to allow thematic categories
ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_category_check;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_category_check 
  CHECK (category IN ('Greetings', 'Basic Phrases', 'Numbers', 'Time & Date', 'Family', 
                      'Food & Drink', 'Hobbies', 'Weather', 'Travel', 'Shopping',
                      'Helping Verbs', 'Common Verbs', 'Adjectives', 'Questions',
                      'Pronouns', 'Colors', 'Body Parts', 'Animals', 'School', 'Work'));

-- 2. Delete existing sample data
DELETE FROM vocabulary;

-- 3. Insert new thematic vocabulary data

-- Greetings
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Hallo', 'Hello', 'Hallo, wie geht es dir?', 'Greetings'),
('Guten Morgen', 'Good morning', 'Guten Morgen! Hast du gut geschlafen?', 'Greetings'),
('Guten Tag', 'Good day', 'Guten Tag! Wie kann ich Ihnen helfen?', 'Greetings'),
('Guten Abend', 'Good evening', 'Guten Abend! Schön, dich zu sehen.', 'Greetings'),
('Gute Nacht', 'Good night', 'Gute Nacht und schlaf gut!', 'Greetings'),
('Tschüss', 'Goodbye/Bye', 'Tschüss, bis morgen!', 'Greetings'),
('Auf Wiedersehen', 'Goodbye (formal)', 'Auf Wiedersehen! Bis bald!', 'Greetings'),
('Bis bald', 'See you soon', 'Bis bald! Wir sehen uns morgen.', 'Greetings');

-- Basic Phrases
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Danke', 'Thank you', 'Danke schön für deine Hilfe!', 'Basic Phrases'),
('Bitte', 'Please/You are welcome', 'Bitte sehr! Gern geschehen.', 'Basic Phrases'),
('Entschuldigung', 'Excuse me/Sorry', 'Entschuldigung, wo ist der Bahnhof?', 'Basic Phrases'),
('Ja', 'Yes', 'Ja, das ist richtig.', 'Basic Phrases'),
('Nein', 'No', 'Nein, das möchte ich nicht.', 'Basic Phrases'),
('Wie geht es dir?', 'How are you?', 'Wie geht es dir heute?', 'Basic Phrases'),
('Mir geht es gut', 'I am fine', 'Mir geht es gut, danke!', 'Basic Phrases'),
('Freut mich', 'Nice to meet you', 'Freut mich, dich kennenzulernen!', 'Basic Phrases');

-- Helping Verbs
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('sein', 'to be', 'Ich bin müde.', 'Helping Verbs'),
('haben', 'to have', 'Ich habe einen Hund.', 'Helping Verbs'),
('werden', 'to become/will', 'Ich werde Lehrer.', 'Helping Verbs'),
('können', 'can/to be able to', 'Ich kann Deutsch sprechen.', 'Helping Verbs'),
('müssen', 'must/to have to', 'Ich muss zur Arbeit gehen.', 'Helping Verbs'),
('wollen', 'to want', 'Ich will nach Hause gehen.', 'Helping Verbs'),
('sollen', 'should/ought to', 'Du sollst mehr lernen.', 'Helping Verbs'),
('dürfen', 'may/to be allowed to', 'Darf ich hier sitzen?', 'Helping Verbs');

-- Common Verbs
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('gehen', 'to go', 'Ich gehe ins Kino.', 'Common Verbs'),
('kommen', 'to come', 'Kommst du mit mir?', 'Common Verbs'),
('machen', 'to do/make', 'Was machst du heute?', 'Common Verbs'),
('sagen', 'to say', 'Was sagst du dazu?', 'Common Verbs'),
('sehen', 'to see', 'Ich sehe einen Vogel.', 'Common Verbs'),
('geben', 'to give', 'Gibst du mir das Buch?', 'Common Verbs'),
('nehmen', 'to take', 'Ich nehme den Bus.', 'Common Verbs'),
('wissen', 'to know (facts)', 'Ich weiß es nicht.', 'Common Verbs');

-- Food & Drink
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Essen', 'Food/To eat', 'Das Essen schmeckt gut.', 'Food & Drink'),
('Trinken', 'To drink/Drink', 'Ich möchte Wasser trinken.', 'Food & Drink'),
('Brot', 'Bread', 'Ich esse gerne Brot.', 'Food & Drink'),
('Wasser', 'Water', 'Ein Glas Wasser, bitte.', 'Food & Drink'),
('Kaffee', 'Coffee', 'Ich trinke jeden Morgen Kaffee.', 'Food & Drink'),
('Tee', 'Tea', 'Möchtest du Tee oder Kaffee?', 'Food & Drink'),
('Milch', 'Milk', 'Die Milch ist frisch.', 'Food & Drink'),
('Apfel', 'Apple', 'Ein Apfel am Tag ist gesund.', 'Food & Drink');

-- Weather
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Wetter', 'Weather', 'Wie ist das Wetter heute?', 'Weather'),
('Sonne', 'Sun', 'Die Sonne scheint heute.', 'Weather'),
('Regen', 'Rain', 'Es gibt heute viel Regen.', 'Weather'),
('Schnee', 'Snow', 'Im Winter gibt es Schnee.', 'Weather'),
('Wind', 'Wind', 'Der Wind ist sehr stark.', 'Weather'),
('Kalt', 'Cold', 'Es ist sehr kalt draußen.', 'Weather'),
('Warm', 'Warm', 'Heute ist es warm und sonnig.', 'Weather'),
('Heiß', 'Hot', 'Im Sommer ist es sehr heiß.', 'Weather');

-- Family
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Familie', 'Family', 'Meine Familie ist groß.', 'Family'),
('Mutter', 'Mother', 'Meine Mutter ist Lehrerin.', 'Family'),
('Vater', 'Father', 'Mein Vater arbeitet viel.', 'Family'),
('Bruder', 'Brother', 'Ich habe einen Bruder.', 'Family'),
('Schwester', 'Sister', 'Meine Schwester ist jünger als ich.', 'Family'),
('Eltern', 'Parents', 'Meine Eltern sind nett.', 'Family'),
('Kind', 'Child', 'Sie haben ein Kind.', 'Family'),
('Baby', 'Baby', 'Das Baby schläft.', 'Family');

-- Hobbies
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Hobby', 'Hobby', 'Was ist dein Hobby?', 'Hobbies'),
('Lesen', 'Reading/To read', 'Ich lese gerne Bücher.', 'Hobbies'),
('Sport', 'Sport/Sports', 'Ich mache gerne Sport.', 'Hobbies'),
('Musik', 'Music', 'Ich höre gerne Musik.', 'Hobbies'),
('Tanzen', 'Dancing/To dance', 'Sie tanzt sehr gut.', 'Hobbies'),
('Schwimmen', 'Swimming/To swim', 'Im Sommer gehe ich schwimmen.', 'Hobbies'),
('Kochen', 'Cooking/To cook', 'Meine Mutter kocht sehr gut.', 'Hobbies'),
('Reisen', 'Traveling/To travel', 'Ich reise gerne nach Italien.', 'Hobbies');

-- Pronouns
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Ich', 'I', 'Ich heiße Anna.', 'Pronouns'),
('Du', 'You (informal)', 'Wie heißt du?', 'Pronouns'),
('Er', 'He', 'Er ist mein Bruder.', 'Pronouns'),
('Sie', 'She', 'Sie ist meine Schwester.', 'Pronouns'),
('Wir', 'We', 'Wir gehen ins Kino.', 'Pronouns'),
('Ihr', 'You (plural informal)', 'Kommt ihr mit?', 'Pronouns'),
('Sie', 'They/You (formal)', 'Sie sind sehr nett.', 'Pronouns'),
('Es', 'It', 'Es ist kalt heute.', 'Pronouns');

-- Questions
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Wer', 'Who', 'Wer bist du?', 'Questions'),
('Was', 'What', 'Was machst du?', 'Questions'),
('Wann', 'When', 'Wann kommst du?', 'Questions'),
('Wo', 'Where', 'Wo wohnst du?', 'Questions'),
('Warum', 'Why', 'Warum nicht?', 'Questions'),
('Wie', 'How', 'Wie geht es dir?', 'Questions'),
('Welche', 'Which', 'Welche Farbe magst du?', 'Questions'),
('Wie viel', 'How much/many', 'Wie viel kostet das?', 'Questions');

-- Numbers
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Eins', 'One', 'Ich habe eins Buch.', 'Numbers'),
('Zwei', 'Two', 'Ich habe zwei Katzen.', 'Numbers'),
('Drei', 'Three', 'Sie hat drei Kinder.', 'Numbers'),
('Vier', 'Four', 'Wir sind vier Personen.', 'Numbers'),
('Fünf', 'Five', 'Ich arbeite fünf Tage.', 'Numbers'),
('Zehn', 'Ten', 'Das kostet zehn Euro.', 'Numbers'),
('Hundert', 'Hundred', 'Hundert Jahre alt.', 'Numbers'),
('Tausend', 'Thousand', 'Tausend Dank!', 'Numbers');

-- Shopping
INSERT INTO vocabulary (word, meaning, example_sentence, category) VALUES
('Kaufen', 'To buy', 'Ich kaufe ein neues Buch.', 'Shopping'),
('Verkaufen', 'To sell', 'Er verkauft sein Auto.', 'Shopping'),
('Geschäft', 'Shop/Store', 'Das Geschäft ist geschlossen.', 'Shopping'),
('Geld', 'Money', 'Ich habe kein Geld.', 'Shopping'),
('Preis', 'Price', 'Was ist der Preis?', 'Shopping'),
('Teuer', 'Expensive', 'Das ist sehr teuer.', 'Shopping'),
('Billig', 'Cheap', 'Diese Schuhe sind billig.', 'Shopping'),
('Bezahlen', 'To pay', 'Wo kann ich bezahlen?', 'Shopping');

-- Done! Your vocabulary is now organized by themes.
