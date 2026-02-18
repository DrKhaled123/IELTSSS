import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react'

const IELTS_TIMES = {
  reading: 60 * 60,      // 60 minutes
  listening: 30 * 60,    // 30 minutes (+ 10 min transfer)
  writing: 60 * 60,      // 60 minutes (per task)
  speaking: 15 * 60,     // 11-15 minutes range
}

export function useIELTSTimer(section = 'reading', options = {}) {
  const { 
    autoStart = false, 
    onTimeUp = () => {}, 
    onWarning = () => {} 
  } = options
  
  const [timeLeft, setTimeLeft] = useState(IELTS_TIMES[section] || 60 * 60)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)
  const warningTriggered = useRef(false)

  const start = useCallback(() => {
    setIsRunning(true)
    setIsPaused(false)
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const reset = useCallback(() => {
    setTimeLeft(IELTS_TIMES[section] || 60 * 60)
    setIsRunning(false)
    setIsPaused(false)
    warningTriggered.current = false
  }, [section])

  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            onTimeUp()
            return 0
          }
          
          // Trigger warning at 5 minutes remaining
          if (prev === 5 * 60 && !warningTriggered.current) {
            warningTriggered.current = true
            onWarning()
          }
          
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, onTimeUp, onWarning])

  return {
    timeLeft,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    formattedTime: formatTime(timeLeft),
    progress: 1 - (timeLeft / (IELTS_TIMES[section] || 60 * 60))
  }
}

export function IELTSTimerDisplay({ 
  section = 'reading', 
  className = '',
  size = 'medium',
  showControls = true,
  onTimeUp,
  onWarning 
}) {
  const [showWarning, setShowWarning] = useState(false)
  
  const handleWarning = useCallback(() => {
    setShowWarning(true)
    if (onWarning) onWarning()
    setTimeout(() => setShowWarning(false), 5000)
  }, [onWarning])

  const timer = useIELTSTimer(section, { onTimeUp, onWarning: handleWarning })

  const sizeStyles = {
    small: { padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--font-lg)' },
    medium: { padding: 'var(--space-md) var(--space-lg)', fontSize: 'var(--font-xl)' },
    large: { padding: 'var(--space-lg) var(--space-xl)', fontSize: 'var(--font-2xl)' }
  }

  const isLowTime = timer.timeLeft <= 5 * 60
  const isCritical = timer.timeLeft <= 60

  return (
    <div 
      className={`ielts-timer ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        background: showWarning ? 'var(--color-warning-bg, #fef3c7)' : 'var(--color-surface)',
        border: `2px solid ${isCritical ? 'var(--color-error)' : isLowTime ? 'var(--color-warning)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        ...sizeStyles[size]
      }}
    >
      <Clock 
        size={size === 'large' ? 32 : size === 'medium' ? 24 : 20} 
        style={{ 
          color: isCritical ? 'var(--color-error)' : isLowTime ? 'var(--color-warning)' : 'var(--color-primary)',
          animation: timer.isRunning && !timer.isPaused ? 'pulse 1s ease-in-out infinite' : 'none'
        }} 
      />
      
      <span 
        style={{
          fontFamily: 'monospace',
          fontWeight: 'var(--font-bold)',
          color: isCritical ? 'var(--color-error)' : isLowTime ? 'var(--color-warning)' : 'var(--color-text)',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {timer.formattedTime}
      </span>

      {showWarning && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-xs)',
          color: 'var(--color-warning)',
          fontSize: 'var(--font-sm)'
        }}>
          <AlertCircle size={16} />
          5 minutes remaining!
        </span>
      )}

      {showControls && (
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginLeft: 'auto' }}>
          {!timer.isRunning ? (
            <button
              onClick={timer.start}
              style={{
                padding: 'var(--space-sm)',
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'white'
              }}
              title="Start timer"
            >
              <Play size={18} />
            </button>
          ) : (
            <button
              onClick={timer.isPaused ? timer.resume : timer.pause}
              style={{
                padding: 'var(--space-sm)',
                background: timer.isPaused ? 'var(--color-success)' : 'var(--color-warning)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'white'
              }}
              title={timer.isPaused ? "Resume" : "Pause"}
            >
              <Pause size={18} />
            </button>
          )}
          
          <button
            onClick={timer.reset}
            style={{
              padding: 'var(--space-sm)',
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--color-text)'
            }}
            title="Reset timer"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default IELTSTimerDisplay
