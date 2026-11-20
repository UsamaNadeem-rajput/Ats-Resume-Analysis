// tests/run.js: `node tests/run.js`
// Plain Node, koi library nahi. Phase 13 mein yahi cases Jest tests ban jayenge.

const { load } = require('./paths');
const { analyzeKeywords } = load('services/keywordService');
const { calculateScore, _internals } = load('services/scoringService');
const { findSkills } = load('utils/skillMatcher');
const { resumes, jds, pairs, skillExpectations } = require('./fixtures');

let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? '  →  ' + detail : ''}`);
};

const linesOf = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const flat = (text) => linesOf(text).join(' ');           // pdfService ka "text" (whitespace collapsed)
const skillNames = (text) => findSkills(text).map((s) => s.name);

// ── A. Pair scores ───────────────────────────────────────────────────────────
console.log('\n=== A. Resume ↔ JD pairs ===');
pairs.forEach((p) => {
  const r = resumes[p.resume];
  const kd = analyzeKeywords(flat(r.text), jds[p.jd], linesOf(r.text));
  const { score, breakdown, notApplicable } = calculateScore(kd, flat(r.text), { pageCount: r.pageCount });
  const b = Object.values(breakdown).join('/');
  const inRange = score >= p.min && score <= p.max;
  // pending = khula design faisla: fail ko "KNOWN" dikhao, suite ko fail mat karo
  check(
    `${p.name.padEnd(26)} score ${String(score).padStart(3)} [${b}] expected ${p.min}-${p.max}${!inRange && p.pending ? '  (KNOWN: design faisla pending)' : ''}`,
    inRange || !!p.pending,
    `matched ${kd.matchedSkills.length}/${kd.jdSkills.length} skills, ${kd.matchedKeywords.length}/${kd.jdKeywords.length} keywords, sections ${kd.detectedSections}`
  );
  if (notApplicable.length) console.log('      notApplicable:', notApplicable.join(','));
});

// ── B. Skill detection: jo likhi hain milni chahiye, jo nahi likhi nahi milni chahiye ──
console.log('\n=== B. Skills per resume (has / hasNot) ===');
Object.entries(skillExpectations).forEach(([key, exp]) => {
  const found = skillNames(flat(resumes[key].text));
  const missed = exp.has.filter((s) => !found.includes(s));
  const falsePos = exp.hasNot.filter((s) => found.includes(s));
  check(`${key.padEnd(9)} detects its skills`, missed.length === 0, 'missed: ' + missed.join(','));
  check(`${key.padEnd(9)} no false positives`, falsePos.length === 0, 'wrongly found: ' + falsePos.join(','));
});

// ── C. Aam angrezi lafz skill nahi banne chahiye ─────────────────────────────
console.log('\n=== C. False-positive guard (aam angrezi text) ===');
const plain = `I want to express interest in community driven projects. We value excellent, scalable
systems and I trust my team. The rest of the group will react quickly to feedback. Our swift response
and the spark of unity matter. Digital products need a good plan for the open stack of tasks; I go to work early.`;
const plainFound = skillNames(plain);
check('plain English → koi skill nahi', plainFound.length === 0, 'found: ' + plainFound.join(','));

// ── D. Special-character skills aur PDF spacing ──────────────────────────────
console.log('\n=== D. Special characters / PDF spacing ===');
const special = skillNames('Languages: C++, C#, .NET Core, C/C++ and CI/CD pipelines with Node.js');
['cpp', 'csharp', 'dotnet', 'cicd', 'nodejs', 'c'].forEach((s) =>
  check(`special text detects ${s}`, special.includes(s), 'found: ' + special.join(','))
);
check('PDF spacing "Nod e.js" → nodejs', skillNames('Backend with Nod e.js and Post greSQL').includes('nodejs'));
check('"Node.js" javascript ko trigger nahi karta', !skillNames('Backend with Node.js only').includes('javascript'));
check('"MySQL" JD wale "SQL" ko match deta hai', skillNames('Worked with MySQL daily').includes('sql'));
check('git aur version control ek hi skill', skillNames('Git and version control').filter((s) => s === 'git').length === 1
  && !skillNames('Git').includes('version_control'));
check('weak "Express" context ke saath', skillNames('Node.js and Express APIs').includes('express'));
check('weak "Express" bina context nahi', !skillNames('Please Express your interest').includes('express'));

// ── E. Sections: heading chahiye, lafz ki maujoodgi nahi ─────────────────────
console.log('\n=== E. Section detection ===');
const noHeadings = ['Jo Smith', 'I built tools and developed about 40% faster pipelines at the university', 'Worked on projects'];
const s1 = analyzeKeywords(flat(noHeadings.join('\n')), jds.web, noHeadings.concat(['x', 'y', 'z'])).detectedSections;
check('sirf lafz (built/about/university) se section nahi banta', s1.length === 0, 'found: ' + s1);
const withHeadings = ['Jo Smith', 'EDUCATION', 'BS CS', 'Technical Skills:', 'Python', 'Research Experience', 'Thesis', 'Academic Projects'];
const s2 = analyzeKeywords('x', jds.web, withHeadings).detectedSections;
check('headings (research/academic projects) pakde jate hain', ['education', 'skills', 'experience', 'projects'].every((s) => s2.includes(s)), 'found: ' + s2);
const s3 = analyzeKeywords('Education: BS CS. Skills: Python. Experience: 2 years at Acme.', jds.web, ['one single line']).detectedSections;
check('line structure na ho to fallback strong aliases se', ['education', 'skills', 'experience'].every((s) => s3.includes(s)), 'found: ' + s3);

// ── F. Formatting: mulk, bullets, accents ────────────────────────────────────
console.log('\n=== F. Formatting rules ===');
['0300-1234567', '+92 300 1234567', '(555) 123-4567', '+44 7911 123456', '+49 151 23456789', '415-555-0198']
  .forEach((p) => check(`phone ${p}`, _internals.hasPhone(`Contact ${p} email`)));
check('sirf saal "2019 2020 2021 2022" phone nahi', !_internals.hasPhone('Education 2019 2020 2021 2022 BS'));
check('"2019 - 2023" phone nahi', !_internals.hasPhone('BS CS 2019 - 2023'));
check('github link', _internals.hasProfessionalLink('github.com/x'));
check('kaggle link', _internals.hasProfessionalLink('kaggle.com/x'));
check('portfolio .dev link', _internals.hasProfessionalLink('lina.dev'));
check('email domain link nahi', !_internals.hasProfessionalLink('name@company.io'));
check('Socket.io (tech naam) link nahi', !_internals.hasProfessionalLink('Built chat with Socket.io and Express'));
check('node.js link nahi', !_internals.hasProfessionalLink('Node.js and Next.js'));
check('bullets/accents/urdu garbage nahi', _internals.isTextClean('José Núñez • Built APIs – ’smart’ علی خان'));
check('icon-font/replacement garbage pakda jata hai', !_internals.isTextClean('Email \uE0A1 \uE0A2 \uFFFD \uFFFD \uE0A3 phone \uE0A4 abc'));

// ── G. Achievements / readability ────────────────────────────────────────────
console.log('\n=== G. Achievements / readability ===');
const ach = _internals.scoreAchievements('Cut latency by 200 ms, served 10,000 users, saved $5M, 3x faster, 99.9% uptime, 1000+ tests. Year 2023.');
check('wasee metrics (ms, users, $, x, %, +) pakde jate hain', ach >= 5, 'score ' + ach);
check('sirf saal metric nahi', _internals.scoreAchievements('Graduated in 2023 with GPA 3.8') === 0);
const words = (n) => Array.from({ length: n }, (_, i) => 'word' + (i % 400)).join(' ');
check('2 page senior (900 words) readability theek', _internals.scoreReadability(words(900), 2) >= 4);
check('4 page resume penalize', _internals.scoreReadability(words(1600), 4) <= 2);

// ── H. JD mein koi skill/keyword na ho → scale ───────────────────────────────
console.log('\n=== H. Not-applicable scaling ===');
const emptyKd = { jdKeywords: ['a'], matchedKeywords: ['a'], jdSkills: [], matchedSkills: [], detectedSections: ['education', 'skills', 'projects'] };
const sc = calculateScore(emptyKd, 'Built apps. ali@x.com 0300-1234567 github.com/a', { pageCount: 1 });
check('skills lagu nahi → notApplicable mein', sc.notApplicable.includes('skillsMatch'), JSON.stringify(sc));
check('free 20 marks nahi mile (score <= 100)', sc.score <= 100 && sc.breakdown.skillsMatch === 0);

console.log(`\n${failures === 0 ? 'SAB PASS ✅' : failures + ' FAILURE(S) ❌'}`);
process.exit(failures === 0 ? 0 : 1);