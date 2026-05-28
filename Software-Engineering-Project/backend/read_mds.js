import fs from 'fs';
import path from 'path';

const dir = '../';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.md')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const lines = content.split('\n');
    console.log(`=============================`);
    console.log(`File: ${file} (${content.length} bytes)`);
    console.log(`=============================`);
    console.log(lines.slice(0, 15).join('\n'));
    console.log('\n');
  }
});
