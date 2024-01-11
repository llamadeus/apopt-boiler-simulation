import * as fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { fileURLToPath } from 'url';


export function localPath(url: string, ...other: string[]) {
  const __filename = fileURLToPath(url);

  return path.join(path.dirname(__filename), ...other);
}

export function readFile(path: string) {
  return fs.promises.readFile(path, 'utf8').then(content => content.trim());
}

export function readCsv<T>(path: string, parse: (data: Record<keyof T, string>) => T): Promise<T[]> {
  return readFile(path).then(content => {
    const { data } = Papa.parse<Record<keyof T, string>>(content, {
      header: true,
      transformHeader: (header: string) => (
        header.replace(/_([a-z])/g, (_, group) => group.toUpperCase())
      ),
    });

    return data.map(parse);
  });
}
