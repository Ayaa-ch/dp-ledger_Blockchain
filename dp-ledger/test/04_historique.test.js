const DPLedger = artifacts.require("DPLedger");
const { refuse, nouveauLedger } = require("../helpers/utils");

contract("04 - Historique des requêtes", (accounts) => {
  const [owner, analyste1, analyste2, intrus] = accounts;
  const hash = web3.utils.keccak256("SELECT AVG(age) FROM patients");
  let ledger;

  beforeEach(async () => {
    ledger = await nouveauLedger(DPLedger, owner, analyste1);
  });

  it("est vide au départ", async () => {
    assert.equal((await ledger.getQueryCount(1)).toString(), "0");
  });

  it("enregistre chaque requête (analyste, epsilon, hash, date)", async () => {
    await ledger.submitQuery(1, 100, hash, { from: analyste1 });
    await ledger.authorizeAnalyst(1, analyste2, { from: owner });
    await ledger.submitQuery(1, 250, hash, { from: analyste2 });

    assert.equal((await ledger.getQueryCount(1)).toString(), "2");
    const h = await ledger.getQueryHistory(1);
    assert.equal(h[0].analyste, analyste1);
    assert.equal(h[0].epsilon.toString(), "100");
    assert.equal(h[0].hashRequete, hash);
    assert.isAbove(Number(h[0].timestamp), 0);
    assert.equal(h[1].analyste, analyste2);
    assert.equal(h[1].epsilon.toString(), "250");
  });

  it("ne garde pas les requêtes refusées", async () => {
    await refuse(ledger.submitQuery(1, 5000, hash, { from: analyste1 }), "Budget insuffisant");
    assert.equal((await ledger.getQueryCount(1)).toString(), "0");
  });
});
