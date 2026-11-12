module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "2026",
      from: "0x7e85c503e05d311a970a18dbe727e4a49a8d4304",
      gas: 6000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: { evmVersion: "london" }
    }
  }
};
