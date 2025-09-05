const puppeteer = require('puppeteer');

const getLaunchOptions = () => {
  const noSandbox = process.env.PUPPETEER_NO_SANDBOX === 'true';
  const headless = process.env.PUPPETEER_HEADLESS !== 'false';
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH; // optional for custom Chrome
  const args = [];
  if (noSandbox) {
    args.push('--no-sandbox', '--disable-setuid-sandbox');
  }
  return { headless, executablePath, args };
};

async function generatePDFBufferFromHTML(html) {
  const browser = await puppeteer.launch(getLaunchOptions());
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

async function generatePDFFromHTML(html) {
  const buf = await generatePDFBufferFromHTML(html);
  return buf.toString('base64');
}

module.exports = { generatePDFFromHTML, generatePDFBufferFromHTML };
