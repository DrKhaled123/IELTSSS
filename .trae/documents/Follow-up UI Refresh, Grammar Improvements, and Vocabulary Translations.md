## Follow-up UI Refresh (formerly "Content")
- Rename route and navigation label from Content to Follow-up (path: /follow-up).
- Update page header text and references in [App.jsx](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/App.jsx) and [Navigation.jsx](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/components/Navigation.jsx).
- Increase contrast and saturation for cards and stats in [ContentLife.jsx](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/pages/ContentLife.jsx):
  - Replace rgba(…, 0.15–0.2) overlays with solid elevated surfaces (e.g., var(--color-bg-elevated)) and stronger borders (var(--color-border)).
  - Keep var(--gradient-primary) but add a darker overlay for readability.
  - Ensure text uses var(--color-text-primary/secondary) with WCAG AA contrast.

## Grammar Section: Enrich, Speed, and Analytics Review
- Content expansion: add more A2/B1 topics (Articles, Prepositions, Past Simple, Present Perfect, Modals) directly to [grammar-database.json](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/data/grammar-database.json) with examples and 3+ MCQs each.
- Performance:
  - Split large UI in [Grammar.jsx](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/pages/Grammar.jsx) into memoized subcomponents for lesson list, quiz question, and results.
  - Debounce analytics updates; only compute after quiz completion and on mount, not per question.
  - Avoid heavy synchronous operations in render; move localStorage writes to a single batched call.
- Analytics review completeness:
  - Ensure the results panel renders all answered questions with isCorrect, userAnswer, correctAnswer, and explanation.
  - Fix analytics normalization in [useGrammarAnalytics.js](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/hooks/useGrammarAnalytics.js) to use per-question entries and numeric timestamps; compute accuracy from all answers.

## Vocabulary Translations (Hindi/Chinese/Urdu)
- Data filling for existing 409 words in [vocabulary-database.json](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/data/vocabulary-database.json):
  - Populate hindi/chinese/urdu for each word (currently shown as —) with the word-level translation.
  - Keep Arabic as-is; add HI/ZH/UR consistently.
- Pipeline proposal:
  - Option A (Recommended): Use LibreTranslate (self-hosted) or a paid API (e.g., Google Cloud Translation) to batch translate English word terms → HI/ZH/UR, with language-specific normalization.
  - Option B: Use a curated glossary CSV for IELTS/common vocabulary and merge programmatically.
  - Validation: spot-check samples, run a script to ensure every word now has non-empty values for HI/ZH/UR; update search/highlight/export already extended in [useVocabularySearch.js](file:///Users/khaledahmedmohamed/Desktop/__ORGANIZED__/07_Various_Projects/language/IELTS/src/hooks/useVocabularySearch.js).

## UI Updates in Vocabulary
- Replace UI dashes with actual HI/ZH/UR translations once data is filled; ensure RTL for Arabic/Urdu and appropriate font rendering.
- Keep Travel/Technology sections; they already include all four translations.

## Verification
- Run tests and add new unit tests:
  - Navigation test updates for Follow-up label and route.
  - Grammar analytics test to confirm accuracy matches number of correct answers.
  - Vocabulary rendering test to assert non-empty HI/ZH/UR strings.
- Build app and check browser console for no contrast or routing warnings.

Please confirm this plan. After approval, I will implement the changes, populate the translations, and verify end-to-end.