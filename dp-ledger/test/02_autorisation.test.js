const DPLedger = artifacts.require("DPLedger");
const { refuse, nouveauLedger } = require("../helpers/utils");

contract("02 - Autorisation des analystes", (accounts) => {
  const [owner, analyste1, analyste2, intrus] = accounts;
  let ledger;

  beforeEach(async () => {
    ledger = await nouveauLedger(DPLedger, owner, analyste1);
  });

  it("autorise un analyste et émet AnalystAuthorized", async () => {
    const tx = await ledger.authorizeAnalyst(1, analyste2, { from: owner });
    assert.equal(tx.logs[0].event, "AnalystAuthorized");
    assert.isTrue(await ledger.analystesAutorises(1, analyste2));
  });

  it("n'autorise pas par défaut", async () => {
    assert.isFalse(await ledger.analystesAutorises(1, intrus));
  });

  it("refuse l'autorisation par un non-owner", async () => {
    await refuse(ledger.authorizeAnalyst(1, analyste2, { from: intrus }), "Reserve a l'owner");
  });

  it("refuse l'autorisation sur un dataset inconnu", async () => {
    await refuse(ledger.authorizeAnalyst(99, analyste2, { from: owner }), "Dataset inconnu");
  });
});
