'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Moon, Sun, Volume2, Award, TrendingUp, Flame, BookOpen, LogOut, Plus, Edit, Trash2 } from 'lucide-react'

export default function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [flashcards, setFlashcards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [adminVocab, setAdminVocab] = useState([])
  const [editingVocab, setEditingVocab] = useState(null)
  
  // Auth form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authError, setAuthError] = useState('')
  
  // Admin form states
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [exampleSentence, setExampleSentence] = useState('')
  const [category, setCategory] = useState('A1')

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    if (token && user) {
      loadFlashcards()
      loadProgress()
      if (user.isAdmin) {
        loadAdminVocabulary()
      }
    }
  }, [token, user, selectedCategory])

  const handleAuth = async () => {
    setAuthError('')
    
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = authMode === 'login' 
        ? { email, password }
        : { email, password, name }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed')
        return
      }
      
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setEmail('')
      setPassword('')
      setName('')
    } catch (error) {
      setAuthError('An error occurred. Please try again.')
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const loadFlashcards = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? '/api/flashcards'
        : `/api/flashcards?category=${selectedCategory}`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await res.json()
      setFlashcards(data)
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error('Failed to load flashcards:', error)
    }
  }

  const loadProgress = async () => {
    try {
      const res = await fetch('/api/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await res.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const loadAdminVocabulary = async () => {
    try {
      const res = await fetch('/api/vocabulary', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await res.json()
      setAdminVocab(data)
    } catch (error) {
      console.error('Failed to load vocabulary:', error)
    }
  }

  const handleCardResponse = async (status) => {
    if (flashcards.length === 0) return
    
    const currentCard = flashcards[currentCardIndex]
    
    try {
      await fetch('/api/flashcards/progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vocabularyId: currentCard.id,
          status
        })
      })
      
      // Move to next card
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1)
      } else {
        setCurrentCardIndex(0)
      }
      
      setIsFlipped(false)
      loadProgress()
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      // Small delay to ensure cancellation completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'de-DE'
        utterance.rate = 0.9 // Slightly slower for clarity
        
        const voices = window.speechSynthesis.getVoices()
        const germanVoice = voices.find(voice => voice.lang.includes('de'))
        
        if (germanVoice) {
          utterance.voice = germanVoice
        }
        
        window.speechSynthesis.speak(utterance)
      }, 100)
    }
  }

  const handleCreateVocabulary = async () => {
    try {
      const res = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word,
          meaning,
          example_sentence: exampleSentence,
          category
        })
      })
      
      if (res.ok) {
        setWord('')
        setMeaning('')
        setExampleSentence('')
        setCategory('A1')
        loadAdminVocabulary()
      }
    } catch (error) {
      console.error('Failed to create vocabulary:', error)
    }
  }

  const handleUpdateVocabulary = async () => {
    try {
      const res = await fetch('/api/vocabulary', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingVocab.id,
          word,
          meaning,
          example_sentence: exampleSentence,
          category
        })
      })
      
      if (res.ok) {
        setEditingVocab(null)
        setWord('')
        setMeaning('')
        setExampleSentence('')
        setCategory('A1')
        loadAdminVocabulary()
      }
    } catch (error) {
      console.error('Failed to update vocabulary:', error)
    }
  }

  const handleDeleteVocabulary = async (id) => {
    if (!confirm('Are you sure you want to delete this vocabulary?')) return
    
    try {
      await fetch('/api/vocabulary', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      
      loadAdminVocabulary()
    } catch (error) {
      console.error('Failed to delete vocabulary:', error)
    }
  }

  const startEditing = (vocab) => {
    setEditingVocab(vocab)
    setWord(vocab.word)
    setMeaning(vocab.meaning)
    setExampleSentence(vocab.example_sentence || '')
    setCategory(vocab.category)
  }

  const cancelEditing = () => {
    setEditingVocab(null)
    setWord('')
    setMeaning('')
    setExampleSentence('')
    setCategory('A1')
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">🇩🇪 German Flashcards</CardTitle>
              <CardDescription className="text-center">Learn German vocabulary with fun!</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMode} onValueChange={setAuthMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {authError && <p className="text-red-500 text-sm">{authError}</p>}
                  <Button onClick={handleAuth} className="w-full">Login</Button>
                </TabsContent>
                <TabsContent value="signup" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {authError && <p className="text-red-500 text-sm">{authError}</p>}
                  <Button onClick={handleAuth} className="w-full">Sign Up</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentCard = flashcards[currentCardIndex]

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">German Flashcards</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {user.name}!</span>
              <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="learn" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="learn">Learn</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              {user.isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            {/* Learning Tab */}
            <TabsContent value="learn" className="mt-8">
              {/* Category Filter */}
              <div className="flex justify-center gap-2 mb-6">
                {['all', 'A1', 'A2', 'B1'].map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    size="sm"
                  >
                    {cat === 'all' ? 'All' : cat}
                  </Button>
                ))}
              </div>

              {flashcards.length === 0 ? (
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">No flashcards available. {user.isAdmin && 'Add some vocabulary in the Admin tab!'}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="max-w-2xl mx-auto">
                  {/* Flashcard */}
                  <div 
                    className="relative h-96 cursor-pointer mb-6"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div className={`absolute inset-0 transition-all duration-500 transform ${isFlipped ? 'rotate-y-180' : ''}`}
                         style={{ transformStyle: 'preserve-3d' }}>
                      {/* Front */}
                      <Card className={`absolute inset-0 ${isFlipped ? 'invisible' : 'visible'}`}
                            style={{ backfaceVisibility: 'hidden' }}>
                        <CardContent className="flex flex-col items-center justify-center h-full p-8">
                          <Badge className="mb-4">{currentCard.category}</Badge>
                          <h2 className="text-5xl font-bold mb-6 text-center">{currentCard.word}</h2>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              speakWord(currentCard.word)
                            }}
                          >
                            <Volume2 className="mr-2 h-5 w-5" />
                            Listen
                          </Button>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">Click to flip</p>
                        </CardContent>
                      </Card>
                      
                      {/* Back */}
                      <Card className={`absolute inset-0 ${!isFlipped ? 'invisible' : 'visible'} bg-indigo-50 dark:bg-indigo-900`}
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <CardContent className="flex flex-col items-center justify-center h-full p-8">
                          <h3 className="text-3xl font-bold mb-4 text-center text-indigo-900 dark:text-indigo-100">{currentCard.meaning}</h3>
                          {currentCard.example_sentence && (
                            <p className="text-lg text-gray-700 dark:text-gray-300 text-center italic mb-6">"{currentCard.example_sentence}"</p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to flip back</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isFlipped && (
                    <div className="flex gap-4 justify-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleCardResponse('learning')}
                        className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900"
                      >
                        Need Practice
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleCardResponse('known')}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        I Know This!
                      </Button>
                    </div>
                  )}

                  {/* Progress indicator */}
                  <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="mt-8">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Words Learned</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{progress?.progress?.words_learned || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <Flame className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{progress?.progress?.current_streak_days || 0} days</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{progress?.progress?.total_xp || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Badges */}
              <Card className="max-w-4xl mx-auto mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Your Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progress?.badges?.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">No badges earned yet. Keep learning!</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {progress?.badges?.map((userBadge) => (
                        <div key={userBadge.id} className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="text-4xl mb-2">{userBadge.badges.icon}</div>
                          <h4 className="font-semibold text-sm text-center">{userBadge.badges.name}</h4>
                          <p className="text-xs text-gray-500 text-center mt-1">{userBadge.badges.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Tab */}
            {user.isAdmin && (
              <TabsContent value="admin" className="mt-8">
                <div className="max-w-4xl mx-auto">
                  {/* Add/Edit Vocabulary Form */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>{editingVocab ? 'Edit Vocabulary' : 'Add New Vocabulary'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="word">German Word</Label>
                          <Input
                            id="word"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            placeholder="e.g., Hallo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="meaning">English Meaning</Label>
                          <Input
                            id="meaning"
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            placeholder="e.g., Hello"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="example">Example Sentence (Optional)</Label>
                        <Input
                          id="example"
                          value={exampleSentence}
                          onChange={(e) => setExampleSentence(e.target.value)}
                          placeholder="e.g., Hallo, wie geht es dir?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="A1">A1 (Beginner)</option>
                          <option value="A2">A2 (Elementary)</option>
                          <option value="B1">B1 (Intermediate)</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        {editingVocab ? (
                          <>
                            <Button onClick={handleUpdateVocabulary}>Update Vocabulary</Button>
                            <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                          </>
                        ) : (
                          <Button onClick={handleCreateVocabulary}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vocabulary
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vocabulary List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>All Vocabulary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {adminVocab.map((vocab) => (
                          <div key={vocab.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{vocab.word}</h4>
                                <Badge variant="outline">{vocab.category}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{vocab.meaning}</p>
                              {vocab.example_sentence && (
                                <p className="text-xs text-gray-500 italic mt-1">{vocab.example_sentence}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing(vocab)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVocabulary(vocab.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {adminVocab.length === 0 && (
                          <p className="text-center text-gray-600 dark:text-gray-400 py-8">No vocabulary added yet.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
