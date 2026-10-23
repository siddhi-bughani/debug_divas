/**
 * SAHAY CSV Export Utility
 * Converts arrays of objects into properly formatted CSV and triggers download.
 */

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  // Extract column keys
  const keys = Object.keys(data[0]);

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Escape double quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csvRows = [];
  
  // Header row
  csvRows.push(keys.map(escapeCSV).join(','));

  // Data rows
  for (const row of data) {
    const values = keys.map((key) => escapeCSV(row[key]));
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
