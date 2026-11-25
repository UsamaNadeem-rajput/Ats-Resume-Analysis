const { normalizeWord } = require('./textUtils');

const verbs = [
  'built', 'developed', 'designed', 'implemented', 'created', 'engineered', 'architected',
  'programmed', 'coded', 'wrote', 'authored', 'prototyped', 'crafted', 'devised', 'formulated',
  'redesigned', 'rebuilt', 'rewrote', 'refactored', 'revamped', 'restructured',
  'launched', 'deployed', 'shipped', 'released', 'delivered', 'migrated', 'integrated',
  'configured', 'installed', 'provisioned', 'containerized', 'orchestrated', 'upgraded',
  'automated', 'scaled', 'maintained', 'monitored', 'customized', 'converted', 'consolidated',
  'optimized', 'improved', 'reduced', 'increased', 'enhanced', 'accelerated', 'boosted',
  'streamlined', 'simplified', 'standardized', 'unified', 'cut', 'saved', 'generated',
  'tested', 'debugged', 'resolved', 'troubleshot', 'diagnosed', 'validated', 'verified',
  'audited', 'secured', 'hardened', 'patched', 'mitigated', 'detected', 'prevented',
  'investigated', 'identified', 'assessed', 'reviewed', 'benchmarked', 'evaluated',
  'analyzed', 'analysed', 'trained', 'tuned', 'modeled', 'predicted', 'classified',
  'extracted', 'visualized', 'cleaned', 'processed', 'ingested', 'simulated', 'researched',
  'measured', 'quantified', 'forecasted', 'compiled', 'curated', 'published', 'documented',
  'led', 'managed', 'mentored', 'coordinated', 'collaborated', 'organized', 'facilitated',
  'presented', 'planned', 'executed', 'owned', 'drove', 'spearheaded', 'initiated',
  'established', 'introduced', 'negotiated', 'supervised', 'taught',
];

module.exports = new Set(verbs.map(normalizeWord));