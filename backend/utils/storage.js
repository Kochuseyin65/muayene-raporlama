const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const REPORTS_ROOT = process.env.REPORTS_PATH || path.join(__dirname, '../uploads/reports');

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function reportDir(reportId) {
  return path.join(REPORTS_ROOT, String(reportId));
}

function unsignedPdfPath(reportId) {
  return path.join(reportDir(reportId), 'unsigned.pdf');
}

function signedPdfPath(reportId) {
  return path.join(reportDir(reportId), 'signed.pdf');
}

async function writeFileAtomic(filePath, buffer) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmp = filePath + '.tmp-' + Date.now();
  await fsp.writeFile(tmp, buffer);
  await fsp.rename(tmp, filePath);
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

async function readFileBase64(filePath) {
  const buf = await fsp.readFile(filePath);
  return buf.toString('base64');
}

module.exports = {
  REPORTS_ROOT,
  ensureDir,
  reportDir,
  unsignedPdfPath,
  signedPdfPath,
  writeFileAtomic,
  fileExists,
  readFileBase64,
};

