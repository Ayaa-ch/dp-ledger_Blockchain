const DPLedger = artifacts.require("DPLedger");
const { refuse, nouveauLedger } = require("../helpers/utils");

contract("03 - Consommation du budget (submitQuery)", (accounts) => {
  const [owner, analyste1, analyste2, intrus] = accounts;
  const hash = web3.utils.keccak256("SELECT AVG(age) FROM patients");
  let ledger;

  beforeEach(async () => {
    ledger = await nouveauLedger(DPLedger, owner, analyste1);
  });

  it("décompte le budget et émet QuerySubmitted", async () => {
    const tx = await ledger.submitQuery(1, 400, hash, { from: analyste1 });
    assert.equal(tx.logs[0].event, "QuerySubmitted");
    assert.equal(tx.logs[0].args.epsilon.toString(), "400");
    assert.equal(tx.logs[0].args.restant.toString(), "600");
    assert.equal((await ledger.getRemainingBudget(1)).toString(), "600");
  });

  it("cumule plusieurs requêtes (400 + 400 = 200 restant)", async () => {
    await ledger.submitQuery(1, 400, hash, { from: analyste1 });
    await ledger.submitQuery(1, 400, hash, { from: analyste1 });
    assert.equal((await ledger.getRemainingBudget(1)).toString(), "200");
  });

  it("refuse un dépassement du budget", async () => {
    await ledger.submitQuery(1, 800, hash, { from: analyste1 });
    await refuse(ledger.submitQuery(1, 300, hash, { from: analyste1 }), "Budget insuffisant");
    assert.equal((await ledger.getRemainingBudget(1)).toString(), "200");
  });

  it("refuse un analyste non autorisé", async () => {
    await refuse(ledger.submitQuery(1, 100, hash, { from: intrus }), "Analyste non autorise");
  });

  it("refuse un epsilon nul", async () => {
    await refuse(ledger.submitQuery(1, 0, hash, { from: analyste1 }), "Epsilon invalide");
  });

  it("refuse une requête sur un dataset inconnu", async () => {
    await refuse(ledger.submitQuery(99, 100, hash, { from: analyste1 }), "Dataset inconnu");
  });

  it("émet BudgetExhausted quand le budget est épuisé, puis refuse", async () => {
    const tx = await ledger.submitQuery(1, 1000, hash, { from: analyste1 });
    assert.equal(tx.logs[1].event, "BudgetExhausted");
    assert.equal((await ledger.getRemainingBudget(1)).toString(), "0");
    await refuse(ledger.submitQuery(1, 1, hash, { from: analyste1 }), "Budget insuffisant");
  });
});
