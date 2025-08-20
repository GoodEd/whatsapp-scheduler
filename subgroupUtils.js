import { readFile, writeFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { randomUUID } from 'crypto';

const SUBGROUPS_PATH = process.env.SUBGROUPS_PATH || 'subgroups.csv';

export async function loadSubgroups() {
  try {
    const content = await readFile(SUBGROUPS_PATH, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Parse group_ids from comma-separated string to array
    return records.map(record => ({
      ...record,
      group_ids: record.group_ids ? record.group_ids.split(',').map(id => id.trim()) : []
    }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function saveSubgroups(subgroups) {
  const header = 'subgroup_id,subgroup_name,description,group_ids,created_at,updated_at\n';
  const csvContent = header + subgroups.map(subgroup => {
    const escapeCsv = (value) => {
      if (value === undefined || value === null) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    
    return [
      escapeCsv(subgroup.subgroup_id),
      escapeCsv(subgroup.subgroup_name),
      escapeCsv(subgroup.description),
      escapeCsv(Array.isArray(subgroup.group_ids) ? subgroup.group_ids.join(',') : subgroup.group_ids),
      escapeCsv(subgroup.created_at),
      escapeCsv(subgroup.updated_at)
    ].join(',');
  }).join('\n');
  
  await writeFile(SUBGROUPS_PATH, csvContent, 'utf8');
}

export async function createSubgroup(name, description, groupIds) {
  const subgroups = await loadSubgroups();
  
  const newSubgroup = {
    subgroup_id: randomUUID(),
    subgroup_name: name,
    description: description || '',
    group_ids: Array.isArray(groupIds) ? groupIds : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  subgroups.push(newSubgroup);
  await saveSubgroups(subgroups);
  
  return newSubgroup;
}

export async function updateSubgroup(subgroupId, updates) {
  const subgroups = await loadSubgroups();
  const index = subgroups.findIndex(sg => sg.subgroup_id === subgroupId);
  
  if (index === -1) {
    throw new Error('Subgroup not found');
  }
  
  subgroups[index] = {
    ...subgroups[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  await saveSubgroups(subgroups);
  return subgroups[index];
}

export async function deleteSubgroup(subgroupId) {
  const subgroups = await loadSubgroups();
  const filteredSubgroups = subgroups.filter(sg => sg.subgroup_id !== subgroupId);
  
  if (filteredSubgroups.length === subgroups.length) {
    throw new Error('Subgroup not found');
  }
  
  await saveSubgroups(filteredSubgroups);
  return true;
}

export async function getSubgroupGroups(subgroupId) {
  const subgroups = await loadSubgroups();
  const subgroup = subgroups.find(sg => sg.subgroup_id === subgroupId);
  
  if (!subgroup) {
    throw new Error('Subgroup not found');
  }
  
  return subgroup.group_ids;
}