import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
async function walk(directory) {
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const name=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(name));else files.push(name);
  }
  return files;
}
const files=[...await walk('assets'),...await walk('scripts'),...await walk('tests')];
for(const file of files.filter(name=>/\.m?js$/.test(name)))execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
for(const file of ['index.html','legal.html']) {
  const html=await readFile(file,'utf8');
  assert.match(html,/<html lang="en">/);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length,`Duplicate IDs in ${file}`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value=match[1];
    if(/^(https?:|mailto:|data:)/.test(value))continue;
    const [target,fragment]=value.split('#');
    const name=target.split('?')[0];
    if(name){assert.ok((await stat(name)).isFile(),`Missing target ${value}`);}
    else if(fragment)assert.ok(ids.includes(fragment),`Missing anchor ${value}`);
    if(name&&fragment&&name.endsWith('.html'))assert.ok((await readFile(name,'utf8')).includes(`id="${fragment}"`),`Missing legal anchor ${value}`);
  }
  assert.ok(!html.includes('YOUR_ACCESS_KEY_HERE'),'Placeholder form must not ship');
  assert.ok(!/<(?:script|link)[^>]+(?:src|href)="https?:/.test(html),'No external script/font dependencies');
}
assert.equal((await readFile('CNAME','utf8')).trim(),'golius.de');
console.log('Syntax, local assets/links, unique IDs, static privacy constraints and CNAME: OK.');
