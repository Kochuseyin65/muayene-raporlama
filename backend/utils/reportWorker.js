require('dotenv').config();
const pool = require('../config/database');
const { generateReportHTML, attachReportQrCode } = require('../controllers/reportController');
const { generatePDFBufferFromHTML } = require('./pdfGenerator');
const { unsignedPdfPath, writeFileAtomic } = require('./storage');

const BATCH_SIZE = parseInt(process.env.REPORT_WORKER_BATCH || '3', 10);
const LOOP_DELAY_MS = parseInt(process.env.REPORT_WORKER_DELAY_MS || '2000', 10);

async function fetchAndMarkJobs(client, batchSize) {
  // Mark a batch of pending jobs as processing and return them
  const res = await client.query(
    `WITH picked AS (
       SELECT id FROM report_jobs
       WHERE status = 'pending'
       ORDER BY priority ASC, created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     )
     UPDATE report_jobs j
     SET status = 'processing', attempts = attempts + 1, started_at = CURRENT_TIMESTAMP
     FROM picked p
     WHERE j.id = p.id
     RETURNING j.*`,
    [batchSize]
  );
  return res.rows;
}

async function processJob(job) {
  // Load report with all required data
  const res = await pool.query(
    `SELECT r.*, i.inspection_data, i.inspection_date, i.start_time, i.end_time, i.photo_urls,
            e.name as equipment_name, e.type as equipment_type, e.template,
            t.name as technician_name, t.surname as technician_surname,
            wo.work_order_number, cc.name as customer_name,
            comp.name as company_name, comp.logo_url
     FROM reports r
     JOIN inspections i ON r.inspection_id = i.id
     JOIN equipment e ON i.equipment_id = e.id
     JOIN technicians t ON i.technician_id = t.id
     JOIN work_orders wo ON i.work_order_id = wo.id
     JOIN customer_companies cc ON wo.customer_company_id = cc.id
     JOIN companies comp ON wo.company_id = comp.id
     WHERE r.id = $1`,
    [job.report_id]
  );
  if (res.rows.length === 0) {
    throw new Error('Report not found for job');
  }
  const report = res.rows[0];
  await attachReportQrCode(report);
  const html = generateReportHTML(report);
  const buf = await generatePDFBufferFromHTML(html);
  const out = unsignedPdfPath(report.id);
  await writeFileAtomic(out, buf);
  await pool.query('UPDATE reports SET unsigned_pdf_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [out, report.id]);
}

async function runLoop() {
  while (true) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const jobs = await fetchAndMarkJobs(client, BATCH_SIZE);
      await client.query('COMMIT');

      if (jobs.length === 0) {
        await new Promise(r => setTimeout(r, LOOP_DELAY_MS));
        continue;
      }

      // Process with limited concurrency (BATCH_SIZE)
      await Promise.all(jobs.map(async (job) => {
        try {
          await processJob(job);
          await pool.query(
            'UPDATE report_jobs SET status = $1, finished_at = CURRENT_TIMESTAMP, last_error = NULL WHERE id = $2',
            ['completed', job.id]
          );
        } catch (err) {
          console.error('Report job failed', job.id, err);
          await pool.query(
            'UPDATE report_jobs SET status = $1, finished_at = CURRENT_TIMESTAMP, last_error = $2 WHERE id = $3',
            ['failed', String(err && err.message || err), job.id]
          );
        }
      }));
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('Worker loop error:', e);
      await new Promise(r => setTimeout(r, LOOP_DELAY_MS));
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  runLoop().catch((e) => {
    console.error('Worker fatal error:', e);
    process.exit(1);
  });
}

module.exports = { runLoop };
