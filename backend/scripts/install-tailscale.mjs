import { mkdir, writeFile, mkdtemp, rm, copyFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const version = process.env.TS_VERSION || '1.104.1';
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Set TS_VERSION to a reviewed stable version.');
if (process.platform !== 'linux' || !['x64','arm64'].includes(process.arch)) throw new Error('The Render installer supports Linux x64/arm64 only.');
const arch = process.arch === 'x64' ? 'amd64' : 'arm64';
const name = `tailscale_${version}_${arch}`;
const url = `https://pkgs.tailscale.com/stable/${name}.tgz`;
const directory = resolve(fileURLToPath(new URL('../../',import.meta.url)),'.render-bin');
const temp = await mkdtemp(join(tmpdir(),'poultry-tailscale-build-'));
try {
  const [archiveResponse,hashResponse] = await Promise.all([fetch(url),fetch(url+'.sha256')]);
  if (!archiveResponse.ok || !hashResponse.ok) throw new Error('Official Tailscale download failed.');
  const archive = Buffer.from(await archiveResponse.arrayBuffer());
  const expected = (await hashResponse.text()).trim().split(/\s+/)[0];
  if (!/^[a-f0-9]{64}$/i.test(expected) || createHash('sha256').update(archive).digest('hex') !== expected) throw new Error('Tailscale archive checksum mismatch.');
  await writeFile(join(temp,'package.tgz'),archive);
  execFileSync('tar',['-xzf',join(temp,'package.tgz'),'-C',temp]);
  await mkdir(directory,{recursive:true});
  for (const binary of ['tailscale','tailscaled']) {
    await copyFile(join(temp,name,binary),join(directory,binary));
    await chmod(join(directory,binary),0o755);
  }
  console.log(`Installed checksum-verified Tailscale ${version} for ${arch}.`);
} finally {await rm(temp,{recursive:true,force:true});}
