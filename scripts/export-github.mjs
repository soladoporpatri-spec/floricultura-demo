import {cp,mkdir,lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,basename} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=resolve(root,'output/github-source');
await mkdir(destination,{recursive:true});
// Export an explicit public source set, without old hosting metadata or history.
const entries=['dist','scripts','tests','.github','README.md','package.json','.gitignore','docs/IMAGENS.md','docs/PUBLICACAO.md','docs/VERIFICACAO.md'];
for(const entry of entries){
  await cp(resolve(root,entry),resolve(destination,entry),{
    recursive:true,
    filter:async source=>!['.git','.openai','node_modules'].includes(basename(source))&&!(await lstat(source)).isSymbolicLink(),
  });
}
console.log(destination);
