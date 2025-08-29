import { readFile, writeFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';

export async function loadSchedule(csvPath) {
  try {
    const content = await readFile(csvPath, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return records;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function saveSchedule(csvPath, records) {
  try {
    // Create backup before saving
    const backupPath = csvPath + '.backup';
    try {
      const existingContent = await readFile(csvPath, 'utf8');
      await writeFile(backupPath, existingContent, 'utf8');
    } catch (err) {
      // Backup failed, but continue with save
      console.warn('Failed to create backup:', err.message);
    }
    
    const header = 'type,group_id,body,poll_options,image_url,send_at,sent,status,message_id,error_details,sent_at,subgroup_id\n';
    const csvContent = header + records.map(record => {
      const escapeCsv = (value) => {
        if (value === undefined || value === null) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };
      
      return [
        escapeCsv(record.type),
        escapeCsv(record.group_id),
        escapeCsv(record.body),
        escapeCsv(record.poll_options),
        escapeCsv(record.image_url),
        escapeCsv(record.send_at),
        escapeCsv(record.sent),
        escapeCsv(record.status),
        escapeCsv(record.message_id),
        escapeCsv(record.error_details),
        escapeCsv(record.sent_at),
        escapeCsv(record.subgroup_id || '')
      ].join(',');
    }).join('\n');
    
    await writeFile(csvPath, csvContent, 'utf8');
    console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST] CSV saved successfully with ${records.length} records`);
  } catch (error) {
    console.error('Error saving CSV:', error);
    throw error;
  }
}