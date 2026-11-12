const DPLedger = artifacts.require("DPLedger");
const { refuse, nouveauLedger } = require("../helpers/utils");

contract("01 - Déploiement et enregistrement des datasets", (accounts) => {
  const [owner, analyste1, analyste2, intrus] = accounts;
  let ledger;

  beforeEach(async () => {
    ledger = await nouveauLedger(DPLedger, owner, analyste1);
  });

  it("définit le déployeur comme owner", async () => {
    assert.equal(await ledger.owner(), owner);
  });

  it("enregistre un dataset et émet DatasetRegistered", async () => {
    const tx = await ledger.registerDataset(2, "Donnees RH", 500, { from: owner });
    assert.equal(tx.logs[0].event, "DatasetRegistered");
    assert.equal(tx.logs[0].args.id.toString(), "2");
    const d = await ledger.getDataset(2);
    assert.equal(d.nom, "Donnees RH");
    assert.equal(d.total.toString(), "500");
    assert.equal(d.consomme.toString(), "0");
    assert.equal(d.nbResets.toString(), "0");
  });

  it("refuse l'enregistrement par un non-owner", async () => {
    await refuse(ledger.registerDataset(2, "X", 500, { from: intrus }), "Reserve a l'owner");
  });

  it("refuse un dataset déjà enregistré", async () => {
    await refuse(ledger.registerDataset(1, "Doublon", 500, { from: owner }), "Dataset deja enregistre");
  });

  it("refuse un budget nul", async () => {
    await refuse(ledger.registerDataset(3, "Vide", 0, { from: owner }), "Budget invalide");
  });

  it("refuse la lecture d'un dataset inconnu", async () => {
    await refuse(ledger.getDataset(99), "Dataset inconnu");
  });
});
