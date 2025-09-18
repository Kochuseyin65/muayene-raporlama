const puppeteer = require('puppeteer');

const getLaunchOptions = () => {
  const noSandbox = process.env.PUPPETEER_NO_SANDBOX === 'true';
  const headless = process.env.PUPPETEER_HEADLESS !== 'false';
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH; // optional for custom Chrome
  const args = [];
  console.log('starting');
  if (noSandbox) {
    console.log('yes bithc!');
    args.push('--no-sandbox', '--disable-setuid-sandbox');
  }
  return { headless, executablePath, args };
};

let browserPromise = null;
async function getBrowser() {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (b && b.isConnected()) return b;
    } catch (_) {
      // fallthrough to relaunch
    }
  }
  browserPromise = puppeteer.launch(getLaunchOptions());
  return browserPromise;
}

async function generatePDFBufferFromHTML(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
    });
    return pdfBuffer;
  } finally {
    try { await page.close(); } catch (_) {}
  }
}

async function generatePDFFromHTML(html) {
  const buf = await generatePDFBufferFromHTML(html);
  return buf.toString('base64');
}

async function closeBrowser() {
  try {
    if (browserPromise) {
      const b = await browserPromise; browserPromise = null; await b.close();
    }
  } catch (_) {}
}

const _graceful = () => { closeBrowser().catch(()=>{}); };
process.on('SIGINT', _graceful);
process.on('SIGTERM', _graceful);
process.on('exit', _graceful);

module.exports = { generatePDFFromHTML, generatePDFBufferFromHTML, closeBrowser };
