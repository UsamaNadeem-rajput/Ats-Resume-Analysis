
const PDFDocument = require('pdfkit');

const MARGIN = 64;
const BODY_SIZES = [11, 10.5, 10, 9.5];

const latinOnly = (text) => (text || '').replace(/[^\u0000-\u00FF]/g, '').replace(/[ \t]+/g, ' ').trim();

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const coverLetterFilename = ({ name, jobTitle }) => {
  const slug = (value) => latinOnly(value).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const parts = ['Cover_Letter', slug(name), slug(jobTitle)].filter(Boolean);
  return `${parts.join('_').slice(0, 90)}.pdf`;
};

const buildCoverLetterPdf = (data, options = {}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: latinOnly(`Cover Letter ${data.name || ''}`),
        Author: latinOnly(data.name),
        Subject: latinOnly(data.jobTitle ? `Application for ${data.jobTitle}` : 'Cover Letter'),
      },
      ...(options.compress === false ? { compress: false, pdfVersion: '1.3' } : {}),
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = doc.page.width - MARGIN * 2;
    const maxHeight = doc.page.height - MARGIN * 2;

    const name = latinOnly(data.name);
    const contactParts = [data.contact?.email, data.contact?.phone, ...(data.contact?.links || []), data.location]
      .map(latinOnly)
      .filter(Boolean);

    const SEPARATOR = '   |   ';
    const wrapParts = (parts) => {
      doc.font('Helvetica').fontSize(9.5);
      const lines = [];
      let current = '';
      parts.forEach((part) => {
        const candidate = current ? current + SEPARATOR + part : part;
        if (current && doc.widthOfString(candidate) > width) {
          lines.push(current);
          current = part;
        } else {
          current = candidate;
        }
      });
      if (current) lines.push(current);
      return lines;
    };

    const header = [];
    if (name) header.push({ text: name, font: 'Helvetica-Bold', size: 17, color: '#111111', gap: 3 });
    const contactLines = wrapParts(contactParts);
    contactLines.forEach((line, i) =>
      header.push({ text: line, font: 'Helvetica', size: 9.5, color: '#444444', gap: i === contactLines.length - 1 ? 8 : 2 })
    );
    header.push({ rule: true, gap: 16 });

    const body = (size) => {
      const ops = [];
      const add = (text, extra = {}) => ops.push({ text: latinOnly(text), font: 'Helvetica', size, color: '#111111', gap: 0, ...extra });

      add(formatDate(data.date), { gap: 14 });

      const manager = latinOnly(data.manager);
      const company = latinOnly(data.company);
      add(manager || 'Hiring Manager', { gap: company ? 1 : 14 });
      if (company) add(company, { gap: 14 });

      if (data.jobTitle) {
        add(`Re: Application for ${data.jobTitle}`, { font: 'Helvetica-Bold', gap: 14 });
      }

      const blocks = String(data.content || '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
      blocks.forEach((block, i) => add(block, { gap: i === blocks.length - 1 ? 0 : 10 }));
      return ops;
    };

    const measure = (ops) =>
      ops.reduce((total, op) => {
        if (op.rule) return total + 1 + op.gap;
        doc.font(op.font).fontSize(op.size);
        return total + doc.heightOfString(op.text, { width, lineGap: 2.5 }) + op.gap;
      }, 0);

    const headerHeight = measure(header);
    const bodySize = BODY_SIZES.find((size) => headerHeight + measure(body(size)) <= maxHeight) || BODY_SIZES[BODY_SIZES.length - 1];

    [...header, ...body(bodySize)].forEach((op) => {
      if (op.rule) {
        const y = doc.y + 2;
        doc.moveTo(MARGIN, y).lineTo(MARGIN + width, y).lineWidth(0.6).strokeColor('#BBBBBB').stroke();
        doc.y = y + 1 + op.gap;
        return;
      }
      doc.font(op.font).fontSize(op.size).fillColor(op.color).text(op.text, MARGIN, doc.y, { width, lineGap: 2.5, align: 'left' });
      doc.y += op.gap;
    });

    doc.end();
  });

module.exports = { buildCoverLetterPdf, coverLetterFilename, latinOnly };