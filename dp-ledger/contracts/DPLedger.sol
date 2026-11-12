// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Differential Privacy Ledger
/// @notice Registre du budget de confidentialité (epsilon, en milli-epsilon : 1000 = epsilon 1.0).
/// @dev Le contrat ne calcule pas la confidentialité différentielle (requête SQL et bruit hors chaîne).
///      Il garantit le plafonnement du budget et un historique non modifiable des requêtes.
contract DPLedger {
    address public owner;

    struct Dataset {
        string nom;
        uint256 budgetTotal;
        uint256 budgetConsomme;
        uint256 nbResets;
        bool existe;
    }

    struct Query {
        address analyste;
        uint256 epsilon;
        bytes32 hashRequete;
        uint256 timestamp;
    }

    mapping(uint256 => Dataset) private datasets;
    mapping(uint256 => Query[]) private historique;
    mapping(uint256 => mapping(address => bool)) public analystesAutorises;

    event DatasetRegistered(uint256 indexed id, string nom, uint256 budgetTotal);
    event AnalystAuthorized(uint256 indexed id, address indexed analyste);
    event QuerySubmitted(uint256 indexed id, address indexed analyste, uint256 epsilon, bytes32 hashRequete, uint256 restant);
    event BudgetExhausted(uint256 indexed id);
    event BudgetUpdated(uint256 indexed id, uint256 ancienTotal, uint256 nouveauTotal);
    event BudgetReset(uint256 indexed id, uint256 consommeAvantReset, string raison);

    modifier onlyOwner() {
        require(msg.sender == owner, "Reserve a l'owner");
        _;
    }

    modifier datasetExiste(uint256 id) {
        require(datasets[id].existe, "Dataset inconnu");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Enregistre un dataset avec son budget total
    function registerDataset(uint256 id, string memory nom, uint256 budgetTotal) external onlyOwner {
        require(!datasets[id].existe, "Dataset deja enregistre");
        require(budgetTotal > 0, "Budget invalide");
        datasets[id] = Dataset(nom, budgetTotal, 0, 0, true);
        emit DatasetRegistered(id, nom, budgetTotal);
    }

    /// @notice Autorise un analyste à interroger un dataset
    function authorizeAnalyst(uint256 id, address analyste) external onlyOwner datasetExiste(id) {
        analystesAutorises[id][analyste] = true;
        emit AnalystAuthorized(id, analyste);
    }

    /// @notice Enregistre une requête (via son hash) et consomme epsilon
    function submitQuery(uint256 id, uint256 epsilon, bytes32 hashRequete) external datasetExiste(id) {
        Dataset storage d = datasets[id];
        require(analystesAutorises[id][msg.sender], "Analyste non autorise");
        require(epsilon > 0, "Epsilon invalide");
        require(d.budgetTotal - d.budgetConsomme >= epsilon, "Budget insuffisant");

        d.budgetConsomme += epsilon;
        historique[id].push(Query(msg.sender, epsilon, hashRequete, block.timestamp));

        uint256 restant = d.budgetTotal - d.budgetConsomme;
        emit QuerySubmitted(id, msg.sender, epsilon, hashRequete, restant);
        if (restant == 0) {
            emit BudgetExhausted(id);
        }
    }

    /// @notice Budget restant d'un dataset
    function getRemainingBudget(uint256 id) external view datasetExiste(id) returns (uint256) {
        return datasets[id].budgetTotal - datasets[id].budgetConsomme;
    }

    /// @notice Informations générales d'un dataset
    function getDataset(uint256 id) external view datasetExiste(id)
        returns (string memory nom, uint256 total, uint256 consomme, uint256 nbResets)
    {
        Dataset storage d = datasets[id];
        return (d.nom, d.budgetTotal, d.budgetConsomme, d.nbResets);
    }

    /// @notice Nombre de requêtes enregistrées pour un dataset
    function getQueryCount(uint256 id) external view datasetExiste(id) returns (uint256) {
        return historique[id].length;
    }

    /// @notice Historique complet des requêtes d'un dataset
    function getQueryHistory(uint256 id) external view datasetExiste(id) returns (Query[] memory) {
        return historique[id];
    }

    /// @notice Modifie le budget total (jamais en dessous de ce qui est déjà consommé)
    function updateBudget(uint256 id, uint256 nouveauTotal) external onlyOwner datasetExiste(id) {
        Dataset storage d = datasets[id];
        require(nouveauTotal >= d.budgetConsomme, "Inferieur au budget deja consomme");
        uint256 ancien = d.budgetTotal;
        d.budgetTotal = nouveauTotal;
        emit BudgetUpdated(id, ancien, nouveauTotal);
    }

    /// @notice Remet le budget consommé à zéro (action tracée, l'historique des requêtes est conservé)
    function resetBudget(uint256 id, string memory raison) external onlyOwner datasetExiste(id) {
        require(bytes(raison).length > 0, "Raison obligatoire");
        Dataset storage d = datasets[id];
        uint256 avant = d.budgetConsomme;
        d.budgetConsomme = 0;
        d.nbResets += 1;
        emit BudgetReset(id, avant, raison);
    }
}
