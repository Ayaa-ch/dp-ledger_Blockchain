const DPLedger = artifacts.require("DPLedger");
const { refuse, nouveauLedger } = require("../helpers/utils");

contract("06 - Réinitialisation du budget (resetBudget)", (accounts) => {
  const [owner, analyste1, analyste2, intrus] = accounts;
  const hash = web3.utils.keccak256("SELECT AVG(age) FROM patients");
  let ledger;

  beforeEach(async () => {
    ledger = await nouveauLedger(DPLedger, owner, analyste1);
    await ledger.submitQuery(1, 700, hash, { from: analyste1 });
  });

  it("l'owner remet le budget à zéro et émet BudgetReset", async () => {
    const tx = await ledger.resetBudget(1, "Nouvelle periode", { from: owner });
    assert.equal(tx.logs[0].event, "BudgetReset");
    assert.equal(tx.logs[0].args.consommeAvantReset.toString(), "700");
    assert.equal(tx.logs[0].args.raison, "Nouvelle periode");
    assert.equal((await ledger.getRemainingBudget(1)).toString(), "1000");
  });

  it("compte les resets", async () => {
    await ledger.resetBudget(1, "Reset 1", { from: owner });
    await ledger.resetBudget(1, "Reset 2", { from: owner });
    const d = await ledger.getDataset(1);
    assert.equal(d.nbResets.toString(), "2");
  });

  it("conserve l'historique des requêtes après un reset", async () => {
    await ledger.resetBudget(1, "Nouvelle periode", { from: owner });
    assert.equal((await ledger.getQueryCount(1)).toString(), "1");
  });

  it("refuse un reset sans raison", async () => {
    await refuse(ledger.resetBudget(1, "", { from: owner }), "Raison obligatoire");
  });

  it("refuse un reset par un non-owner", async () => {
    await refuse(ledger.resetBudget(1, "Triche", { from: analyste1 }), "Reserve a l'owner");
  });
});
