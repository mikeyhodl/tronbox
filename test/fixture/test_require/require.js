// Exercises Resolver.require dispatch paths via the test-context `artifacts` global.
// `tronbox test` first deploys the default migrations (Empty + Migrations) so the
// build dir has artifacts to resolve against.

contract('artifacts.require', function () {
  it('resolves a contract via "./Empty.sol"', function () {
    const Empty = artifacts.require('./Empty.sol');
    assert.strictEqual(Empty.contractName, 'Empty');
  });

  it('resolves the same contract via the bare name "Empty"', function () {
    const Empty = artifacts.require('Empty');
    assert.strictEqual(Empty.contractName, 'Empty');
  });

  it('throws "Could not find artifacts" for an unknown contract', function () {
    assert.throws(() => artifacts.require('./Nonexistent.sol'), /Could not find artifacts/);
  });

  it('throws when the relative path contains a separator', function () {
    assert.throws(() => artifacts.require('./contracts/Empty.sol'), /Could not find artifacts/);
  });

  it('resolves an npm-published JSON artifact via FSSource.requireJson', function () {
    const Errors = artifacts.require('@openzeppelin/contracts/build/contracts/Errors.json');
    assert.strictEqual(Errors.contractName, 'Errors');
  });

  it('resolves "<pkg>/<Contract>.sol" via NPMSource.require', function () {
    const Errors = artifacts.require('@openzeppelin/contracts/Errors.sol');
    assert.strictEqual(Errors.contractName, 'Errors');
  });

  it('throws when a .json import resolves outside the project directory', function () {
    assert.throws(() => artifacts.require('./../../etc/passwd.json'), /Could not find artifacts/);
  });
});
