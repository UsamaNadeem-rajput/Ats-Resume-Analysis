// src/utils/actionVerbs.js
// Resume ke bullets mein jo "kaam karne" wale verbs hote hain.
// Sirf tech nahi, har CS field ke liye: web, ML, security, embedded, DevOps, research
const { normalizeWord } = require('./textUtils');

const verbs = [
  // Banana / likhna
  'built', 'developed', 'designed', 'implemented', 'created', 'engineered', 'architected',
  'programmed', 'coded', 'wrote', 'authored', 'prototyped', 'crafted', 'devised', 'formulated',
  'redesigned', 'rebuilt', 'rewrote', 'refactored', 'revamped', 'restructured',
  // Chalana / deploy karna
  'launched', 'deployed', 'shipped', 'released', 'delivered', 'migrated', 'integrated',
  'configured', 'installed', 'provisioned', 'containerized', 'orchestrated', 'upgraded',
  'automated', 'scaled', 'maintained', 'monitored', 'customized', 'converted', 'consolidated',
  // Behtar karna
  'optimized', 'improved', 'reduced', 'increased', 'enhanced', 'accelerated', 'boosted',
  'streamlined', 'simplified', 'standardized', 'unified', 'cut', 'saved', 'generated',
  // Test / debug / security
  'tested', 'debugged', 'resolved', 'troubleshot', 'diagnosed', 'validated', 'verified',
  'audited', 'secured', 'hardened', 'patched', 'mitigated', 'detected', 'prevented',
  'investigated', 'identified', 'assessed', 'reviewed', 'benchmarked', 'evaluated',
  // Data / ML / research
  'analyzed', 'analysed', 'trained', 'tuned', 'modeled', 'predicted', 'classified',
  'extracted', 'visualized', 'cleaned', 'processed', 'ingested', 'simulated', 'researched',
  'measured', 'quantified', 'forecasted', 'compiled', 'curated', 'published', 'documented',
  // Leadership / teamwork
  'led', 'managed', 'mentored', 'coordinated', 'collaborated', 'organized', 'facilitated',
  'presented', 'planned', 'executed', 'owned', 'drove', 'spearheaded', 'initiated',
  'established', 'introduced', 'negotiated', 'supervised', 'taught',
];

// Normalize karke Set mein rakhte hain, taake text ke words (jo normalize hote hain) se seedha match ho
module.exports = new Set(verbs.map(normalizeWord));