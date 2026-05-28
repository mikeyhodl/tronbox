// Hits GitHub to clone the box. The metacoin-box round-trip also needs TRE
// running on http://127.0.0.1:9090.

const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, makeTmp, removeTmp } = require('./helpers');

describe('tronbox unbox', function () {
  this.timeout(300_000);

  describe('default box', () => {
    let tmp;
    before(() => {
      tmp = makeTmp();
      const r = runCli(['unbox'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Unbox successful');
    });
    after(() => removeTmp(tmp));

    it('lays down the expected project skeleton', () => {
      ['tronbox-config.js', 'tronbox.js'].forEach(f => {
        expect(fs.existsSync(path.join(tmp, f)), f).to.equal(true);
      });
      ['contracts', 'migrations', 'test'].forEach(d => {
        expect(fs.statSync(path.join(tmp, d)).isDirectory(), d).to.equal(true);
      });
    });

    it('the unboxed project compiles successfully', () => {
      const r = runCli(['compile'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiled successfully');
    });
  });

  describe('metacoin-box', () => {
    let tmp;
    before(() => {
      tmp = makeTmp();
      const r = runCli(['unbox', 'metacoin-box'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Unbox successful');
    });
    after(() => removeTmp(tmp));

    it('installs npm dependencies and writes contracts/MetaCoin.sol', () => {
      expect(fs.existsSync(path.join(tmp, 'package.json'))).to.equal(true);
      expect(fs.statSync(path.join(tmp, 'node_modules')).isDirectory()).to.equal(true);
      expect(fs.existsSync(path.join(tmp, 'contracts', 'MetaCoin.sol'))).to.equal(true);
    });

    it('runs `tronbox test` successfully against the development network', () => {
      const r = runCli(['test'], { cwd: tmp });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'development'");
      expect(r.stdout).to.include('Contract: MetaCoin');
      expect(r.stdout).to.match(/\d+ passing/);
      expect(r.stdout).to.not.match(/\d+ failing/);
    });
  });

  describe('errors', () => {
    it('rejects a malformed box specifier', () => {
      const tmp = makeTmp();
      try {
        // Three slashes, not a URL or `org/repo`, not a bare name — the normalizer rejects it.
        const r = runCli(['unbox', 'a/b/c'], { cwd: tmp });
        expect(r.status).to.not.equal(0);
        expect(r.stderr).to.match(/invalid format/i);
      } finally {
        removeTmp(tmp);
      }
    });
  });
});
