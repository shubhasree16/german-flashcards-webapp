'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Moon, Sun, Volume2, Award, TrendingUp, Flame, BookOpen, LogOut, Plus, Edit, Trash2, Sparkles } from 'lucide-react'

export default function App() {
  const [mounted, setMounted] = useState(false)
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

  // Handle mounting to avoid hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode, mounted])

  useEffect(() => {
    if (!mounted) return
    
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [mounted])

  useEffect(() => {
    if (token && user) {
      loadFlashcards()
      loadProgress()
      if (user.isAdmin) {
        loadAdminVocabulary()
      }
    }
  }, [token, user, selectedCategory])

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
  }, [])

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-blue-100">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl">
                  <BookOpen className="h-12 w-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">German Flashcards</CardTitle>
              <CardDescription className="text-base">Learn German vocabulary with fun! 🎉</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMode} onValueChange={setAuthMode}>
                <TabsList className="grid w-full grid-cols-2 bg-blue-100 dark:bg-blue-900">
                  <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
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
                      className="border-blue-200 focus:border-blue-500"
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
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  {authError && <p className="text-red-500 text-sm">{authError}</p>}
                  <Button onClick={handleAuth} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">Login</Button>
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
                      className="border-blue-200 focus:border-blue-500"
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
                      className="border-blue-200 focus:border-blue-500"
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
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  {authError && <p className="text-red-500 text-sm">{authError}</p>}
                  <Button onClick={handleAuth} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">Sign Up</Button>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md border-b border-blue-100 dark:border-gray-700 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">German Flashcards</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium hidden sm:block">Welcome, {user.name}! 👋</span>
              <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)} className="border-blue-200 hover:bg-blue-50">
                {darkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-600" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-blue-200 hover:bg-blue-50">
                <LogOut className="h-4 w-4 text-blue-600" />
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="learn" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md border border-blue-100">
              <TabsTrigger value="learn" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Learn</TabsTrigger>
              <TabsTrigger value="progress" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Progress</TabsTrigger>
              {user.isAdmin && <TabsTrigger value="admin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Admin</TabsTrigger>}
            </TabsList>

            {/* Learning Tab */}
            <TabsContent value="learn" className="mt-8">
              {/* Category Filter */}
              <div className="flex justify-center gap-2 mb-8">
                {['all', 'A1', 'A2', 'B1'].map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    size="sm"
                    className={selectedCategory === cat ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'border-blue-200 hover:bg-blue-50'}
                  >
                    {cat === 'all' ? 'All Levels' : cat}
                  </Button>
                ))}
              </div>

              {flashcards.length === 0 ? (
                <Card className="max-w-2xl mx-auto shadow-xl border-blue-100">
                  <CardContent className="p-12 text-center">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">No flashcards available. {user.isAdmin && 'Add some vocabulary in the Admin tab!'}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Flashcard */}
                  <div className="relative h-96 perspective-1000">
                    <div 
                      className={`relative h-full cursor-pointer transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                      onClick={() => setIsFlipped(!isFlipped)}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Front */}
                      <Card className={`absolute inset-0 backface-hidden shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900 ${isFlipped ? 'invisible' : 'visible'}`}
                            style={{ backfaceVisibility: 'hidden' }}>
                        <CardContent className="flex flex-col items-center justify-center h-full p-8">
                          <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-sm font-semibold shadow-lg">
                            {currentCard.category}
                          </Badge>
                          <h2 className="text-6xl font-bold mb-8 text-center bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            {currentCard.word}
                          </h2>
                          <Button
                            variant="default"
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              speakWord(currentCard.word)
                            }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                          >
                            <Volume2 className="mr-2 h-5 w-5" />
                            Listen
                          </Button>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-8 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Click to flip and see the meaning
                          </p>
                        </CardContent>
                      </Card>
                      
                      {/* Back */}
                      <Card className={`absolute inset-0 backface-hidden shadow-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900 dark:to-purple-900 ${!isFlipped ? 'invisible' : 'visible'}`}
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <CardContent className="flex flex-col items-center justify-center h-full p-8">
                          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                            <h3 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                              {currentCard.meaning}
                            </h3>
                            {currentCard.example_sentence && (
                              <div className="mt-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Example:</p>
                                <p className="text-lg text-gray-800 dark:text-gray-200 text-center italic">
                                  "{currentCard.example_sentence}"
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-8 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Click to flip back
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isFlipped && (
                    <div className="flex gap-4 justify-center animate-fadeIn">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleCardResponse('learning')}
                        className="border-2 border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900 font-semibold shadow-lg px-8"
                      >
                        Need Practice 📝
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleCardResponse('known')}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg px-8"
                      >
                        I Know This! ✓
                      </Button>
                    </div>
                  )}

                  {/* Progress indicator */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-md border border-blue-100">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Card {currentCardIndex + 1} of {flashcards.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="mt-8">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card className="shadow-xl border-blue-100 hover:shadow-2xl transition-shadow bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Words Learned</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{progress?.progress?.words_learned || 0}</div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-orange-100 hover:shadow-2xl transition-shadow bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Streak</CardTitle>
                    <Flame className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{progress?.progress?.current_streak_days || 0} days</div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-purple-100 hover:shadow-2xl transition-shadow bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total XP</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{progress?.progress?.total_xp || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Badges */}
              <Card className="max-w-4xl mx-auto mt-6 shadow-xl border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Award className="h-6 w-6 text-yellow-500" />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Your Badges</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progress?.badges?.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <Sparkles className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">No badges earned yet. Keep learning!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {progress?.badges?.map((userBadge) => (
                        <div key={userBadge.id} className="flex flex-col items-center p-6 border-2 border-blue-100 dark:border-gray-700 rounded-2xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900 hover:shadow-xl transition-all hover:scale-105">
                          <div className="text-5xl mb-3">{userBadge.badges.icon}</div>
                          <h4 className="font-bold text-sm text-center text-blue-700 dark:text-blue-300">{userBadge.badges.name}</h4>
                          <p className="text-xs text-gray-500 text-center mt-2">{userBadge.badges.description}</p>
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
                  <Card className="mb-6 shadow-xl border-blue-100">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
                      <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {editingVocab ? 'Edit Vocabulary' : 'Add New Vocabulary'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="word">German Word</Label>
                          <Input
                            id="word"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            placeholder="e.g., Hallo"
                            className="border-blue-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="meaning">English Meaning</Label>
                          <Input
                            id="meaning"
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            placeholder="e.g., Hello"
                            className="border-blue-200 focus:border-blue-500"
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
                          className="border-blue-200 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-blue-200 bg-background px-3 py-2 text-sm focus:border-blue-500"
                        >
                          <option value="A1">A1 (Beginner)</option>
                          <option value="A2">A2 (Elementary)</option>
                          <option value="B1">B1 (Intermediate)</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        {editingVocab ? (
                          <>
                            <Button onClick={handleUpdateVocabulary} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">Update Vocabulary</Button>
                            <Button variant="outline" onClick={cancelEditing} className="border-blue-200 hover:bg-blue-50">Cancel</Button>
                          </>
                        ) : (
                          <Button onClick={handleCreateVocabulary} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vocabulary
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vocabulary List */}
                  <Card className="shadow-xl border-blue-100">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
                      <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">All Vocabulary</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-6">
                      <div className="space-y-3">
                        {adminVocab.map((vocab) => (
                          <div key={vocab.id} className="flex items-center justify-between p-4 border-2 border-blue-100 dark:border-gray-700 rounded-xl bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900 hover:shadow-lg transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg text-blue-700 dark:text-blue-300">{vocab.word}</h4>
                                <Badge variant="outline" className="border-blue-400 text-blue-600">{vocab.category}</Badge>
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
                                className="border-blue-200 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVocabulary(vocab.id)}
                                className="border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {adminVocab.length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400">No vocabulary added yet.</p>
                          </div>
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
