async function refuse(promise, raison) {
  try {
    await promise;
  } catch (e) {
    assert.isTrue(
      e.message.includes(raison) || /revert/i.test(e.message),
      "Erreur inattendue : " + e.message
    );
    return;
  }
  assert.fail("La transaction aurait dû être refusée : " + raison);
}

async function nouveauLedger(DPLedger, owner, analyste1) {
  const ledger = await DPLedger.new({ from: owner });
  await ledger.registerDataset(1, "Dossiers medicaux", 1000, { from: owner });
  await ledger.authorizeAnalyst(1, analyste1, { from: owner });
  return ledger;
}

module.exports = { refuse, nouveauLedger };
