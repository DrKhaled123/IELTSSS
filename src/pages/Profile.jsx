import { useState, useEffect, useCallback } from 'react'
import { User, Lock, Save, PlusCircle, Trash2, CheckCircle, Circle, Volume2, Languages } from 'lucide-react'
import { openDB } from '../utils/indexedDB'

const Profile = () => {
     const [isLoggedIn, setIsLoggedIn] = useState(false)
     const [username, setUsername] = useState('')
     const [password, setPassword] = useState('')
     const [storedUsername, setStoredUsername] = useState('')
     const [storedPassword, setStoredPassword] = useState('')
     const [customWords, setCustomWords] = useState([])
     const [newWord, setNewWord] = useState({
          word: '',
          definition: '',
          arabic: '',
          pronunciation: ''
     })
     const [missions, setMissions] = useState({
          activeListening: { completed: false, target: 5, label: 'Listen to 5 minutes English with active listening' },
          learnWords: { completed: false, target: 5, label: 'Learn new 5 words in English' },
          readPassage: { completed: false, target: 1, label: 'Read loudly new passage, understand it and enhance pronunciation' }
     })

     // Initialize IndexedDB
     useEffect(() => {
          const initDB = async () => {
               try {
                    const db = await openDB()

                    // Load user credentials
                    const credentials = await db.get('userProfile', 'credentials')
                    if (credentials) {
                         setStoredUsername(credentials.username)
                         setStoredPassword(credentials.password)
                    }

                    // Load custom words if logged in
                    if (isLoggedIn) {
                         const words = await db.getAll('customWords')
                         setCustomWords(words || [])
                    }

                    // Load missions
                    const savedMissions = await db.get('userProfile', 'missions')
                    if (savedMissions) {
                         setMissions(savedMissions)
                    }
               } catch (error) {
                    console.error('Error initializing profile:', error)
               }
          }

          initDB()
     }, [isLoggedIn])

     // Check if already logged in from localStorage
     useEffect(() => {
          const loggedInUser = localStorage.getItem('ielts_username')
          if (loggedInUser) {
               setUsername(loggedInUser)
               setIsLoggedIn(true)
          }
     }, [])

     const handleLogin = useCallback(async () => {
          if (!username || !password) {
               alert('Please enter both username and password')
               return
          }

          try {
               const db = await openDB()

               // Check if this is first time (no stored credentials)
               if (!storedUsername) {
                    // Save new credentials
                    await db.put('userProfile', { username, password }, 'credentials')
                    setStoredUsername(username)
                    setStoredPassword(password)
                    setIsLoggedIn(true)
                    localStorage.setItem('ielts_username', username)
                    alert('Profile created successfully!')
               } else {
                    // Verify credentials
                    if (username === storedUsername && password === storedPassword) {
                         setIsLoggedIn(true)
                         localStorage.setItem('ielts_username', username)
                    } else {
                         alert('Invalid username or password')
                    }
               }
          } catch (error) {
               console.error('Login error:', error)
               alert('Error logging in')
          }
     }, [username, password, storedUsername, storedPassword])

     const handleLogout = useCallback(() => {
          setIsLoggedIn(false)
          setUsername('')
          setPassword('')
          localStorage.removeItem('ielts_username')
     }, [])

     const handleAddWord = useCallback(async () => {
          if (!newWord.word || !newWord.definition || !newWord.arabic) {
               alert('Please fill in word, definition, and Arabic translation')
               return
          }

          try {
               const db = await openDB()
               const wordToAdd = {
                    ...newWord,
                    id: Date.now(),
                    username: storedUsername,
                    createdAt: new Date().toISOString()
               }

               await db.add('customWords', wordToAdd)
               setCustomWords([...customWords, wordToAdd])
               setNewWord({ word: '', definition: '', arabic: '', pronunciation: '' })
               alert('Word added successfully!')
          } catch (error) {
               console.error('Error adding word:', error)
               alert('Error adding word')
          }
     }, [newWord, storedUsername, customWords])

     const handleDeleteWord = useCallback(async (id) => {
          try {
               const db = await openDB()
               await db.delete('customWords', id)
               setCustomWords(customWords.filter(w => w.id !== id))
          } catch (error) {
               console.error('Error deleting word:', error)
          }
     }, [customWords])

     const handleToggleMission = useCallback(async (missionKey) => {
          const updatedMissions = {
               ...missions,
               [missionKey]: {
                    ...missions[missionKey],
                    completed: !missions[missionKey].completed
               }
          }
          setMissions(updatedMissions)

          try {
               const db = await openDB()
               await db.put('userProfile', updatedMissions, 'missions')
          } catch (error) {
               console.error('Error saving mission:', error)
          }
     }, [missions])

     const speakWord = useCallback((text, lang = 'en-US') => {
          if ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined') {
               const utterance = new window.SpeechSynthesisUtterance(text)
               utterance.lang = lang
               utterance.rate = 0.8
               window.speechSynthesis.speak(utterance)
          }
     }, [])

     if (!isLoggedIn) {
          return (
               <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
                    <header>
                         <h1>Your Profile</h1>
                         <p style={{ color: 'var(--color-text-secondary)' }}>Login or create your account</p>
                    </header>

                    <div className="card" style={{ maxWidth: '500px', margin: '0 auto', marginTop: 'var(--space-2xl)' }}>
                         <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                              <User size={24} />
                              {storedUsername ? 'Login to Your Account' : 'Create Your Profile'}
                         </h3>

                         <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                              <div>
                                   <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-medium)' }}>
                                        Username
                                   </label>
                                   <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                   />
                              </div>

                              <div>
                                   <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-medium)' }}>
                                        Password
                                   </label>
                                   <input
                                        type="password"
                                        className="input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                   />
                              </div>

                              <button className="btn btn-primary" onClick={handleLogin} style={{ marginTop: 'var(--space-md)' }}>
                                   <Lock size={20} />
                                   {storedUsername ? 'Login' : 'Create Profile'}
                              </button>
                         </div>
                    </div>
               </div>
          )
     }

     return (
          <div className="container animate-fadeIn" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
               <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div>
                         <h1>Welcome, {storedUsername}!</h1>
                         <p style={{ color: 'var(--color-text-secondary)' }}>Track your progress and manage your vocabulary</p>
                    </div>
                    <button className="btn btn-secondary" onClick={handleLogout}>
                         Logout
                    </button>
               </header>

               {/* Missions Section */}
               <div className="card" style={{ marginTop: 'var(--space-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-xl)' }}>Today's Missions</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                         {Object.entries(missions).map(([key, mission]) => (
                              <div
                                   key={key}
                                   onClick={() => handleToggleMission(key)}
                                   style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        padding: 'var(--space-lg)',
                                        background: mission.completed ? 'hsla(142, 71%, 45%, 0.1)' : 'var(--color-bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        border: mission.completed ? '2px solid hsl(142, 71%, 45%)' : '1px solid var(--color-border)',
                                        transition: 'all var(--transition-fast)'
                                   }}
                              >
                                   {mission.completed ? (
                                        <CheckCircle size={24} style={{ color: 'hsl(142, 71%, 45%)' }} />
                                   ) : (
                                        <Circle size={24} style={{ color: 'var(--color-text-tertiary)' }} />
                                   )}
                                   <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-xs)' }}>
                                             {mission.label}
                                        </p>
                                        {mission.completed && (
                                             <p style={{ fontSize: 'var(--font-sm)', color: 'hsl(142, 71%, 45%)' }}>
                                                  ✓ Completed today!
                                             </p>
                                        )}
                                   </div>
                              </div>
                         ))}</div>
               </div>

               {/* Custom Words Section */}
               <div className="card" style={{ marginTop: 'var(--space-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-xl)' }}>My Custom Vocabulary</h3>

                    {/* Add New Word Form */}
                    <div style={{
                         padding: 'var(--space-lg)',
                         background: 'var(--color-bg-elevated)',
                         borderRadius: 'var(--radius-lg)',
                         marginBottom: 'var(--space-xl)'
                    }}>
                         <h4 style={{ marginBottom: 'var(--space-md)' }}>Add New Word</h4>
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                              <input
                                   type="text"
                                   className="input"
                                   placeholder="English Word"
                                   value={newWord.word}
                                   onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                              />
                              <input
                                   type="text"
                                   className="input"
                                   placeholder="Definition"
                                   value={newWord.definition}
                                   onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                              />
                              <input
                                   type="text"
                                   className="input"
                                   placeholder="Arabic Translation"
                                   value={newWord.arabic}
                                   onChange={(e) => setNewWord({ ...newWord, arabic: e.target.value })}
                              />
                              <input
                                   type="text"
                                   className="input"
                                   placeholder="Pronunciation (optional)"
                                   value={newWord.pronunciation}
                                   onChange={(e) => setNewWord({ ...newWord, pronunciation: e.target.value })}
                              />
                         </div>
                         <button className="btn btn-primary" onClick={handleAddWord} style={{ marginTop: 'var(--space-md)' }}>
                              <PlusCircle size={20} />
                              Add Word
                         </button>
                    </div>

                    {/* Custom Words List */}
                    {customWords.length > 0 ? (
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                              {customWords.map((word) => (
                                   <div key={word.id} className="card" style={{ position: 'relative' }}>
                                        <button
                                             onClick={() => handleDeleteWord(word.id)}
                                             style={{
                                                  position: 'absolute',
                                                  top: 'var(--space-sm)',
                                                  right: 'var(--space-sm)',
                                                  background: 'transparent',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  color: 'var(--color-danger)',
                                                  padding: 'var(--space-xs)'
                                             }}
                                        >
                                             <Trash2 size={18} />
                                        </button>

                                        <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
                                             {word.word}
                                        </h4>
                                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                             {word.definition}
                                        </p>
                                        <p style={{ fontSize: 'var(--font-md)', textAlign: 'right', color: 'var(--color-text-tertiary)', fontWeight: 'bold' }}>
                                             {word.arabic}
                                        </p>
                                        {word.pronunciation && (
                                             <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: 'var(--space-xs)' }}>
                                                  [{word.pronunciation}]
                                             </p>
                                        )}

                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                             <button
                                                  className="btn btn-sm btn-primary"
                                                  onClick={() => speakWord(word.word, 'en-US')}
                                                  title="Listen in English"
                                             >
                                                  <Volume2 size={16} />
                                                  EN
                                             </button>
                                             <button
                                                  className="btn btn-sm btn-secondary"
                                                  onClick={() => speakWord(word.arabic, 'ar-SA')}
                                                  title="Listen in Arabic"
                                             >
                                                  <Languages size={16} />
                                                  AR
                                             </button>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    ) : (
                         <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-2xl)' }}>
                              No custom words yet. Add your first word above!
                         </p>
                    )}
               </div>
          </div>
     )
}

export default Profile
