// Semantic Similarity and Learning Gap Analysis Engine
import { useMemo } from 'react'

export class SemanticAnalyzer {
    constructor(vocabularyDatabase) {
        this.vocabulary = vocabularyDatabase
        this.similarityMatrix = this.buildSimilarityMatrix()
        this.wordClusters = this.createWordClusters()
        this.learningGraph = this.buildLearningGraph()
    }

    // Build semantic similarity matrix
    buildSimilarityMatrix() {
        const matrix = {}
        
        this.vocabulary.forEach((word1, i) => {
            matrix[word1.german] = {}
            this.vocabulary.forEach((word2, j) => {
                if (i !== j) {
                    matrix[word1.german][word2.german] = this.calculateSimilarity(word1, word2)
                }
            })
        })
        
        return matrix
    }

    // Calculate similarity between two words
    calculateSimilarity(word1, word2) {
        let similarity = 0
        
        // Category similarity (highest weight)
        if (word1.category === word2.category) {
            similarity += 0.4
        }
        
        // Level similarity
        const levelDistance = Math.abs(this.getLevelScore(word1.level) - this.getLevelScore(word2.level))
        similarity += Math.max(0, 0.3 - (levelDistance * 0.1))
        
        // Type similarity
        if (word1.type === word2.type) {
            similarity += 0.2
        }
        
        // Semantic field overlap
        const semanticOverlap = this.calculateSemanticOverlap(word1, word2)
        similarity += semanticOverlap * 0.1
        
        return Math.min(similarity, 1.0)
    }

    // Calculate semantic overlap between words
    calculateSemanticOverlap(word1, word2) {
        let overlap = 0
        
        // Check synonym relationships
        if (word1.synonyms && word2.synonyms) {
            const synonymOverlap = word1.synonyms.filter(s => word2.synonyms.includes(s)).length
            overlap += synonymOverlap * 0.3
        }
        
        // Check example overlap
        if (word1.examples && word2.examples) {
            const exampleWords1 = this.extractWordsFromExamples(word1.examples.german || [])
            const exampleWords2 = this.extractWordsFromExamples(word2.examples.german || [])
            const commonWords = exampleWords1.filter(w => exampleWords2.includes(w))
            overlap += (commonWords.length / Math.max(exampleWords1.length, exampleWords2.length)) * 0.4
        }
        
        // Context similarity
        if (word1.context && word2.context) {
            const contextWords1 = this.extractWordsFromText(word1.context)
            const contextWords2 = this.extractWordsFromText(word2.context)
            const commonContext = contextWords1.filter(w => contextWords2.includes(w))
            overlap += (commonContext.length / Math.max(contextWords1.length, contextWords2.length)) * 0.3
        }
        
        return Math.min(overlap, 1.0)
    }

    // Create word clusters for learning paths
    createWordClusters() {
        const clusters = {}
        const processed = new Set()
        
        this.vocabulary.forEach(word => {
            if (processed.has(word.german)) return
            
            const cluster = {
                id: `cluster_${Object.keys(clusters).length}`,
                words: [],
                category: word.category,
                level: word.level,
                theme: this.identifyTheme(word),
                difficulty: word.difficulty || 1
            }
            
            // Find similar words
            const similarWords = this.findSimilarWords(word, 0.6)
            cluster.words = [word, ...similarWords]
            
            cluster.words.forEach(w => processed.add(w.german))
            clusters[cluster.id] = cluster
        })
        
        return clusters
    }

    // Identify theme for a word cluster
    identifyTheme(word) {
        const themes = {
            'daily-life': ['nouns', 'verbs', 'adjectives'],
            'academic': ['ielts-academic', 'writing', 'reading'],
            'communication': ['verbs', 'politeness', 'responses'],
            'description': ['adjectives', 'adverbs', 'nouns'],
            'actions': ['verbs', 'daily-activities']
        }
        
        for (const [theme, categories] of Object.entries(themes)) {
            if (categories.includes(word.category)) {
                return theme
            }
        }
        
        return 'general'
    }

    // Find similar words above threshold
    findSimilarWords(word, threshold = 0.5) {
        const similar = []
        const wordSimilarities = this.similarityMatrix[word.german] || {}
        
        for (const [otherWord, similarity] of Object.entries(wordSimilarities)) {
            if (similarity >= threshold) {
                const otherWordData = this.vocabulary.find(w => w.german === otherWord)
                if (otherWordData) {
                    similar.push(otherWordData)
                }
            }
        }
        
        return similar.sort((a, b) => 
            (this.similarityMatrix[word.german][b.german] || 0) - 
            (this.similarityMatrix[word.german][a.german] || 0)
        )
    }

    // Build learning dependency graph
    buildLearningGraph() {
        const graph = {
            nodes: {},
            edges: {},
            prerequisites: {},
            dependencies: {}
        }
        
        this.vocabulary.forEach(word => {
            const nodeId = word.german
            graph.nodes[nodeId] = {
                word,
                difficulty: word.difficulty || 1,
                level: word.level,
                category: word.category,
                prerequisites: this.identifyPrerequisites(word),
                unlocks: this.identifyUnlocks(word)
            }
            
            // Build prerequisite relationships
            word.prerequisites?.forEach(prereqId => {
                if (!graph.edges[prereqId]) graph.edges[prereqId] = []
                graph.edges[prereqId].push(nodeId)
                
                if (!graph.prerequisites[nodeId]) graph.prerequisites[nodeId] = []
                graph.prerequisites[nodeId].push(prereqId)
            })
        })
        
        return graph
    }

    // Identify prerequisites for a word
    identifyPrerequisites(word) {
        const prereqs = []
        
        // Level-based prerequisites
        const baseLevel = this.getLevelScore(word.level)
        if (baseLevel > 1) {
            const lowerLevelWords = this.vocabulary.filter(w => 
                this.getLevelScore(w.level) < baseLevel && 
                w.category === word.category
            ).slice(0, 3)
            prereqs.push(...lowerLevelWords.map(w => w.german))
        }
        
        // Type-based prerequisites
        if (word.type === 'verb') {
            const basicVerbs = this.vocabulary.filter(w => 
                w.type === 'verb' && w.level === 'A1'
            ).map(w => w.german)
            prereqs.push(...basicVerbs.slice(0, 2))
        }
        
        return [...new Set(prereqs)] // Remove duplicates
    }

    // Identify what a word unlocks
    identifyUnlocks(word) {
        const unlocks = []
        
        // Higher level words in same category
        const higherLevelWords = this.vocabulary.filter(w => 
            this.getLevelScore(w.level) > this.getLevelScore(word.level) &&
            w.category === word.category
        ).slice(0, 3)
        unlocks.push(...higherLevelWords.map(w => w.german))
        
        return unlocks
    }

    // Learning Gap Analysis
    analyzeLearningGaps(userProgress, learnedWords) {
        const gaps = {
            categoryGaps: this.analyzeCategoryGaps(userProgress, learnedWords),
            levelGaps: this.analyzeLevelGaps(userProgress, learnedWords),
            skillGaps: this.analyzeSkillGaps(userProgress, learnedWords),
            priorityGaps: this.identifyPriorityGaps(userProgress, learnedWords)
        }
        
        return gaps
    }

    // Analyze gaps by category
    analyzeCategoryGaps(userProgress, learnedWords) {
        const categoryStats = {}
        const allWordsByCategory = {}
        
        // Group all words by category
        this.vocabulary.forEach(word => {
            if (!allWordsByCategory[word.category]) {
                allWordsByCategory[word.category] = []
            }
            allWordsByCategory[word.category].push(word)
        })
        
        // Calculate completion rates
        Object.keys(allWordsByCategory).forEach(category => {
            const totalWords = allWordsByCategory[category].length
            const learnedInCategory = allWordsByCategory[category].filter(word => 
                learnedWords.includes(word.german)
            ).length
            
            categoryStats[category] = {
                total: totalWords,
                learned: learnedInCategory,
                completion: (learnedInCategory / totalWords) * 100,
                priority: this.calculateCategoryPriority(category, learnedInCategory, totalWords)
            }
        })
        
        return categoryStats
    }

    // Calculate category priority for learning
    calculateCategoryPriority(category, learned, total) {
        const completionRate = learned / total
        const basePriority = this.getCategoryBasePriority(category)
        
        // Higher priority for low completion rates and high importance categories
        return basePriority * (1 - completionRate) * 100
    }

    // Get base priority for categories
    getCategoryBasePriority(category) {
        const priorities = {
            'verbs': 100,
            'nouns': 95,
            'adjectives': 90,
            'politeness': 85,
            'greetings': 80,
            'responses': 75,
            'ielts-core': 100,
            'academic': 95,
            'daily-activities': 85
        }
        return priorities[category] || 70
    }

    // Analyze gaps by difficulty level
    analyzeLevelGaps(userProgress, learnedWords) {
        const levelStats = {}
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        
        levels.forEach(level => {
            const wordsAtLevel = this.vocabulary.filter(w => w.level === level)
            const learnedAtLevel = wordsAtLevel.filter(word => 
                learnedWords.includes(word.german)
            )
            
            levelStats[level] = {
                total: wordsAtLevel.length,
                learned: learnedAtLevel.length,
                completion: (learnedAtLevel.length / wordsAtLevel.length) * 100,
                averageDifficulty: this.calculateAverageDifficulty(learnedAtLevel),
                recommendedNext: this.recommendNextLevel(level, learnedAtLevel.length / wordsAtLevel.length)
            }
        })
        
        return levelStats
    }

    // Analyze skill-specific gaps
    analyzeSkillGaps(userProgress, learnedWords) {
        const skills = {
            vocabulary: this.analyzeVocabularySkill(learnedWords),
            pronunciation: this.analyzePronunciationSkill(learnedWords),
            grammar: this.analyzeGrammarSkill(learnedWords),
            context: this.analyzeContextSkill(learnedWords)
        }
        
        return skills
    }

    // Identify priority gaps (high-impact learning opportunities)
    identifyPriorityGaps(userProgress, learnedWords) {
        const priorityGaps = []
        
        // Find high-impact, low-effort learning opportunities
        this.vocabulary.forEach(word => {
            if (learnedWords.includes(word.german)) return
            
            const impact = this.calculateLearningImpact(word)
            const effort = this.calculateLearningEffort(word)
            const ratio = impact / effort
            
            if (ratio > 2.0) { // High impact, low effort
                priorityGaps.push({
                    word,
                    impact,
                    effort,
                    ratio,
                    reason: this.explainPriority(word, ratio)
                })
            }
        })
        
        return priorityGaps.sort((a, b) => b.ratio - a.ratio).slice(0, 10)
    }

    // Calculate learning impact of a word
    calculateLearningImpact(word) {
        let impact = 0
        
        // Frequency impact
        const frequencyScore = { 'high': 30, 'medium': 20, 'low': 10 }
        impact += frequencyScore[word.frequency] || 10
        
        // Category importance
        impact += this.getCategoryBasePriority(word.category)
        
        // IELTS relevance
        if (word.category === 'ielts-core') impact += 50
        
        // Cross-category connections
        const connectedWords = this.findSimilarWords(word, 0.3)
        impact += connectedWords.length * 5
        
        return impact
    }

    // Calculate learning effort required
    calculateLearningEffort(word) {
        let effort = 0
        
        // Base difficulty
        effort += (word.difficulty || 1) * 10
        
        // Complexity factors
        if (word.conjugation) effort += 15
        if (word.examples?.german?.length > 2) effort += 10
        if (word.ipa) effort += 5
        
        return effort
    }

    // Explain why a word is priority
    explainPriority(word, ratio) {
        const reasons = []
        
        if (word.frequency === 'high') reasons.push('high-frequency word')
        if (word.category === 'ielts-core') reasons.push('essential for IELTS')
        if (this.findSimilarWords(word, 0.5).length > 3) reasons.push('connects to many other words')
        if ((word.difficulty || 1) <= 2) reasons.push('low difficulty')
        
        return reasons.join(', ') || 'good learning opportunity'
    }

    // Helper methods
    getLevelScore(level) {
        const scores = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
        return scores[level] || 1
    }

    extractWordsFromExamples(examples) {
        return examples.flatMap(example => 
            example.toLowerCase().split(/[\s\.,;:!?]+/).filter(word => word.length > 2)
        )
    }

    extractWordsFromText(text) {
        return text.toLowerCase().split(/[\s\.,;:!?]+/).filter(word => word.length > 2)
    }

    calculateAverageDifficulty(words) {
        if (words.length === 0) return 0
        const total = words.reduce((sum, word) => sum + (word.difficulty || 1), 0)
        return total / words.length
    }

    recommendNextLevel(currentLevel, completionRate) {
        if (completionRate > 0.8) {
            const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
            const currentIndex = levels.indexOf(currentLevel)
            return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel
        }
        return currentLevel
    }

    analyzeVocabularySkill(learnedWords) {
        const learned = this.vocabulary.filter(w => learnedWords.includes(w.german))
        const total = this.vocabulary.length
        
        return {
            score: (learned.length / total) * 100,
            learned: learned.length,
            total,
            strength: this.calculateVocabularyStrength(learned),
            weakness: this.calculateVocabularyWeakness(learned)
        }
    }

    analyzePronunciationSkill(learnedWords) {
        const wordsWithPronunciation = this.vocabulary.filter(w => w.pronunciation && learnedWords.includes(w.german))
        return {
            score: (wordsWithPronunciation.length / learnedWords.length) * 100,
            practiced: wordsWithPronunciation.length,
            total: learnedWords.length
        }
    }

    analyzeGrammarSkill(learnedWords) {
        const wordsWithGrammar = this.vocabulary.filter(w => 
            (w.conjugation || w.plural) && learnedWords.includes(w.german)
        )
        return {
            score: (wordsWithGrammar.length / learnedWords.length) * 100,
            mastered: wordsWithGrammar.length,
            total: learnedWords.length
        }
    }

    analyzeContextSkill(learnedWords) {
        const wordsWithContext = this.vocabulary.filter(w => 
            w.examples && learnedWords.includes(w.german)
        )
        return {
            score: (wordsWithContext.length / learnedWords.length) * 100,
            contextualized: wordsWithContext.length,
            total: learnedWords.length
        }
    }

    calculateVocabularyStrength(learnedWords) {
        const categories = {}
        learnedWords.forEach(word => {
            categories[word.category] = (categories[word.category] || 0) + 1
        })
        return Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
    }

    calculateVocabularyWeakness(learnedWords) {
        const allCategories = [...new Set(this.vocabulary.map(w => w.category))]
        const learnedCategories = new Set(learnedWords.map(w => w.category))
        const missingCategories = allCategories.filter(cat => !learnedCategories.has(cat))
        return missingCategories[0] || 'none'
    }
}

// React hook for semantic analysis
export function useSemanticAnalysis(vocabularyDatabase) {
    return useMemo(() => {
        return new SemanticAnalyzer(vocabularyDatabase)
    }, [vocabularyDatabase])
}

// Utility functions for external use
export const SemanticUtils = {
    findWordCluster: (semanticAnalyzer, word) => {
        return semanticAnalyzer.wordClusters[word] || null
    },
    
    getSimilarWords: (semanticAnalyzer, word, limit = 5) => {
        return semanticAnalyzer.findSimilarWords(word, 0.5).slice(0, limit)
    },
    
    getLearningPath: (semanticAnalyzer, startWord, targetWord) => {
        // Simplified pathfinding - would use more sophisticated algorithms
        const path = [startWord]
        const visited = new Set([startWord])
        
        let current = startWord
        while (current !== targetWord && visited.size < 10) {
            const neighbors = semanticAnalyzer.findSimilarWords(current, 0.3)
            const unvisited = neighbors.filter(w => !visited.has(w.german))
            
            if (unvisited.length === 0) break
            
            current = unvisited[0].german
            path.push(current)
            visited.add(current)
        }
        
        return path
    },
    
    analyzeWordDifficulty: (semanticAnalyzer, word) => {
        const similarWords = semanticAnalyzer.findSimilarWords(word, 0.4)
        const averageDifficulty = similarWords.reduce((sum, w) => sum + (w.difficulty || 1), 0) / similarWords.length
        return {
            baseDifficulty: word.difficulty || 1,
            contextualDifficulty: averageDifficulty,
            recommendation: averageDifficulty > 3 ? 'challenging' : 'appropriate'
        }
    }
}