const DPLedger = artifacts.require("DPLedger");
const { refuse, nouveauLedger } = require("../helpers/utils");

contract("05 - Modification du budget (updateBudget)", (accounts) => {
  const [owner, analyste1, analyste2, intrus] = accounts;
  const hash = web3.utils.keccak256("SELECT AVG(age) FROM patients");
  let ledger;

  beforeEach(async () => {
    ledger = await nouveauLedger(DPLedger, owner, analyste1);
  });

  it("l'owner augmente le budget et émet BudgetUpdated", async () => {
    await ledger.submitQuery(1, 800, hash, { from: analyste1 });
    const tx = await ledger.updateBudget(1, 1500, { from: owner });
    assert.equal(tx.logs[0].event, "BudgetUpdated");
    assert.equal(tx.logs[0].args.ancienTotal.toString(), "1000");
    assert.equal(tx.logs[0].args.nouveauTotal.toString(), "1500");
    assert.equal((await ledger.getRemainingBudget(1)).toString(), "700");
  });

  it("refuse un total inférieur au budget déjà consommé", async () => {
    await ledger.submitQuery(1, 600, hash, { from: analyste1 });
    await refuse(ledger.updateBudget(1, 500, { from: owner }), "Inferieur au budget deja consomme");
  });

  it("refuse la modification par un non-owner", async () => {
    await refuse(ledger.updateBudget(1, 5000, { from: analyste1 }), "Reserve a l'owner");
  });
});
