/**
 * IELTS Band Score Calculator
 * Converts raw scores and performance metrics to IELTS 0-9 band scale
 */

// Listening and Reading band conversion tables
const LISTENING_BANDS = [
  { raw: 39, band: 9.0 }, { raw: 37, band: 8.5 }, { raw: 35, band: 8.0 },
  { raw: 33, band: 7.5 }, { raw: 30, band: 7.0 }, { raw: 27, band: 6.5 },
  { raw: 23, band: 6.0 }, { raw: 20, band: 5.5 }, { raw: 16, band: 5.0 },
  { raw: 13, band: 4.5 }, { raw: 10, band: 4.0 }, { raw: 7, band: 3.5 },
  { raw: 5, band: 3.0 }, { raw: 3, band: 2.5 }
]

const ACADEMIC_READING_BANDS = [
  { raw: 39, band: 9.0 }, { raw: 37, band: 8.5 }, { raw: 35, band: 8.0 },
  { raw: 33, band: 7.5 }, { raw: 30, band: 7.0 }, { raw: 27, band: 6.5 },
  { raw: 23, band: 6.0 }, { raw: 20, band: 5.5 }, { raw: 15, band: 5.0 },
  { raw: 13, band: 4.5 }, { raw: 10, band: 4.0 }, { raw: 8, band: 3.5 },
  { raw: 6, band: 3.0 }, { raw: 4, band: 2.5 }
]

const GENERAL_READING_BANDS = [
  { raw: 40, band: 9.0 }, { raw: 39, band: 8.5 }, { raw: 37, band: 8.0 },
  { raw: 36, band: 7.5 }, { raw: 34, band: 7.0 }, { raw: 32, band: 6.5 },
  { raw: 30, band: 6.0 }, { raw: 27, band: 5.5 }, { raw: 23, band: 5.0 },
  { raw: 19, band: 4.5 }, { raw: 15, band: 4.0 }, { raw: 12, band: 3.5 },
  { raw: 9, band: 3.0 }, { raw: 6, band: 2.5 }
]

/**
 * Calculate band score from raw correct answers
 * @param {number} rawScore - Number of correct answers
 * @param {number} totalQuestions - Total number of questions (typically 40)
 * @param {string} section - 'listening', 'reading-academic', 'reading-general'
 * @returns {number} Band score (0-9)
 */
export function calculateListeningReadingBand(rawScore, totalQuestions = 40, section = 'listening') {
  // Clamp score between 0 and total
  const clampedScore = Math.max(0, Math.min(rawScore, totalQuestions))
  
  let bandTable
  switch (section) {
    case 'listening':
      bandTable = LISTENING_BANDS
      break
    case 'reading-academic':
      bandTable = ACADEMIC_READING_BANDS
      break
    case 'reading-general':
      bandTable = GENERAL_READING_BANDS
      break
    default:
      bandTable = LISTENING_BANDS
  }

  // Find the appropriate band
  for (const entry of bandTable) {
    if (clampedScore >= entry.raw) {
      return entry.band
    }
  }
  
  // Below minimum threshold
  return 1.0
}

/**
 * Calculate writing band score based on rubric criteria
 * @param {Object} criteria - Scores for each criterion (0-9 scale)
 * @param {number} criteria.taskResponse - Task response score
 * @param {number} criteria.coherenceCohesion - Coherence and cohesion
 * @param {number} criteria.lexicalResource - Lexical resource (vocabulary)
 * @param {number} criteria.grammaticalRange - Grammatical range and accuracy
 * @returns {number} Overall writing band (average of four criteria)
 */
export function calculateWritingBand(criteria) {
  const { 
    taskResponse = 5, 
    coherenceCohesion = 5, 
    lexicalResource = 5, 
    grammaticalRange = 5 
  } = criteria

  const average = (taskResponse + coherenceCohesion + lexicalResource + grammaticalRange) / 4
  
  // Round to nearest 0.5
  return Math.round(average * 2) / 2
}

/**
 * Calculate speaking band score based on rubric criteria
 * @param {Object} criteria - Scores for each criterion (0-9 scale)
 * @param {number} criteria.fluencyCoherence - Fluency and coherence
 * @param {number} criteria.lexicalResource - Lexical resource
 * @param {number} criteria.grammaticalRange - Grammatical range and accuracy
 * @param {number} criteria.pronunciation - Pronunciation
 * @returns {number} Overall speaking band (average of four criteria)
 */
export function calculateSpeakingBand(criteria) {
  const { 
    fluencyCoherence = 5, 
    lexicalResource = 5, 
    grammaticalRange = 5, 
    pronunciation = 5 
  } = criteria

  const average = (fluencyCoherence + lexicalResource + grammaticalRange + pronunciation) / 4
  
  // Round to nearest 0.5
  return Math.round(average * 2) / 2
}

/**
 * Calculate overall IELTS band score
 * @param {Object} scores - Individual section scores
 * @param {number} scores.listening - Listening band (0-9)
 * @param {number} scores.reading - Reading band (0-9)
 * @param {number} scores.writing - Writing band (0-9)
 * @param {number} scores.speaking - Speaking band (0-9)
 * @returns {number} Overall band score (average rounded to nearest 0.5)
 */
export function calculateOverallBand(scores) {
  const { 
    listening = 0, 
    reading = 0, 
    writing = 0, 
    speaking = 0 
  } = scores

  const average = (listening + reading + writing + speaking) / 4
  
  // IELTS rounds to nearest 0.5
  return Math.round(average * 2) / 2
}

/**
 * Get descriptive feedback for a band score
 * @param {number} band - Band score (0-9)
 * @returns {Object} Description and capabilities
 */
export function getBandDescription(band) {
  const descriptions = {
    9: { level: 'Expert', description: 'Has fully operational command of the language' },
    8.5: { level: 'Very Good', description: 'Fully operational command with only occasional unsystematic inaccuracies' },
    8: { level: 'Very Good', description: 'Fully operational command with only occasional unsystematic inaccuracies' },
    7.5: { level: 'Good', description: 'Operational command, occasional inaccuracies, misunderstandings in some situations' },
    7: { level: 'Good', description: 'Operational command, occasional inaccuracies, misunderstandings in some situations' },
    6.5: { level: 'Competent', description: 'Generally effective command despite some inaccuracies' },
    6: { level: 'Competent', description: 'Generally effective command despite some inaccuracies' },
    5.5: { level: 'Modest', description: 'Partial command, coping with overall meaning in most situations' },
    5: { level: 'Modest', description: 'Partial command, coping with overall meaning in most situations' },
    4.5: { level: 'Limited', description: 'Basic competence limited to familiar situations' },
    4: { level: 'Limited', description: 'Basic competence limited to familiar situations' },
    3.5: { level: 'Extremely Limited', description: 'Conveys and understands only general meaning' },
    3: { level: 'Extremely Limited', description: 'Conveys and understands only general meaning' },
    2.5: { level: 'Intermittent', description: 'No real communication possible' },
    2: { level: 'Intermittent', description: 'No real communication possible' },
    1.5: { level: 'Non-user', description: 'Essentially has no ability to use the language' },
    1: { level: 'Non-user', description: 'Essentially has no ability to use the language' },
    0: { level: 'Did not attempt', description: 'No assessable information' }
  }

  // Round to nearest valid band for description
  const roundedBand = Math.round(band * 2) / 2
  return descriptions[roundedBand] || descriptions[0]
}

/**
 * Quick estimate for practice tests based on percentage
 * @param {number} percentage - Score percentage (0-100)
 * @returns {number} Estimated band score
 */
export function estimateBandFromPercentage(percentage) {
  if (percentage >= 95) return 9.0
  if (percentage >= 90) return 8.5
  if (percentage >= 85) return 8.0
  if (percentage >= 80) return 7.5
  if (percentage >= 75) return 7.0
  if (percentage >= 70) return 6.5
  if (percentage >= 60) return 6.0
  if (percentage >= 50) return 5.5
  if (percentage >= 40) return 5.0
  if (percentage >= 30) return 4.5
  if (percentage >= 20) return 4.0
  if (percentage >= 15) return 3.5
  if (percentage >= 10) return 3.0
  if (percentage >= 5) return 2.5
  return 2.0
}

/**
 * Format band score for display
 * @param {number} band - Band score
 * @returns {string} Formatted string (e.g., "7.5" or "7.0" → "7")
 */
export function formatBand(band) {
  return band % 1 === 0 ? band.toString() : band.toFixed(1)
}

/**
 * Get color coding for band score
 * @param {number} band - Band score
 * @returns {string} Color code for UI
 */
export function getBandColor(band) {
  if (band >= 7) return 'var(--color-success, #22c55e)'
  if (band >= 6) return 'var(--color-warning, #f59e0b)'
  if (band >= 5) return 'var(--color-orange, #f97316)'
  return 'var(--color-error, #ef4444)'
}

export default {
  calculateListeningReadingBand,
  calculateWritingBand,
  calculateSpeakingBand,
  calculateOverallBand,
  getBandDescription,
  estimateBandFromPercentage,
  formatBand,
  getBandColor
}
