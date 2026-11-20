// src/utils/stopWords.js
// Set use karo — O(1) lookup, Array se bohat fast

const stopWords = new Set([

  // ── English articles, prepositions, conjunctions ──────────────────────────
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'yet', 'nor',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'about', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'both', 'either', 'each', 'than', 'then', 'when', 'while',
  'although', 'because', 'since', 'unless', 'until', 'where',

  // ── Pronouns ──────────────────────────────────────────────────────────────
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'they', 'them', 'their', 'theirs',
  'this', 'that', 'these', 'those', 'who', 'whom', 'which', 'what',

  // ── Common verbs ──────────────────────────────────────────────────────────
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'shall', 'must',
  'get', 'got', 'make', 'made', 'use', 'used', 'using',
  'work', 'working', 'worked', 'help', 'helped', 'helping',
  'ensure', 'support', 'provide', 'build', 'create', 'develop',
  'implement', 'design', 'manage', 'maintain', 'improve',
  'collaborate', 'communicate', 'contribute',

  // ── Job posting cliches — har JD mein hote hain, meaningful nahi ─────────
  'experience', 'experienced', 'required', 'requirement', 'requirements',
  'preferred', 'prefer', 'plus', 'bonus', 'nice', 'have',
  'good', 'strong', 'excellent', 'great', 'solid', 'proven',
  'ability', 'skill', 'skills', 'knowledge', 'understanding',
  'familiarity', 'proficiency', 'expertise', 'proficient', 'expert',
  'looking', 'seeking', 'need', 'needs', 'want',
  'role', 'position', 'candidate', 'candidates', 'applicant',
  'team', 'teams', 'company', 'organization', 'opportunity',
  'responsibilities', 'responsibility', 'duties',
  'including', 'include', 'includes', 'such', 'like', 'related',
  'relevant', 'equivalent', 'similar', 'applicable',
  'minimum', 'least', 'maximum', 'more', 'most', 'less', 'very',
  'high', 'large', 'small', 'new', 'other', 'any', 'all', 'some',
  'also', 'well', 'must', 'highly', 'fast', 'quickly',
  'effectively', 'efficiently', 'successfully',
  'self', 'motivated', 'driven', 'passionate', 'enthusiastic',
  'dynamic', 'innovative', 'creative', 'analytical', 'detail',
  'oriented', 'proactive', 'collaborative', 'independent',
  'written', 'verbal', 'communication', 'interpersonal',
  'problem', 'solving', 'time', 'management', 'fast', 'paced',

  // ── Numbers aur time ──────────────────────────────────────────────────────
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'year', 'years', 'month', 'months', 'day', 'days',
  'junior', 'senior', 'mid', 'level', 'entry',

  // ── General CS words jo har jagah aate hain (meaningful nahi) ────────────
  'software', 'system', 'systems', 'application', 'applications',
  'solution', 'solutions', 'platform', 'service', 'services',
  'process', 'processes', 'performance', 'quality', 'code', 'coding',
  'technical', 'technology', 'technologies', 'tool', 'tools',
  'environment', 'infrastructure', 'architecture', 'framework',

  // ── Punctuation remnants ──────────────────────────────────────────────────
  '', ' ', 'eg', 'ie', 'etc', 'vs',
]);

module.exports = stopWords;