// `tronbox compile` against every Tron Solidity compiler version listed in
// the upstream solc-bin. Hits the network once at file load.

const { execFileSync } = require('child_process');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const homedir = require('homedir');
const { runCli, artifact, FIXTURE_DIR } = require('./helpers');
const { maxVersion } = require('../src/components/TronSolc');

const cwd = FIXTURE_DIR;
const buildDir = path.join(cwd, 'build');

const TRON_SOLC_DIR = path.join(homedir(), '.tronbox', 'solc');
const TRON_LIST_URL = 'https://tronprotocol.github.io/solc-bin/wasm/list.json';

const cachedSolc = v => path.join(TRON_SOLC_DIR, `soljson_v${v}.js`);

function compareVersions(a, b) {
  const ap = a.split('.').map(Number);
  const bp = b.split('.').map(Number);
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const av = ap[i] || 0;
    const bv = bp[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function fetchVersions() {
  const raw = execFileSync('curl', ['-fsSL', '--max-time', '30', TRON_LIST_URL], {
    encoding: 'utf-8'
  });
  const list = JSON.parse(raw);
  const all = [...new Set((list.builds || []).map(b => b.version))];
  return all.filter(v => compareVersions(v, maxVersion) <= 0).sort(compareVersions);
}

const versions = fetchVersions();

describe('full Tron compiler matrix', function () {
  this.timeout(180_000);

  describe('version list', () => {
    it('list.json newest version equals TronSolc.maxVersion', () => {
      expect(versions[versions.length - 1]).to.equal(maxVersion);
    });

    it('matrix is non-empty', () => {
      expect(versions.length).to.be.greaterThan(0);
    });
  });

  describe('every supported version', () => {
    versions.forEach(v => {
      it(`solc ${v}`, () => {
        fs.removeSync(buildDir);
        const r = runCli(['compile', '--all'], { cwd, env: { SOLC_VERSION: v } });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
        expect(r.stdout).to.include(`solc: ${v}`);
        expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
        expect(fs.existsSync(cachedSolc(v))).to.equal(true);
      });
    });
  });

  describe('first-run download trigger', () => {
    it('removing the cached compiler triggers a Fetching message', () => {
      const v = maxVersion;
      fs.removeSync(cachedSolc(v));
      fs.removeSync(buildDir);
      const r = runCli(['compile', '--all'], { cwd, env: { SOLC_VERSION: v } });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Fetching Tron Solidity compiler');
      expect(r.stdout).to.include(`solc: ${v}`);
      expect(fs.existsSync(cachedSolc(v))).to.equal(true);
    });
  });

  describe('unsupported solc versions', () => {
    it('SOLC_VERSION above maxVersion is rejected', () => {
      const r = runCli(['compile', '--all'], { cwd, env: { SOLC_VERSION: '100.0.0' } });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('currently supports Tron Solidity compiler');
      expect(r.stderr).to.include('100.0.0');
    });

    it('SOLC_VERSION not in list.json is rejected', () => {
      const r = runCli(['compile', '--all'], { cwd, env: { SOLC_VERSION: '0.5.99' } });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('Unable to locate Solidity compiler version');
      expect(r.stderr).to.include('0.5.99');
    });
  });
});
