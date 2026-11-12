.\geth --datadir node1 --networkid 2026 --nodiscover `
  --http --http.addr 127.0.0.1 --http.port 8545 `
  --http.api "eth,net,web3,personal,miner,admin" --http.corsdomain "*" `
  --allow-insecure-unlock `
  --unlock "0x7e85c503e05d311a970a18dbe727e4a49a8d4304,0x1b083683878f4f56a8cc8674a65c0331d77f966c,0xcb1f4f14e514d0120c5343545d59fc26716ec123,0xb98f20fbae5190df3a6638ce2df3bd7bc966011e" --password password.txt `
  --mine --miner.threads 1 --miner.etherbase "0x7e85c503e05d311a970a18dbe727e4a49a8d4304"