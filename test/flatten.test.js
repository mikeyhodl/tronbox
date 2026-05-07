const os = require('os');
const path = require('path');
const { expect } = require('chai');
const { runCli, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;

describe('tronbox flatten', function () {
  this.timeout(30_000);

  describe('default contracts dir', () => {
    it('flattens a single file with no imports', () => {
      const r = runCli(['flatten', 'contracts/Empty.sol'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.match(/^\/\/ Sources flattened with TronBox v\d+\.\d+\.\d+/);
      expect(r.stdout).to.include('// SPDX-License-Identifier: MIT');
      expect(r.stdout).to.include('// File contracts/Empty.sol');
      expect(r.stdout).to.include('// Original license: SPDX_License_Identifier: MIT');
      expect(r.stdout).to.include('contract Empty');
    });

    it('rejects a file outside the project directory', () => {
      const outside = path.join(os.tmpdir(), 'tronbox-flatten-outside.sol');
      const r = runCli(['flatten', outside], { cwd });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.match(/not found or is outside the project directory/i);
    });

    it('reports a missing file', () => {
      const r = runCli(['flatten', 'contracts/DoesNotExist.sol'], { cwd });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.match(/not found or is outside the project directory/i);
    });
  });

  describe('CONTRACTS_DIR=contracts_imports', () => {
    it('inlines all imports in topological order with a single SPDX header', () => {
      const r = runCli(['flatten', 'contracts_imports/Main.sol'], {
        cwd,
        env: { CONTRACTS_DIR: 'contracts_imports' }
      });
      expect(r.status, r.stderr).to.equal(0);

      // No raw `import` directives should remain in the output.
      expect(r.stdout).to.not.match(/^\s*import\s+['"]/m);

      // Single consolidated SPDX header at the top.
      const headers = r.stdout.match(/^\/\/ SPDX-License-Identifier:/gm) || [];
      expect(headers).to.have.lengthOf(1);
      expect(r.stdout).to.include('// Original license: SPDX_License_Identifier: MIT');

      // All four resolver paths inlined, dependencies before dependents.
      const idxIERC20 = r.stdout.indexOf('// File npm/@openzeppelin/contracts@5.4.0/token/ERC20/IERC20.sol');
      const idxFoo = r.stdout.indexOf('// File npm/sol-mock@1.0.0/Foo.sol');
      const idxB = r.stdout.indexOf('// File contracts_imports/B.sol');
      const idxMath = r.stdout.indexOf('// File contracts_imports/utils/Math.sol');
      const idxMain = r.stdout.indexOf('// File contracts_imports/Main.sol');
      expect(idxIERC20).to.be.greaterThan(-1);
      expect(idxFoo).to.be.greaterThan(-1);
      expect(idxB).to.be.greaterThan(-1);
      expect(idxMath).to.be.greaterThan(-1);
      expect(idxMain).to.be.greaterThan(idxB);
      expect(idxMain).to.be.greaterThan(idxMath);
      expect(idxMain).to.be.greaterThan(idxIERC20);
      expect(idxMain).to.be.greaterThan(idxFoo);
    });
  });

  describe('errors', () => {
    it('CONTRACTS_DIR=contracts_missing_npm reports the missing package', () => {
      const r = runCli(['flatten', 'contracts_missing_npm/Foo.sol'], {
        cwd,
        env: { CONTRACTS_DIR: 'contracts_missing_npm' }
      });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.match(/not found or is outside the project directory/i);
    });

    it('CONTRACTS_DIR=contracts_syntax_error reports a parser error', () => {
      const r = runCli(['flatten', 'contracts_syntax_error/Bad.sol'], {
        cwd,
        env: { CONTRACTS_DIR: 'contracts_syntax_error' }
      });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.match(/Could not parse/i);
    });
  });

  describe('running from a subdirectory', () => {
    it('a relative path from contracts/ resolves correctly', () => {
      const r = runCli(['flatten', 'Empty.sol'], { cwd: path.join(cwd, 'contracts') });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('// File contracts/Empty.sol');
      expect(r.stdout).to.include('contract Empty');
    });
  });
});
