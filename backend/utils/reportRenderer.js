const escapeHtml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatValue = (value, def = '-') => {
  if (value === null || value === undefined || value === '') return escapeHtml(def);
  if (Array.isArray(value)) {
    return value.length ? value.map(v => escapeHtml(v)).join(', ') : escapeHtml(def);
  }
  return escapeHtml(value);
};

const formatDate = (value, fallback = '-') => {
  if (!value) return escapeHtml(fallback);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatValue(value, fallback);
  }
  return escapeHtml(date.toLocaleDateString('tr-TR'));
};

const formatTimeRangeValue = (start, end) => {
  const s = start ? String(start).trim() : '';
  const e = end ? String(end).trim() : '';
  if (!s && !e) return '';
  if (s && e) return `${s} - ${e}`;
  return s || e;
};

const STYLE_PRESETS = {
  small: {
    pagePadding: '20px',
    containerPadding: '24px',
    headerGap: '18px',
    companyFont: '20px',
    documentFont: '13px',
    metaFont: '11px',
    metaPadding: '5px 7px',
    fontBase: '11px',
    valueFont: '11px',
    labelFont: '9px',
    sectionTitleFont: '11px',
    sectionTitlePadding: '8px 10px',
    sectionGap: '18px',
    blockPadding: '6px 8px',
    blockPaddingCompact: '5px 7px',
    photoMinHeight: '90px',
    photoPadding: '12px',
    photoGap: '10px',
    notesFont: '11px',
    footerFont: '10px',
    footerSpacing: '26px',
  },
  medium: {
    pagePadding: '24px',
    containerPadding: '32px',
    headerGap: '24px',
    companyFont: '22px',
    documentFont: '16px',
    metaFont: '12px',
    metaPadding: '6px 8px',
    fontBase: '12px',
    valueFont: '12px',
    labelFont: '10px',
    sectionTitleFont: '13px',
    sectionTitlePadding: '10px 12px',
    sectionGap: '24px',
    blockPadding: '10px 12px',
    blockPaddingCompact: '8px 10px',
    photoMinHeight: '120px',
    photoPadding: '16px',
    photoGap: '14px',
    notesFont: '12px',
    footerFont: '11px',
    footerSpacing: '32px',
  },
  large: {
    pagePadding: '28px',
    containerPadding: '36px',
    headerGap: '28px',
    companyFont: '24px',
    documentFont: '18px',
    metaFont: '13px',
    metaPadding: '7px 9px',
    fontBase: '13px',
    valueFont: '13px',
    labelFont: '11px',
    sectionTitleFont: '14px',
    sectionTitlePadding: '12px 14px',
    sectionGap: '28px',
    blockPadding: '12px 14px',
    blockPaddingCompact: '10px 12px',
    photoMinHeight: '140px',
    photoPadding: '18px',
    photoGap: '18px',
    notesFont: '13px',
    footerFont: '12px',
    footerSpacing: '38px',
  },
};

const resolveStylePreset = (scale) => STYLE_PRESETS[scale] || STYLE_PRESETS.medium;

const normalizeColumns = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const buildRowsFromCells = (cells, columnCount) => {
  const rows = [];
  let currentRow = [];
  let remaining = columnCount;

  cells.forEach((cell) => {
    const span = Math.min(columnCount, Math.max(1, parseInt(cell.span, 10) || 1));
    if (span > remaining) {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [];
      remaining = columnCount;
    }
    currentRow.push({ ...cell, span });
    remaining -= span;
    if (remaining === 0) {
      rows.push(currentRow);
      currentRow = [];
      remaining = columnCount;
    }
  });

  if (currentRow.length) {
    rows.push(currentRow);
  }
  return rows;
};

const renderGridTable = (section, cells, columnCount, tableClass = 'kv-table') => {
  const cols = normalizeColumns(section.columns || section.pairsPerRow || columnCount, columnCount);
  const rows = buildRowsFromCells(cells, cols);
  let html = `<table class="${tableClass}">`;

  if (!rows.length) {
    html += `<tr><td class="kv-block kv-block--empty" colspan="${cols}">-</td></tr>`;
  } else {
    rows.forEach((row) => {
      let filled = 0;
      html += '<tr>';
      row.forEach((cell) => {
        const className = ['kv-block', cell.className].filter(Boolean).join(' ');
        html += `<td class="${className}" colspan="${cell.span}">${cell.html}</td>`;
        filled += cell.span;
      });
      if (filled < cols) {
        html += `<td class="kv-block kv-block--empty" colspan="${cols - filled}"></td>`;
      }
      html += '</tr>';
    });
  }

  html += '</table>';
  return wrapSection(section, html);
};

const renderKeyValue = (section, data = {}) => {
  const items = section.items || [];
  const cells = items.map((item) => {
    const rawValue = item.value !== undefined
      ? (typeof item.value === 'function' ? item.value(data) : item.value)
      : data[item.name];

    let valueHtml;
    switch (item.format) {
      case 'date':
        valueHtml = formatDate(rawValue);
        break;
      default:
        valueHtml = formatValue(rawValue);
        break;
    }

    const unit = item.unit ? `<span class="kv-unit">${escapeHtml(item.unit)}</span>` : '';
    const html = `
      <div class="kv-label">${escapeHtml(item.label || item.name || '')}</div>
      <div class="kv-value">${valueHtml}${unit}</div>
    `;

    return {
      span: item.colspan,
      className: item.emphasis ? 'kv-block--emphasis' : '',
      html
    };
  });

  return renderGridTable(section, cells, normalizeColumns(section.columns || 2, 2));
};

const determineChecklistTone = (rawValue, question = {}) => {
  if (Array.isArray(question.passValues) && question.passValues.includes(rawValue)) {
    return 'pass';
  }
  if (Array.isArray(question.failValues) && question.failValues.includes(rawValue)) {
    return 'fail';
  }

  const str = (rawValue || '').toString().toLocaleLowerCase('tr-TR');
  if (!str) return 'neutral';
  if (str.includes('uygun değil') || str.includes('fail') || str.includes('değil')) return 'fail';
  if (str.includes('uygun') || str.includes('pass')) return 'pass';
  if (str === 'n/a' || str === 'na' || str.includes('uygulanamaz')) return 'neutral';
  return 'neutral';
};

const renderChecklist = (section, data = {}) => {
  const questions = section.questions || [];
  const cells = questions.map((question) => {
    const rawValue = data[question.name];
    const tone = determineChecklistTone(rawValue, question);
    const valueHtml = `<span class="status-tag status-${tone}">${formatValue(rawValue)}</span>`;
    const html = `
      <div class="kv-label">${escapeHtml(question.label || question.name || '')}</div>
      <div class="kv-value kv-value--status">${valueHtml}</div>
    `;
    return {
      span: question.colspan,
      className: 'kv-block--compact',
      html
    };
  });

  const columns = normalizeColumns(section.columns || 2, 2);
  return renderGridTable(section, cells, columns, 'kv-table kv-table--compact');
};

const renderTable = (section, data = {}) => {
  const columns = section.columns || [];
  const field = section.field || section.id;
  const rows = Array.isArray(data[field]) ? data[field] : [];
  const columnCount = columns.length || 1;

  let tableHtml = '<div class="table-wrapper"><table class="structured-table">';
  if (columns.length) {
    tableHtml += '<thead><tr>' + columns.map(col => `<th>${escapeHtml(col.label || col.name || '')}</th>`).join('') + '</tr></thead>';
  }
  tableHtml += '<tbody>';
  if (rows.length) {
    rows.forEach((row) => {
      tableHtml += '<tr>' + columns.map((col) => {
        const cellValue = row ? row[col.name] : undefined;
        const unit = col.unit ? ` <span class="kv-unit">${escapeHtml(col.unit)}</span>` : '';
        return `<td>${formatValue(cellValue)}${unit}</td>`;
      }).join('') + '</tr>';
    });
  } else {
    tableHtml += `<tr><td class="structured-table__empty" colspan="${columnCount}">Kayıt bulunmuyor</td></tr>`;
  }
  tableHtml += '</tbody></table></div>';

  return wrapSection(section, tableHtml);
};

const renderPhotos = (section, data = {}, photos = []) => {
  const field = section.field || section.id;
  let urls = [];
  if (field && Array.isArray(data[field])) {
    urls = data[field];
  } else if (Array.isArray(photos)) {
    urls = photos;
  }

  const grid = (urls || []).map((url) => (
    `<div class="photo-item"><img src="${escapeHtml(url)}" alt="${escapeHtml(section.title || field || 'photo')}" /></div>`
  )).join('');
  const inner = `<div class="photo-grid">${grid || '<div class="photo-item photo-item--empty">Fotoğraf bulunmuyor</div>'}</div>`;
  return wrapSection(section, inner);
};

const renderNotes = (section, data = {}) => {
  const field = section.field || section.id;
  const val = field ? data[field] : '';
  const inner = `<div class="notes">${formatValue(val)}</div>`;
  return wrapSection(section, inner);
};

const renderLegacy = (template, data, photos) => {
  let sectionsHTML = '';
  for (const section of template.sections || []) {
    if (!section.fields) continue;
    let html = '<table class="legacy-table">';
    for (const field of section.fields) {
      const value = data[field.name];
      if (field.type === 'table' && Array.isArray(value)) {
        let tableHTML = '<table class="structured-table">';
        if (field.columns && value.length > 0) {
          tableHTML += '<thead><tr>' + field.columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('') + '</tr></thead><tbody>';
          for (const row of value) {
            tableHTML += '<tr>' + field.columns.map(col => `<td>${formatValue(row[col.name])}</td>`).join('') + '</tr>';
          }
          tableHTML += '</tbody>';
        } else {
          tableHTML += '<tbody><tr><td>Kayıt bulunmuyor</td></tr></tbody>';
        }
        tableHTML += '</table>';
        html += `<tr><th>${escapeHtml(field.label)}</th><td>${tableHTML}</td></tr>`;
      } else if (field.type === 'photo') {
        let photoUrls = [];
        const mapped = data[field.name];
        if (Array.isArray(mapped)) photoUrls = mapped; else if (typeof mapped === 'string') photoUrls = [mapped];
        else photoUrls = (photos || []).filter(url => url.includes(field.name));
        const imgs = photoUrls.map(url => `<img src="${escapeHtml(url)}" alt="${escapeHtml(field.label)}" class="legacy-photo">`).join('');
        html += `<tr><th>${escapeHtml(field.label)}</th><td>${imgs || '-'}</td></tr>`;
      } else {
        html += `<tr><th>${escapeHtml(field.label)}</th><td>${formatValue(value)}</td></tr>`;
      }
    }
    html += '</table>';
    sectionsHTML += wrapSection(section, html);
  }
  return sectionsHTML;
};

const wrapSection = (section, inner) => {
  const title = section.title ? `<div class="section-title">${escapeHtml(section.title)}</div>` : '';
  return `
    <section class="section">
      ${title}
      <div class="section-body">
        ${inner}
      </div>
    </section>
  `;
};

const renderTemplate = (template, data, photos) => {
  if (!template || !Array.isArray(template.sections)) return '';
  let html = '';
  for (const section of template.sections) {
    if (!section) continue;
    const type = section.type;
    if (!type) {
      return renderLegacy(template, data, photos);
    }
    switch (type) {
      case 'key_value':
        html += renderKeyValue(section, data); break;
      case 'checklist':
        html += renderChecklist(section, data); break;
      case 'table':
        html += renderTable(section, data); break;
      case 'photos':
        html += renderPhotos(section, data, photos); break;
      case 'notes':
        html += renderNotes(section, data); break;
      default:
        html += wrapSection(section, '<div class="notes">Desteklenmeyen bölüm türü</div>');
    }
  }
  return html;
};

const baseStyles = (preset) => `
  :root {
    --report-page-padding: ${preset.pagePadding};
    --report-container-padding: ${preset.containerPadding};
    --report-header-gap: ${preset.headerGap};
    --report-company-font: ${preset.companyFont};
    --report-document-font: ${preset.documentFont};
    --report-meta-font: ${preset.metaFont};
    --report-meta-padding: ${preset.metaPadding};
    --report-font-base: ${preset.fontBase};
    --report-font-value: ${preset.valueFont};
    --report-font-label: ${preset.labelFont};
    --report-section-title-font: ${preset.sectionTitleFont};
    --report-section-title-padding: ${preset.sectionTitlePadding};
    --report-section-gap: ${preset.sectionGap};
    --report-block-padding: ${preset.blockPadding};
    --report-block-padding-compact: ${preset.blockPaddingCompact};
    --report-photo-min-height: ${preset.photoMinHeight};
    --report-photo-padding: ${preset.photoPadding};
    --report-photo-gap: ${preset.photoGap};
    --report-notes-font: ${preset.notesFont};
    --report-footer-font: ${preset.footerFont};
    --report-footer-spacing: ${preset.footerSpacing};
  }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: var(--report-page-padding); background: #f3f4f6; color: #0f172a; font-size: var(--report-font-base); }
  .report-container { background: #ffffff; border: 2px solid #1f2937; padding: var(--report-container-padding); width: 100%; max-width: 900px; margin: 0 auto; }
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--report-header-gap); margin-bottom: calc(var(--report-header-gap) * 1.1); }
  .report-header__title { display: flex; flex-direction: column; gap: 4px; }
  .report-company { font-size: var(--report-company-font); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
  .report-document { font-size: var(--report-document-font); font-weight: 600; text-transform: uppercase; color: #1f2937; }
  .report-meta { min-width: 220px; }
  .meta-table { width: 100%; border-collapse: collapse; font-size: var(--report-meta-font); }
  .meta-table th { text-align: left; background: #1f2937; color: #ffffff; padding: var(--report-meta-padding); border: 1px solid #0f172a; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-table td { padding: var(--report-meta-padding); border: 1px solid #0f172a; background: #f8fafc; }
  .section { margin-bottom: var(--report-section-gap); border: 1px solid #1f2937; }
  .section-title { background: #1f2937; color: #ffffff; font-weight: 700; padding: var(--report-section-title-padding); font-size: var(--report-section-title-font); text-transform: uppercase; letter-spacing: 0.04em; }
  .section-body { padding: 0; background: #ffffff; }
  .kv-table { width: 100%; border-collapse: collapse; font-size: var(--report-font-value); }
  .kv-table tr { border-bottom: 1px solid #cbd5f5; }
  .kv-block { border-right: 1px solid #cbd5f5; padding: var(--report-block-padding); vertical-align: top; }
  .kv-block:last-child { border-right: none; }
  .kv-block--empty { background: #f8fafc; color: #94a3b8; min-height: 36px; }
  .kv-block--emphasis { background: #e2e8f0; font-weight: 600; }
  .kv-table--compact .kv-block, .kv-block--compact { padding: var(--report-block-padding-compact); }
  .kv-label { font-size: var(--report-font-label); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; margin-bottom: 4px; }
  .kv-value { font-size: var(--report-font-value); color: #0f172a; }
  .kv-value--status { display: flex; align-items: center; }
  .kv-unit { margin-left: 4px; font-size: calc(var(--report-font-label) + 1px); color: #64748b; }
  .status-tag { display: inline-block; padding: 3px 10px; border-radius: 999px; font-weight: 600; text-transform: uppercase; font-size: calc(var(--report-font-label) + 1px); letter-spacing: 0.06em; }
  .status-pass { background: #10b981; color: #ffffff; }
  .status-fail { background: #ef4444; color: #ffffff; }
  .status-neutral { background: #e2e8f0; color: #1f2937; }
  .table-wrapper { overflow: hidden; }
  .structured-table { width: 100%; border-collapse: collapse; font-size: var(--report-font-value); }
  .structured-table th { background: #e2e8f0; color: #0f172a; font-weight: 700; text-transform: uppercase; padding: var(--report-block-padding); border: 1px solid #1f2937; }
  .structured-table td { padding: var(--report-block-padding); border: 1px solid #1f2937; }
  .structured-table__empty { text-align: center; color: #94a3b8; font-style: italic; }
  .legacy-table { width: 100%; border-collapse: collapse; font-size: var(--report-font-value); }
  .legacy-table th { background: #e2e8f0; text-align: left; padding: var(--report-block-padding); border: 1px solid #1f2937; width: 30%; }
  .legacy-table td { padding: var(--report-block-padding); border: 1px solid #1f2937; }
  .legacy-photo { max-width: 120px; margin-right: 8px; border: 1px solid #cbd5f5; padding: 2px; }
  .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--report-photo-gap); padding: var(--report-photo-padding); }
  .photo-item { border: 1px solid #cbd5f5; padding: 8px; display: flex; justify-content: center; align-items: center; min-height: var(--report-photo-min-height); }
  .photo-item img { max-width: 100%; max-height: var(--report-photo-min-height); object-fit: cover; }
  .photo-item--empty { background: #f8fafc; color: #94a3b8; font-style: italic; }
  .notes { padding: var(--report-photo-padding); font-size: var(--report-notes-font); line-height: 1.6; white-space: pre-wrap; min-height: 60px; }
  .report-footer { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: var(--report-footer-spacing); font-size: var(--report-footer-font); color: #475569; display: flex; flex-direction: column; gap: 4px; }
  .report-footer strong { color: #0f172a; }
  .qr-block { display: flex; gap: 12px; align-items: center; margin-top: 4px; }
  .qr-block img { width: 88px; height: 88px; border: 1px solid #cbd5f5; padding: 4px; background: #fff; }
  .qr-info { font-size: calc(var(--report-font-label) + 1px); color: #475569; word-break: break-word; }
  .qr-info a { color: inherit; text-decoration: none; }
`;

const resolveStyleScale = (report, template) => {
  const templateScale = template?.settings?.reportStyle?.scale;
  const reportStyle = report?.report_style || report?.style || {};
  const candidates = [
    reportStyle.scale,
    reportStyle.fontScale,
    report?.report_style_scale,
    report?.layout_scale,
    templateScale,
  ];
  const scale = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
  return (scale || 'medium').toLowerCase();
};

const buildHTML = (report) => {
  const template = report.template || {};
  const data = report.inspection_data || {};
  const photos = report.photo_urls || [];

  const styleScale = resolveStyleScale(report, template);
  const stylePreset = resolveStylePreset(styleScale);

  const generalInfoData = {
    isveren_unvan: report.customer_name,
    is_emri_no: report.work_order_number,
    muayene_tarihi: report.inspection_date,
    muayene_saati: formatTimeRangeValue(report.start_time, report.end_time),
    muayene_teknisyeni: [report.technician_name, report.technician_surname].filter(Boolean).join(' ')
  };

  const generalInfoSection = renderKeyValue({
    title: '1. GENEL BİLGİLER',
    type: 'key_value',
    columns: 3,
    items: [
      { name: 'isveren_unvan', label: 'İşveren Ünvanı' },
      { name: 'is_emri_no', label: 'İş Emri No' },
      { name: 'muayene_tarihi', label: 'Muayene Tarihi', format: 'date' },
      { name: 'muayene_saati', label: 'Muayene Saati' },
      { name: 'muayene_teknisyeni', label: 'Muayene Teknisyeni', colspan: 3 }
    ]
  }, generalInfoData);

  const equipmentInfoSection = renderKeyValue({
    title: '2. EKİPMAN BİLGİLERİ',
    type: 'key_value',
    columns: 2,
    items: [
      { name: 'equipment_name', label: 'Ekipman Adı' },
      { name: 'equipment_type', label: 'Ekipman Türü' }
    ]
  }, report);

  const sectionsHTML = `
    ${generalInfoSection}
    ${equipmentInfoSection}
    ${renderTemplate(template, data, photos)}
  `;

  const reportNumber = report.report_code || report.report_number || report.id;
  const createdAt = report.created_at ? formatDate(report.created_at) : formatDate(new Date());
  const inspectionDate = formatDate(report.inspection_date);
  const qrUrl = report.qr_public_url ? escapeHtml(report.qr_public_url) : '';
  const qrBlock = report.qr_code_data_url
    ? `
        <div class="qr-block">
          <img src="${report.qr_code_data_url}" alt="Rapor QR Kodu" />
          <div class="qr-info">
            <div><strong>QR Doğrulama</strong></div>
            ${qrUrl ? `<div><a href="${qrUrl}">${qrUrl}</a></div>` : ''}
          </div>
        </div>
      `
    : `<div><strong>QR Token:</strong> ${formatValue(report.qr_token)}</div>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Muayene Raporu</title>
        <style>${baseStyles(stylePreset)}</style>
      </head>
      <body>
        <div class="report-container">
          <header class="report-header">
            <div class="report-header__title">
              <div class="report-company">${escapeHtml(report.company_name || '')}</div>
              <div class="report-document">Muayene Raporu</div>
            </div>
            <div class="report-meta">
              <table class="meta-table">
                <tr><th>Rapor No</th><td>${formatValue(reportNumber)}</td></tr>
                <tr><th>Rapor Tarihi</th><td>${createdAt}</td></tr>
                <tr><th>İş Emri No</th><td>${formatValue(report.work_order_number)}</td></tr>
                <tr><th>Muayene Tarihi</th><td>${inspectionDate}</td></tr>
              </table>
            </div>
          </header>

          ${sectionsHTML}

          <footer class="report-footer">
            ${qrBlock}
            <div>Bu rapor ${formatValue(report.company_name)} tarafından oluşturulmuştur.</div>
            <div>Rapor Oluşturma Tarihi: ${createdAt}</div>
          </footer>
        </div>
      </body>
    </html>
  `;
};

module.exports = { buildHTML };
