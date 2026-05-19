const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { expect } = require('chai');
const { REPO_ROOT, makeTmp, removeTmp } = require('./helpers');

const ALWAYS_SKIP = new Set(['.git', 'node_modules', '.DS_Store']);

function walk(dir, prefix = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ALWAYS_SKIP.has(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

describe('npm pack', function () {
  this.timeout(600_000);

  let tmpPack;
  let tarball;
  let packed;

  before(function () {
    this.timeout(180_000);
    tmpPack = makeTmp('tronbox-pack-tarball-');
    const r = spawnSync('npm', ['pack', '--pack-destination', tmpPack, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 180_000
    });
    if (r.status !== 0) throw new Error(`npm pack failed: ${r.stderr}`);
    const jsonStart = r.stdout.indexOf('[');
    if (jsonStart < 0) throw new Error(`npm pack produced no JSON:\n${r.stdout}`);
    const meta = JSON.parse(r.stdout.slice(jsonStart))[0];
    tarball = path.join(tmpPack, meta.filename);
    packed = new Set(meta.files.map(f => f.path));
  });

  after(() => removeTmp(tmpPack));

  it('ships every required directory and root file', () => {
    const requiredRoots = ['build', 'sample-projects'];
    const missingFromRequiredRoots = [];

    for (const root of requiredRoots) {
      for (const f of walk(path.join(REPO_ROOT, root), root)) {
        if (!packed.has(f)) missingFromRequiredRoots.push(f);
      }
    }

    expect(
      missingFromRequiredRoots,
      `npm pack is missing files under required directories:\n${missingFromRequiredRoots.join('\n')}`
    ).to.be.empty;

    const requiredRootFiles = ['console.sol', 'README.md', 'LICENSE'];
    const missingRootFiles = requiredRootFiles.filter(f => !packed.has(f));
    expect(missingRootFiles, `npm pack is missing required root files:\n${missingRootFiles.join('\n')}`).to.be.empty;
  });

  it('keeps build/ aligned with src/', () => {
    const srcFiles = new Set(walk(path.join(REPO_ROOT, 'src')));
    const buildFiles = new Set(walk(path.join(REPO_ROOT, 'build')));
    const allowedExtras = new Set(['tronbox.js']);

    const missing = [...srcFiles].filter(f => !buildFiles.has(f));
    const extra = [...buildFiles].filter(f => !srcFiles.has(f) && !allowedExtras.has(f));

    const lines = [];
    if (missing.length)
      lines.push(`files present in src/ but missing in build/:\n${missing.map(f => `  - ${f}`).join('\n')}`);
    if (extra.length)
      lines.push(`unexpected files in build/ without a src/ counterpart:\n${extra.map(f => `  + ${f}`).join('\n')}`);

    expect(lines.length, `build/ and src/ are out of sync:\n${lines.join('\n')}`).to.equal(0);
  });

  describe('end-to-end checks with an installed package tarball', function () {
    this.timeout(600_000);

    let tmpInstall;
    let packedBin;

    before(function () {
      this.timeout(480_000);
      tmpInstall = makeTmp('tronbox-pack-install-');
      fs.writeFileSync(
        path.join(tmpInstall, 'package.json'),
        JSON.stringify({ name: 'tronbox-pack-host', private: true })
      );
      const install = spawnSync('npm', ['install', '--no-audit', '--no-fund', '--no-progress', tarball], {
        cwd: tmpInstall,
        encoding: 'utf-8',
        timeout: 480_000
      });
      if (install.status !== 0)
        throw new Error(`npm install of packed tarball failed: ${install.stderr}\n${install.stdout}`);

      packedBin = path.join(tmpInstall, 'node_modules', '.bin', 'tronbox');
      if (!fs.existsSync(packedBin)) throw new Error(`installed tronbox binary is missing at ${packedBin}`);
    });

    after(() => removeTmp(tmpInstall));

    function runPacked(args, { cwd, env = {}, timeout = 300_000 } = {}) {
      return spawnSync(packedBin, args, {
        cwd,
        encoding: 'utf-8',
        timeout,
        env: { ...process.env, ...env, FORCE_COLOR: '0' }
      });
    }

    describe('after running tronbox init', () => {
      let tmp;

      before(function () {
        this.timeout(600_000);
        tmp = makeTmp('tronbox-pack-init-');
        const r = runPacked(['init'], {
          cwd: tmp,
          env: { TRONBOX_CREATE_JAVASCRIPT_METACOIN_PROJECT_WITH_DEFAULTS: 'true' },
          timeout: 480_000
        });
        expect(r.status, r.stderr).to.equal(0);
        expect(fs.existsSync(path.join(tmp, 'contracts', 'MetaCoin.sol'))).to.equal(true);
      });

      after(() => removeTmp(tmp));

      it('runs tronbox test successfully', () => {
        const r = runPacked(['test'], { cwd: tmp });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include("Using network 'development'");
        expect(r.stdout).to.include('Contract: MetaCoin');
        expect(r.stdout).to.match(/\d+ passing/);
        expect(r.stdout).to.not.match(/\d+ failing/);
      });

      it('runs tronbox flatten and outputs fully inlined sources', () => {
        const r = runPacked(['flatten', 'contracts/MetaCoin.sol'], { cwd: tmp });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.match(/^\/\/ Sources flattened with TronBox v\d+\.\d+\.\d+/);
        expect(r.stdout).to.include('// File contracts/MetaCoin.sol');
        expect(r.stdout).to.include('@openzeppelin/contracts');
        expect(r.stdout).to.not.match(/^\s*import\s+['"]/m);
      });
    });

    describe('after running tronbox unbox', () => {
      let tmp;

      before(function () {
        this.timeout(480_000);
        tmp = makeTmp('tronbox-pack-unbox-');
        const r = runPacked(['unbox', 'metacoin-box'], { cwd: tmp, timeout: 480_000 });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Unbox successful');
      });

      after(() => removeTmp(tmp));

      it('runs tronbox test successfully', () => {
        const r = runPacked(['test'], { cwd: tmp });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include("Using network 'development'");
        expect(r.stdout).to.include('Contract: MetaCoin');
        expect(r.stdout).to.match(/\d+ passing/);
        expect(r.stdout).to.not.match(/\d+ failing/);
      });
    });
  });
});
