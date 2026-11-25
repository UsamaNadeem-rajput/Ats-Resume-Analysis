
export const BREAKDOWN_GROUPS = [
    {
        title: 'Job match',
        note: null,
        items: [
            {
                key: 'skillsMatch', label: 'Skills match', max: 40, info: 'Required skills from the job that your resume shows.',
                naInfo: 'This job description lists no recognized skills, so this part is not counted.'
            },
            {
                key: 'keywordMatch', label: 'Keyword match', max: 20, info: 'Common words from the job description (other than skills) found in your resume.',
                naInfo: 'This job description has no common words beyond its skills, so this part is not counted.'
            },
        ],
    },
    {
        title: 'Resume quality',
        note: 'Resume quality marks are adjusted by how well you match this job.',
        items: [
            { key: 'sectionCompleteness', label: 'Sections', max: 15, info: 'Whether Education, Skills, and Experience or Projects headings are present.' },
            { key: 'formatting', label: 'Formatting', max: 10, info: 'Email, phone, a professional link, and clean readable text.' },
            { key: 'achievements', label: 'Achievements', max: 10, info: 'Numbers (like 40% or 300 users) and strong action verbs.' },
            { key: 'readability', label: 'Readability', max: 5, info: 'A sensible length (1 to 2 pages) and varied wording.' },
        ],
    },
];

export const percentOf = (value, max) => (max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0);

export const toneOf = (percent) => (percent >= 70 ? 'green' : percent >= 40 ? 'amber' : 'red');

export const TONE_CLASSES = {
    green: { bar: 'bg-green-500', text: 'text-green-700' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-700' },
    red: { bar: 'bg-red-500', text: 'text-red-700' },
};

export const markTotals = (breakdown = {}, notApplicable = []) => {
    const skip = new Set(notApplicable);
    let earned = 0;
    let possible = 0;
    BREAKDOWN_GROUPS.forEach((group) =>
        group.items.forEach(({ key, max }) => {
            if (skip.has(key)) return;
            earned += breakdown[key] ?? 0;
            possible += max;
        })
    );
    return { earned, possible };
};