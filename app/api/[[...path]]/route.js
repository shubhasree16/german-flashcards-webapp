import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { generateToken, getUserFromRequest } from '../../../lib/auth.js'
import bcrypt from 'bcryptjs'

// Helper function to get admin client
function getAdminClient() {
  return supabaseAdmin()
}

// ============= AUTH ROUTES =============

async function handleForgotPassword(request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    // Check if user exists
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()
    
    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      })
    }
    
    // Generate reset token (6-digit code)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    
    // Store reset token in users table
    await admin
      .from('users')
      .update({ 
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry
      })
      .eq('id', user.id)
    
    // Send email using Supabase Functions or external service
    // For now, we'll return the token (in production, send via email)
    // TODO: Integrate with email service
    
    console.log(`Reset token for ${email}: ${resetToken}`) // Development only
    
    return NextResponse.json({ 
      message: 'If an account exists with this email, you will receive a password reset link.',
      // Remove this in production - only for development
      resetToken: resetToken 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleResetPassword(request) {
  try {
    const { email, resetToken, newPassword } = await request.json()
    
    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    // Get user with reset token
    const { data: user, error: userError } = await admin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('reset_token', resetToken)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }
    
    // Check if token is expired
    if (new Date(user.reset_token_expiry) < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    // Update password and clear reset token
    const { error: updateError } = await admin
      .from('users')
      .update({ 
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null
      })
      .eq('id', user.id)
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleSignup(request) {
  try {
    const { email, password, name } = await request.json()
    
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    // Check if user exists
    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Create user
    const { data: user, error } = await admin
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        name,
        is_admin: false
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    
    // Create initial progress record
    await admin.from('user_progress').insert([{
      user_id: user.id,
      words_learned: 0,
      daily_streak: 0,
      current_streak_days: 0,
      total_xp: 0,
      last_active_date: new Date().toISOString().split('T')[0]
    }])
    
    const token = generateToken(user.id, user.email, user.is_admin)
    
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleLogin(request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    // Get user
    const { data: user, error } = await admin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    const token = generateToken(user.id, user.email, user.is_admin)
    
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleGetUser(request) {
  try {
    const userInfo = getUserFromRequest(request)
    
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    
    const { data: user, error } = await admin
      .from('users')
      .select('id, email, name, is_admin')
      .eq('id', userInfo.userId)
      .single()
    
    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============= VOCABULARY ROUTES =============

async function handleGetVocabulary(request) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    const admin = getAdminClient()
    
    let query = admin.from('vocabulary').select('*')
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Get vocabulary error:', error)
      return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get vocabulary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleCreateVocabulary(request) {
  try {
    const userInfo = getUserFromRequest(request)
    
    if (!userInfo || !userInfo.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }
    
    const { word, meaning, example_sentence, category } = await request.json()
    
    if (!word || !meaning || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    const { data, error } = await admin
      .from('vocabulary')
      .insert([{
        word,
        meaning,
        example_sentence: example_sentence || '',
        category
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Create vocabulary error:', error)
      return NextResponse.json({ error: 'Failed to create vocabulary' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create vocabulary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleUpdateVocabulary(request) {
  try {
    const userInfo = getUserFromRequest(request)
    
    if (!userInfo || !userInfo.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }
    
    const { id, word, meaning, example_sentence, category } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Missing vocabulary ID' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    const updateData = {}
    if (word) updateData.word = word
    if (meaning) updateData.meaning = meaning
    if (example_sentence !== undefined) updateData.example_sentence = example_sentence
    if (category) updateData.category = category
    
    const { data, error } = await admin
      .from('vocabulary')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Update vocabulary error:', error)
      return NextResponse.json({ error: 'Failed to update vocabulary' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update vocabulary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleDeleteVocabulary(request) {
  try {
    const userInfo = getUserFromRequest(request)
    
    if (!userInfo || !userInfo.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }
    
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Missing vocabulary ID' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    const { error } = await admin
      .from('vocabulary')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Delete vocabulary error:', error)
      return NextResponse.json({ error: 'Failed to delete vocabulary' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete vocabulary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============= FLASHCARD ROUTES =============

async function handleGetFlashcards(request) {
  try {
    const userInfo = getUserFromRequest(request)
    
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    const admin = getAdminClient()
    
    // Get all vocabulary
    let vocabQuery = admin.from('vocabulary').select('*')
    
    if (category) {
      vocabQuery = vocabQuery.eq('category', category)
    }
    
    const { data: vocabulary, error: vocabError } = await vocabQuery
    
    if (vocabError) {
      console.error('Get flashcards error:', vocabError)
      return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 })
    }
    
    // Get user progress for these vocabulary items
    const { data: progress } = await admin
      .from('user_vocabulary_progress')
      .select('*')
      .eq('user_id', userInfo.userId)
    
    // Combine data
    const flashcards = vocabulary.map(vocab => {
      const userProgress = progress?.find(p => p.vocabulary_id === vocab.id)
      return {
        ...vocab,
        userStatus: userProgress?.status || 'new',
        timesReviewed: userProgress?.times_reviewed || 0,
        lastReviewed: userProgress?.last_reviewed
      }
    })
    
    return NextResponse.json(flashcards)
  } catch (error) {
    console.error('Get flashcards error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleUpdateFlashcardProgress(request) {
  try {
    const userInfo = getUserFromRequest(request)
    
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { vocabularyId, status } = await request.json()
    
    if (!vocabularyId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getAdminClient()
    
    // Check if progress record exists
    const { data: existing } = await admin
      .from('user_vocabulary_progress')
      .select('*')
      .eq('user_id', userInfo.userId)
      .eq('vocabulary_id', vocabularyId)
      .single()
    
    const now = new Date().toISOString()
    
    if (existing) {
      // Update existing
      await admin
        .from('user_vocabulary_progress')
        .update({
          status,
          last_reviewed: now,
          times_reviewed: (existing.times_reviewed || 0) + 1
        })
        .eq('id', existing.id)
    } else {
      // Create new
      await admin
        .from('user_vocabulary_progress')
        .insert([{
          user_id: userInfo.userId,
          vocabulary_id: vocabularyId,
          status,
          last_reviewed: now,
          times_reviewed: 1
        }])
    }
    
    // Update user progress (words learned, XP)
    if (status === 'known') {
      const { data: userProgress } = await admin
        .from('user_progress')
        .select('*')
        .eq('user_id', userInfo.userId)
        .single()
      
      if (userProgress) {
        const today = new Date().toISOString().split('T')[0]
        const lastActiveDate = userProgress.last_active_date
        
        let newStreakDays = userProgress.current_streak_days || 0
        
        // Check if this is a new day
        if (lastActiveDate !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          
          if (lastActiveDate === yesterdayStr) {
            newStreakDays += 1
          } else {
            newStreakDays = 1
          }
        }
        
        await admin
          .from('user_progress')
          .update({
            words_learned: (userProgress.words_learned || 0) + 1,
            total_xp: (userProgress.total_xp || 0) + 10,
            current_streak_days: newStreakDays,
            last_active_date: today
          })
          .eq('user_id', userInfo.userId)
        
        // Check and award badges
        await checkAndAwardBadges(userInfo.userId, admin)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update flashcard progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============= PROGRESS ROUTES =============

async function handleGetProgress(request) {
  try {
    const userInfo = getUserFromRequest(request)
    
    if (!userInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    
    const { data: progress, error } = await admin
      .from('user_progress')
      .select('*')
      .eq('user_id', userInfo.userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Get progress error:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }
    
    // Get badges
    const { data: userBadges } = await admin
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', userInfo.userId)
    
    return NextResponse.json({
      progress: progress || {
        words_learned: 0,
        daily_streak: 0,
        current_streak_days: 0,
        total_xp: 0
      },
      badges: userBadges || []
    })
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============= BADGE HELPER =============

async function checkAndAwardBadges(userId, admin) {
  try {
    // Get user progress
    const { data: progress } = await admin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!progress) return
    
    // Get all badges
    const { data: allBadges } = await admin
      .from('badges')
      .select('*')
    
    // Get already earned badges
    const { data: earnedBadges } = await admin
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
    
    const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || [])
    
    // Check each badge
    for (const badge of allBadges || []) {
      if (earnedBadgeIds.has(badge.id)) continue
      
      let shouldAward = false
      
      if (badge.criteria_type === 'words_learned' && progress.words_learned >= badge.criteria_value) {
        shouldAward = true
      } else if (badge.criteria_type === 'streak_days' && progress.current_streak_days >= badge.criteria_value) {
        shouldAward = true
      }
      
      if (shouldAward) {
        await admin
          .from('user_badges')
          .insert([{
            user_id: userId,
            badge_id: badge.id,
            earned_at: new Date().toISOString()
          }])
      }
    }
  } catch (error) {
    console.error('Badge check error:', error)
  }
}

// ============= MAIN ROUTER =============

export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  
  if (path === 'auth/user') {
    return handleGetUser(request)
  } else if (path === 'vocabulary') {
    return handleGetVocabulary(request)
  } else if (path === 'flashcards') {
    return handleGetFlashcards(request)
  } else if (path === 'progress') {
    return handleGetProgress(request)
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  
  if (path === 'auth/signup') {
    return handleSignup(request)
  } else if (path === 'auth/login') {
    return handleLogin(request)
  } else if (path === 'auth/forgot-password') {
    return handleForgotPassword(request)
  } else if (path === 'auth/reset-password') {
    return handleResetPassword(request)
  } else if (path === 'vocabulary') {
    return handleCreateVocabulary(request)
  } else if (path === 'flashcards/progress') {
    return handleUpdateFlashcardProgress(request)
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  
  if (path === 'vocabulary') {
    return handleUpdateVocabulary(request)
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')
  
  if (path === 'vocabulary') {
    return handleDeleteVocabulary(request)
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
