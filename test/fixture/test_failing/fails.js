contract('Failing', function () {
  it('intentional assertion failure', function () {
    assert.strictEqual('actual', 'expected');
  });
});
