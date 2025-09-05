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
  if (value === null || value === undefined || value === '') return def;
  if (Array.isArray(value)) return value.length ? value.map(v => escapeHtml(v)).join(', ') : def;
  return escapeHtml(value);
};

function renderKeyValue(section, data) {
  const items = section.items || [];
  let html = '<table class="data-table">';
  for (const item of items) {
    const val = data[item.name];
    const unit = item.unit ? ` ${escapeHtml(item.unit)}` : '';
    html += `
      <tr>
        <td class="label">${escapeHtml(item.label || item.name)}:</td>
        <td class="value">${formatValue(val)}${unit}</td>
      </tr>
    `;
  }
  html += '</table>';
  return wrapSection(section, html);
}

function renderChecklist(section, data) {
  const qs = section.questions || [];
  let html = '<table class="data-table">';
  for (const q of qs) {
    const val = data[q.name];
    const pass = q.passValues && q.passValues.includes(val);
    const badgeClass = pass ? 'badge badge-pass' : 'badge badge-fail';
    html += `
      <tr>
        <td class="label">${escapeHtml(q.label || q.name)}:</td>
        <td class="value"><span class="${badgeClass}">${formatValue(val)}</span></td>
      </tr>
    `;
  }
  html += '</table>';
  return wrapSection(section, html);
}

function renderTable(section, data) {
  const columns = section.columns || [];
  const rows = data[section.field || section.id] || [];
  let inner = '<table class="inner-table">';
  if (columns.length) {
    inner += '<tr>' + columns.map(c => `<th>${escapeHtml(c.label || c.name)}</th>`).join('') + '</tr>';
  }
  for (const row of Array.isArray(rows) ? rows : []) {
    inner += '<tr>' + columns.map(c => `<td>${formatValue(row[c.name])}${c.unit ? ' ' + escapeHtml(c.unit) : ''}</td>`).join('') + '</tr>';
  }
  inner += '</table>';
  return wrapSection(section, inner);
}

function renderPhotos(section, data, photos) {
  const field = section.field;
  let urls = [];
  if (field && Array.isArray(data[field])) {
    urls = data[field];
  } else if (Array.isArray(photos)) {
    urls = photos;
  }
  const grid = (urls || []).map(url => `<img src="${escapeHtml(url)}" alt="${escapeHtml(section.title || field || 'photo')}" class="photo-item">`).join('');
  const inner = `<div class="photo-grid">${grid || '-'}</div>`;
  return wrapSection(section, inner);
}

function renderNotes(section, data) {
  const field = section.field;
  const val = field ? data[field] : '';
  const inner = `<div class="notes">${formatValue(val)}</div>`;
  return wrapSection(section, inner);
}

function renderLegacy(template, data, photos) {
  // Backward compatibility for existing templates with sections[].fields
  let sectionsHTML = '';
  for (const section of template.sections || []) {
    if (!section.fields) continue;
    let html = '<table class="data-table">';
    for (const field of section.fields) {
      const value = data[field.name];
      if (field.type === 'table' && Array.isArray(value)) {
        let tableHTML = '<table class="inner-table">';
        if (field.columns && value.length > 0) {
          tableHTML += '<tr>' + field.columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('') + '</tr>';
          for (const row of value) {
            tableHTML += '<tr>' + field.columns.map(col => `<td>${formatValue(row[col.name])}</td>`).join('') + '</tr>';
          }
        }
        tableHTML += '</table>';
        html += `<tr><td class="label">${escapeHtml(field.label)}:</td><td class="value">${tableHTML}</td></tr>`;
      } else if (field.type === 'photo') {
        let photoUrls = [];
        const mapped = data[field.name];
        if (Array.isArray(mapped)) photoUrls = mapped; else if (typeof mapped === 'string') photoUrls = [mapped];
        else photoUrls = (photos || []).filter(url => url.includes(field.name));
        const imgs = photoUrls.map(url => `<img src="${escapeHtml(url)}" alt="${escapeHtml(field.label)}" class="photo-item">`).join('');
        html += `<tr><td class="label">${escapeHtml(field.label)}:</td><td class="value">${imgs || '-'}</td></tr>`;
      } else {
        html += `<tr><td class="label">${escapeHtml(field.label)}:</td><td class="value">${formatValue(value)}</td></tr>`;
      }
    }
    html += '</table>';
    sectionsHTML += wrapSection(section, html);
  }
  return sectionsHTML;
}

function wrapSection(section, inner) {
  return `
    <div class="section">
      <h3>${escapeHtml(section.title || '')}</h3>
      ${inner}
    </div>
  `;
}

function renderTemplate(template, data, photos) {
  if (!template || !Array.isArray(template.sections)) return '';
  let html = '';
  for (const section of template.sections) {
    if (!section) continue;
    const type = section.type;
    if (!type) {
      // legacy
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
}

function baseStyles() {
  return `
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid #333; }
    .company-info { margin-bottom: 20px; }
    .equipment-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
    .section { margin-bottom: 25px; }
    .section h3 { background: #333; color: white; padding: 10px; margin: 0; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .data-table td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
    .label { font-weight: bold; background: #f9f9f9; width: 30%; }
    .value { width: 70%; }
    .inner-table { width: 100%; border-collapse: collapse; }
    .inner-table th, .inner-table td { padding: 5px; border: 1px solid #ccc; text-align: left; }
    .inner-table th { background: #e9e9e9; font-weight: bold; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 8px; font-size: 12px; }
    .badge-pass { background: #16a34a; color: #fff; }
    .badge-fail { background: #ef4444; color: #fff; }
    .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .photo-item { max-width: 100%; height: auto; border: 1px solid #ddd; padding: 2px; }
    .notes { white-space: pre-wrap; }
  `;
}

function buildHTML(report) {
  const template = report.template || {};
  const data = report.inspection_data || {};
  const photos = report.photo_urls || [];

  const sectionsHTML = renderTemplate(template, data, photos);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Muayene Raporu</title>
      <style>${baseStyles()}</style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(report.company_name || '')}</h1>
        <h2>MUAYENE RAPORU</h2>
      </div>
      <div class="company-info">
        <table class="data-table">
          <tr><td class="label">Müşteri Firma:</td><td class="value">${escapeHtml(report.customer_name || '')}</td></tr>
          <tr><td class="label">İş Emri No:</td><td class="value">${escapeHtml(report.work_order_number || '')}</td></tr>
          <tr><td class="label">Muayene Tarihi:</td><td class="value">${escapeHtml(new Date(report.inspection_date).toLocaleDateString('tr-TR'))}</td></tr>
          <tr><td class="label">Muayene Saati:</td><td class="value">${escapeHtml(report.start_time || '')} - ${escapeHtml(report.end_time || '')}</td></tr>
          <tr><td class="label">Muayene Teknisyeni:</td><td class="value">${escapeHtml((report.technician_name || '') + ' ' + (report.technician_surname || ''))}</td></tr>
        </table>
      </div>
      <div class="equipment-info">
        <h3>EKIPMAN BİLGİLERİ</h3>
        <table class="data-table">
          <tr><td class="label">Ekipman Adı:</td><td class="value">${escapeHtml(report.equipment_name || '')}</td></tr>
          <tr><td class="label">Ekipman Türü:</td><td class="value">${escapeHtml(report.equipment_type || '')}</td></tr>
        </table>
      </div>
      ${sectionsHTML}
      <div class="footer">
        <p>QR Token: ${escapeHtml(report.qr_token || '')}</p>
        <p>Bu rapor ${escapeHtml(report.company_name || '')} tarafından oluşturulmuştur.</p>
        <p>Rapor Oluşturma Tarihi: ${escapeHtml(new Date().toLocaleDateString('tr-TR'))}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = { buildHTML };

