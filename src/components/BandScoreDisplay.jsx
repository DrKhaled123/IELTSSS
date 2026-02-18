import { Award, TrendingUp, BookOpen, Headphones, PenTool, MessageCircle } from 'lucide-react'
import { 
  calculateListeningReadingBand, 
  calculateWritingBand, 
  calculateSpeakingBand,
  calculateOverallBand,
  getBandDescription,
  formatBand,
  getBandColor 
} from '../utils/bandCalculator'

/**
 * IELTS Band Score Display Component
 * Shows individual section scores and overall band
 */

const SECTION_ICONS = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: MessageCircle
}

const SECTION_NAMES = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking'
}

export function BandScoreCard({ 
  section, 
  band, 
  rawScore, 
  totalQuestions,
  criteria = null,
  size = 'medium',
  showDescription = true 
}) {
  const Icon = SECTION_ICONS[section] || Award
  const formattedBand = formatBand(band)
  const color = getBandColor(band)
  const description = getBandDescription(band)

  const sizeStyles = {
    small: { padding: '16px', iconSize: 20, bandSize: '1.5rem' },
    medium: { padding: '24px', iconSize: 28, bandSize: '2rem' },
    large: { padding: '32px', iconSize: 36, bandSize: '3rem' }
  }

  const styles = sizeStyles[size]

  return (
    <div style={{
      background: '#ffffff',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: styles.padding,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: size === 'small' ? '140px' : '180px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#6B7280',
        fontSize: '14px'
      }}>
        <Icon size={styles.iconSize} style={{ color }} />
        <span>{SECTION_NAMES[section]}</span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px'
      }}>
        <span style={{
          fontSize: styles.bandSize,
          fontWeight: '700',
          color
        }}>
          {formattedBand}
        </span>
        <span style={{
          fontSize: '12px',
          color: '#6b7280'
        }}>
          band
        </span>
      </div>

      {(rawScore !== undefined && totalQuestions) && (
        <div style={{
          fontSize: '10px',
          color: '#6b7280'
        }}>
          {rawScore}/{totalQuestions} correct
        </div>
      )}

      {criteria && (
        <div style={{
          fontSize: '10px',
          color: '#6b7280',
          marginTop: '4px'
        }}>
          {Object.entries(criteria).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {showDescription && size !== 'small' && (
        <div style={{
          fontSize: '10px',
          color: '#6b7280',
          paddingTop: '8px',
          borderTop: '1px solid #e5e7eb'
        }}>
          {description.level}: {description.description.substring(0, 60)}...
        </div>
      )}
    </div>
  )
}

export function OverallBandCard({ scores, size = 'large' }) {
  const overallBand = calculateOverallBand(scores)
  const color = getBandColor(overallBand)
  const description = getBandDescription(overallBand)

  return (
    <div style={{
      background: `linear-gradient(135deg, #ffffff 0%, ${color}15 100%)`,
      border: `3px solid ${color}`,
      borderRadius: '16px',
      padding: size === 'large' ? '48px' : '32px',
      textAlign: 'center',
      minWidth: '280px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <TrendingUp size={32} style={{ color }} />
        <span style={{
          fontSize: '18px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          Overall Band Score
        </span>
      </div>

      <div style={{
        fontSize: size === 'large' ? '5rem' : '3.5rem',
        fontWeight: '700',
        color,
        lineHeight: 1,
        marginBottom: '16px'
      }}>
        {formatBand(overallBand)}
      </div>

      <div style={{
        fontSize: '16px',
        color: '#1f2937',
        fontWeight: '500',
        marginBottom: '8px'
      }}>
        {description.level}: {description.description.substring(0, 80)}...
      </div>

      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        maxWidth: '300px',
        margin: '0 auto'
      }}>
        {description.description}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb'
      }}>
        {Object.entries(scores).map(([section, band]) => (
          <div key={section} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '10px',
              color: '#6b7280',
              textTransform: 'capitalize'
            }}>
              {section}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: getBandColor(band)
            }}>
              {formatBand(band)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniBandIndicator({ band, label, showIcon = true }) {
  const color = getBandColor(band)

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: `${color}20`,
      border: `1px solid ${color}40`,
      borderRadius: '8px',
      padding: '4px 8px',
      fontSize: '12px'
    }}>
      {showIcon && <Award size={14} style={{ color }} />}
      <span style={{ color: '#6b7280' }}>{label}:</span>
      <span style={{ 
        color, 
        fontWeight: '700',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {formatBand(band)}
      </span>
    </div>
  )
}

export function BandScoreComparison({ current, target, showAdvice = true }) {
  const gap = target - current
  const needImprovement = gap > 0
  const color = needImprovement ? '#f59e0b' : '#10b981'

  const advice = {
    listening: gap > 0.5 ? 'Practice with varied accents and speed' : 'Maintain your current practice routine',
    reading: gap > 0.5 ? 'Work on skimming and scanning techniques' : 'Continue timed practice tests',
    writing: gap > 0.5 ? 'Focus on task response and coherence' : 'Refine grammar and vocabulary',
    speaking: gap > 0.5 ? 'Practice fluency with mock tests' : 'Maintain natural conversation practice'
  }

  return (
    <div style={{
      background: '#ffffff',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Current Band
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            color: getBandColor(current)
          }}>
            {formatBand(current)}
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '0 16px'
        }}>
          <div style={{ 
            fontSize: '10px', 
            color: '#6b7280',
            textTransform: 'uppercase'
          }}>
            Gap
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            color
          }}>
            {gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Target Band
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            color: getBandColor(target)
          }}>
            {formatBand(target)}
          </div>
        </div>
      </div>

      {showAdvice && needImprovement && (
        <div style={{
          background: `${color}15`,
          borderRadius: '8px',
          padding: '16px',
          fontSize: '12px',
          color: '#1f2937'
        }}>
          <strong>Focus areas to reach your target:</strong>
          <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
            {Object.entries(advice).map(([section, tip]) => (
              <li key={section} style={{ marginBottom: '4px' }}>
                <strong style={{ textTransform: 'capitalize' }}>{section}:</strong> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default {
  BandScoreCard,
  OverallBandCard,
  MiniBandIndicator,
  BandScoreComparison,
  calculateListeningReadingBand,
  calculateWritingBand,
  calculateSpeakingBand,
  calculateOverallBand
}
