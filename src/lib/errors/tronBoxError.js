class TronBoxError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.stack = '';
  }
}

module.exports = TronBoxError;
