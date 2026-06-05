import fs from 'fs/promises';
import path from 'path';

const getDataPath = (name) => path.join(process.cwd(), 'data', `${name}.json`);

export async function readData(name) {
  const file = await fs.readFile(getDataPath(name), 'utf8');
  return JSON.parse(file);
}

export async function writeData(name, data) {
  await fs.writeFile(getDataPath(name), JSON.stringify(data, null, 2), 'utf8');
  return data;
}
