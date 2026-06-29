# Shared: ABI Fragments
<!-- Source: curate-v1/curate-light-skill.md §abi, curate-v1/pgtcr-stake-curate-skill.md §abi, curate-v1-scout/scout-skills.md §3 -->

Use these signatures with ethers.js or viem — both parse Solidity-style ABI strings natively.

Solidity-style over JSON: smaller token footprint, human-readable grep, natively accepted by ethers/viem
without transformation. JSON ABI arrays are never used here.

---

## LightGeneralizedTCR

### Read functions

```solidity
function submissionBaseDeposit() external view returns (uint256)
function removalBaseDeposit() external view returns (uint256)
function submissionChallengeBaseDeposit() external view returns (uint256)
function removalChallengeBaseDeposit() external view returns (uint256)
function challengePeriodDuration() external view returns (uint256)
function arbitrator() external view returns (address)
function arbitratorExtraData() external view returns (bytes)
function winnerStakeMultiplier() external view returns (uint256)
function loserStakeMultiplier() external view returns (uint256)
function sharedStakeMultiplier() external view returns (uint256)
function MULTIPLIER_DIVISOR() external view returns (uint256)
function getItemInfo(bytes32 _itemID) external view returns (uint8 status, uint256 numberOfRequests, uint256 sumDeposit)
function getRequestInfo(bytes32 _itemID, uint256 _requestID) external view returns (bool disputed, uint256 disputeID, uint256 submissionTime, bool resolved, address[3] parties, uint256 numberOfRounds, uint8 ruling, address requestArbitrator, bytes requestArbitratorExtraData, uint256 metaEvidenceID)
function getRoundInfo(bytes32 _itemID, uint256 _requestID, uint256 _roundID) external view returns (bool appealed, uint256[3] amountPaid, bool[3] hasPaid, uint256 feeRewards)
function getContributions(bytes32 _itemID, uint256 _requestID, uint256 _roundID, address _contributor) external view returns (uint256[3] contributions)
function items(bytes32 _itemID) external view returns (uint8 status, uint256 numberOfRequests)
function requestsDisputeData(bytes32 _itemID, uint256 _requestID) external view returns (uint256 disputeID, bool resolved)
```

### Write functions

```solidity
function addItem(string _item) external payable
function removeItem(bytes32 _itemID, string _evidence) external payable
function challengeRequest(bytes32 _itemID, string _evidence) external payable
function submitEvidence(bytes32 _itemID, string _evidence) external
function fundAppeal(bytes32 _itemID, uint8 _side) external payable
function executeRequest(bytes32 _itemID) external
function withdrawFeesAndRewards(address _beneficiary, bytes32 _itemID, uint256 _requestID, uint256 _roundID) external
```

### Events

```solidity
event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence)
// topic0 = keccak256("MetaEvidence(uint256,string)")
//        = 0x61606860eb6c87306811e2695215385101daab53bd6ab4e9f9049aead9363c7d

event NewItem(bytes32 indexed _itemID, string _data, bool _addedDirectly)
// topic0 = keccak256("NewItem(bytes32,string,bool)")

event ItemStatusChange(bytes32 indexed _itemID, uint256 indexed _requestIndex, uint256 indexed _roundIndex, bool _disputed, bool _resolved)
// topic0 = keccak256("ItemStatusChange(bytes32,uint256,uint256,bool,bool)")

event RequestSubmitted(bytes32 indexed _itemID, uint256 indexed _requestIndex)
// topic0 = keccak256("RequestSubmitted(bytes32,uint256)")

event Evidence(address indexed _arbitrator, uint256 indexed _evidenceGroupID, address indexed _party, string _evidence)
// topic0 = keccak256("Evidence(address,uint256,address,string)")

event Dispute(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _metaEvidenceID, uint256 _evidenceGroupID)
// topic0 = keccak256("Dispute(address,uint256,uint256,uint256)")

event Ruling(address indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling)
// topic0 = keccak256("Ruling(address,uint256,uint256)")

event AppealContribution(bytes32 indexed _itemID, uint256 indexed _requestIndex, uint256 indexed _roundIndex, address _contributor, uint8 _side, uint256 _amount)
// topic0 = keccak256("AppealContribution(bytes32,uint256,uint256,address,uint8,uint256)")

event HasPaidAppealFee(bytes32 indexed _itemID, uint256 indexed _requestIndex, uint256 indexed _roundIndex, uint8 _side)
// topic0 = keccak256("HasPaidAppealFee(bytes32,uint256,uint256,uint8)")
```

---

## PermanentGTCR

### Read functions

```solidity
function token() external view returns (address)
// ERC20 token used for permanent stake (PGTCR only — no ETH stake model)

function submissionMinDeposit() external view returns (uint256)
function submissionPeriod() external view returns (uint256)
function reinclusionPeriod() external view returns (uint256)
function withdrawingPeriod() external view returns (uint256)
function arbitrationParamsCooldown() external view returns (uint256)
function arbitrator() external view returns (address)
function MULTIPLIER_DIVISOR() external view returns (uint256)
function challengeStakeMultiplier() external view returns (uint256)
function winnerStakeMultiplier() external view returns (uint256)
function loserStakeMultiplier() external view returns (uint256)
function sharedStakeMultiplier() external view returns (uint256)
function items(bytes32 _itemID) external view returns (uint8 status, uint128 arbitrationDeposit, uint120 challengeCount, address submitter, uint48 includedAt, uint48 withdrawingTimestamp, uint256 stake)
function challenges(bytes32 _itemID, uint256 _challengeID) external view returns (uint80 arbitrationParamsIndex, uint8 ruling, uint8 roundCount, address challenger, uint256 stake, uint256 disputeID)
function rounds(bytes32 _itemID, uint256 _challengeID, uint256 _roundID) external view returns (uint8 sideFunded, uint256 feeRewards)
function contributions(bytes32 _itemID, uint256 _challengeID, uint256 _roundID, address _contributor, uint256 _side) external view returns (uint256)
function getRoundAmountPaid(bytes32 _itemID, uint256 _challengeID, uint256 _roundID) external view returns (uint256[3] amountPaid)
function arbitrationParamsChanges(uint256 _index) external view returns (uint48 timestamp, bytes arbitratorExtraData)
```

### Write functions

```solidity
function addItem(string _item, uint256 _deposit) external payable
// PGTCR only: _deposit is the ERC20 token stake amount (approve token first); ETH value covers arbitration cost

function challengeItem(bytes32 _itemID, string _evidence) external payable
// PGTCR uses challengeItem, not challengeRequest (LGTCR uses challengeRequest — do not confuse)

function submitEvidence(bytes32 _itemID, string _evidence) external
function fundAppeal(bytes32 _itemID, uint8 _side) external payable
function startWithdrawItem(bytes32 _itemID) external payable
// PGTCR two-step withdrawal: call startWithdrawItem first, then withdrawItem after withdrawingPeriod elapses

function withdrawItem(bytes32 _itemID) external payable
function withdrawFeesAndRewards(address _beneficiary, bytes32 _itemID, uint120 _challengeID, uint256 _roundID) external
// _challengeID is uint120 (not uint256 as in LGTCR's _requestID)
```

---

## LightGeneralizedTCRView

(Scout registries use the LightGeneralizedTCRView helper at a fixed Gnosis address — see scout-registries.md for the hardcoded contract address.)

### Read functions

```solidity
function fetchArbitrable(address _address) external view returns (uint256 submissionBaseDeposit, uint256 removalBaseDeposit, uint256 submissionChallengeBaseDeposit, uint256 removalChallengeBaseDeposit, uint256 challengePeriodDuration, address arbitrator, bytes arbitratorExtraData, uint256 winnerStakeMultiplier, uint256 loserStakeMultiplier, uint256 sharedStakeMultiplier, uint256 MULTIPLIER_DIVISOR)
function getItem(address _address, bytes32 _itemID) external view returns (uint8 status, uint256 numberOfRequests, uint256 sumDeposit)
function getItemData(address _address, bytes32 _itemID) external view returns (string data)
function getItemRequests(address _address, bytes32 _itemID) external view returns (uint256[] requestIDs)
function getLatestRequestData(address _address, bytes32 _itemID) external view returns (bool disputed, uint256 disputeID, uint256 submissionTime, bool resolved, address[3] parties, uint256 numberOfRounds, uint8 ruling, address requestArbitrator, bytes requestArbitratorExtraData, uint256 metaEvidenceID)
function getLatestRoundRequestData(address _address, bytes32 _itemID) external view returns (bool appealed, uint256[3] amountPaid, bool[3] hasPaid, uint256 feeRewards)
function availableRewards(address _address, bytes32 _itemID, address _contributor) external view returns (uint256)
```

Prefer `fetchArbitrable` for aggregated deposit reads — one call instead of six. Use direct `LightGeneralizedTCR` reads for final truth on critical values.

---

## IArbitrator

Arbitrator ABI is deployment-specific. Use these signatures as the minimal interface; if a call reverts, fetch the verified ABI from the block explorer for the deployed arbitrator address.

```solidity
function arbitrationCost(bytes _extraData) external view returns (uint256)
function appealCost(uint256 _disputeID, bytes _extraData) external view returns (uint256)
function appealPeriod(uint256 _disputeID) external view returns (uint256 start, uint256 end)
function currentRuling(uint256 _disputeID) external view returns (uint256)
```

Read `arbitrator()` from the registry contract to get the arbitrator address, then read `arbitratorExtraData()` to pass as `_extraData` to `arbitrationCost`.

---

## Factory contracts

### LightGTCRFactory (LGTCR only)

```solidity
event NewGTCR(address indexed _address)
// topic0 = keccak256("NewGTCR(address)")

function deploy(address _arbitrator, bytes _arbitratorExtraData, address _connectedTCR, string _registrationMetaEvidence, string _clearingMetaEvidence, address _governor, uint256[4] _baseDeposits, uint256 _challengePeriodDuration, uint256[3] _stakeMultipliers, address _relayContract) external
```

### PermanentGTCRFactory (PGTCR only)

```solidity
event NewGTCR(address indexed _address)
// topic0 = keccak256("NewGTCR(address)")

function deploy(address _arbitrator, bytes _arbitratorExtraData, string _metaEvidence, address _governor, address _token, uint256 _submissionMinDeposit, uint256[4] _periods, uint256[4] _stakeMultipliers) external returns (address instance)
// PGTCR deploy returns the new instance address; LGTCR deploy does not
```
