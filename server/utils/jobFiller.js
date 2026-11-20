// src/utils/jobFiller.js
// Job ads ke woh aam lafz jo skill nahi hote, lekin JD mein baar baar aate hain.
// Purani stopWords.js ko chhede bina yeh alag set hai, keywordService dono ko mila kar use karta hai.
// Rule: sirf GENERAL job-ad ki boli yahan aaye, kisi ek JD ya field ke lafz nahi.
const jobFiller = new Set([
  // Hiring ki aam boli
  'looking', 'seeking', 'hiring', 'join', 'joining', 'role', 'position', 'opportunity',
  'candidate', 'candidates', 'ideal', 'applicant', 'apply', 'company', 'team', 'teams',
  'environment', 'culture', 'mission', 'passionate', 'motivated', 'driven', 'dynamic',
  'fast', 'paced', 'growing', 'client', 'clients', 'customer', 'customers',
  // Requirements ki aam boli
  'requirements', 'requirement', 'required', 'preferred', 'responsibilities', 'responsibility',
  'qualifications', 'qualification', 'ability', 'able', 'strong', 'excellent', 'good', 'great',
  'proven', 'solid', 'deep', 'hands', 'knowledge', 'understanding', 'proficiency', 'proficient',
  'familiarity', 'familiar', 'experience', 'experienced', 'years', 'year', 'plus', 'bonus',
  'nice', 'must', 'will', 'should', 'including', 'etc', 'related', 'relevant', 'similar',
  'minimum', 'degree', 'bachelor', 'bachelors', 'master', 'masters', 'field', 'equivalent',
  // Kaam ki aam boli
  'work', 'working', 'works', 'build', 'building', 'develop', 'developing', 'create',
  'creating', 'write', 'writing', 'design', 'designing', 'maintain', 'maintaining',
  'collaborate', 'collaborating', 'ensure', 'ensuring', 'support', 'supporting',
  'participate', 'contribute', 'contributing', 'deliver', 'delivering', 'help', 'using',
  'use', 'used', 'across', 'within', 'new', 'high', 'quality', 'best', 'practices',
  'practice', 'solutions', 'solution', 'products', 'product', 'projects', 'project',
  'communication', 'skills', 'skill', 'tools', 'technologies', 'technology', 'technical',
  // Job title ke tukde: title skill nahi hota, aur "full stack" jaise phrase ke tukde
  // alag alag ginay se bekaar score bante hain (phrase detection baad ki phase mein)
  'developer', 'developers', 'engineer', 'engineers', 'engineering', 'senior', 'junior',
  'lead', 'full', 'stack', 'software', 'application', 'applications', 'systems', 'system',
]);

module.exports = jobFiller;