import { cp, mkdir, rm } from 'node:fs/promises';
// A static export only. The source root also stays GitHub Pages compatible.
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for (const name of ['index.html','legal.html','CNAME','.nojekyll','assets']) await cp(name,`dist/${name}`,{recursive:true});
console.log('Built dist/: static HTML, CSS, modules and existing custom-domain configuration.');
