# Alkahest Contract Reference

## Escrow Obligation Types

Each escrow locks assets in a contract until an arbiter validates fulfillment.

| Type | Contract | ObligationData fields |
|------|----------|----------------------|
| ERC20 | `ERC20EscrowObligation` | `token: address`, `amount: uint256`, `arbiter: address`, `demand: bytes` |
| ERC721 | `ERC721EscrowObligation` | `token: address`, `tokenId: uint256`, `arbiter: address`, `demand: bytes` |
| ERC1155 | `ERC1155EscrowObligation` | `token: address`, `tokenId: uint256`, `amount: uint256`, `arbiter: address`, `demand: bytes` |
| Native Token | `NativeTokenEscrowObligation` | `amount: uint256`, `arbiter: address`, `demand: bytes` |
| Token Bundle | `TokenBundleEscrowObligation` | `nativeAmount: uint256`, `erc20Tokens: address[]`, `erc20Amounts: uint256[]`, `erc721Tokens: address[]`, `erc721TokenIds: uint256[]`, `erc1155Tokens: address[]`, `erc1155TokenIds: uint256[]`, `erc1155Amounts: uint256[]`, `arbiter: address`, `demand: bytes` |
| Attestation | `AttestationEscrowObligation` | `attestation: AttestationRequest`, `arbiter: address`, `demand: bytes` |
| Attestation Reference | `AttestationReferenceEscrowObligation` | `attestationUid: bytes32`, `arbiter: address`, `demand: bytes`, `validationExpirationTime: uint64`, `validationRevocable: bool` |

### Escrow lifecycle

1. `doObligation(data, expirationTime)` — lock assets, create EAS attestation
2. Fulfiller creates fulfillment attestation with `refUID` pointing to escrow
3. `collect(escrowUid, fulfillmentUid)` — arbiter validates, releases assets
4. `reclaim(uid)` — reclaim assets after expiration (buyer only)

## Payment Obligation Types

Payments transfer assets immediately upon attestation creation (no escrow hold).

| Type | Contract | ObligationData fields |
|------|----------|----------------------|
| ERC20 | `ERC20PaymentObligation` | `token: address`, `amount: uint256`, `payee: address` |
| ERC721 | `ERC721PaymentObligation` | `token: address`, `tokenId: uint256`, `payee: address` |
| ERC1155 | `ERC1155PaymentObligation` | `token: address`, `tokenId: uint256`, `amount: uint256`, `payee: address` |
| Native Token | `NativeTokenPaymentObligation` | `amount: uint256`, `payee: address` |
| Token Bundle | `TokenBundlePaymentObligation` | `nativeAmount: uint256`, `erc20Tokens: address[]`, `erc20Amounts: uint256[]`, `erc721Tokens: address[]`, `erc721TokenIds: uint256[]`, `erc1155Tokens: address[]`, `erc1155TokenIds: uint256[]`, `erc1155Amounts: uint256[]`, `payee: address` |

## Fulfillment Obligation Types

| Type | Contract | ObligationData fields |
|------|----------|----------------------|
| String | `StringObligation` | `item: string`, `schema: bytes32` |
| Commit-Reveal | `CommitRevealObligation` | `payload: bytes`, `salt: bytes32`, `schema: bytes32` |

### CommitRevealObligation details

- `commit(commitment, commitDeadline)` — submit hash commitment with ETH bond
- `doObligation(data, refUID)` — reveal fulfillment data
- `computeCommitment(refUID, claimer, data)` — compute expected commitment hash
- `reclaimBond(fulfillmentUid)` — reclaim bond after valid reveal
- `slashBond(commitment)` — slash bond if reveal deadline passes
- Commitment hash: `keccak256(abi.encode(refUID, claimer, keccak256(abi.encode(obligationData))))`
- Built-in `IArbiter` implementation verifies commitment exists in an earlier block

## Atomic Utilities

Atomic utilities combine payment + escrow collection into single-transaction settlements.

| Contract | Supported swaps |
|----------|----------------|
| `AtomicPaymentUtils` | Atomic pay-and-collect helpers for ERC20, ERC721, ERC1155, native token, and token bundle payment obligations (with ERC20 permit support) |

## Contract Addresses

### Base Sepolia

| Contract | Address |
|----------|---------|
| EAS | `0x4200000000000000000000000000000000000021` |
| EAS Schema Registry | `0x4200000000000000000000000000000000000020` |
| **ERC20** | |
| ERC20EscrowObligation | `0x1Fe964348Ec42D9Bb1A072503ce8b4744266FF43` |
| ERC20PaymentObligation | `0x8d13d7542E64D9Da29AB66B6E9b4a6583C64b3F6` |
| **ERC721** | |
| ERC721EscrowObligation | `0x7675a56b2880EF059cFC725E715E1139D689c07B` |
| ERC721PaymentObligation | `0x9Daf829f183cA46ad2146F489E7d14335C9B59a9` |
| **ERC1155** | |
| ERC1155EscrowObligation | `0xB8A3107DA5428a34f818ea4229233fBAe59C16F2` |
| ERC1155PaymentObligation | `0x6f71429bD940Bf3345780a8E5F5cf3BcdffE80C1` |
| **Native Token** | |
| NativeTokenEscrowObligation | `0x8a1172D32B8cEf14094cF1E7d6F3d1A36D949FDe` |
| NativeTokenPaymentObligation | `0xAB1E9714fbD4f9B5546e891B7Ba392b08c44c37A` |
| **Token Bundle** | |
| TokenBundleEscrowObligation | `0x38e8E5684aFB24A88cD9B276032bCBD19C4b9d6e` |
| TokenBundlePaymentObligation | `0xFa5446475De31fa3c6457E2b62EA5a8F8172Cd29` |
| **Attestation** | |
| AttestationEscrowObligation | `0x9D133Cbd51270a2A410465F82dAFFD6c1C87322D` |
| AttestationReferenceEscrowObligation | `0xa076e9ca47f192E6AfB67817608E382074CF0Dcf` |
| AtomicAttestationUtils | `0x0000000000000000000000000000000000000000` |
| **Fulfillment** | |
| StringObligation | `0x544873C22A3228798F91a71C4ef7a9bFe96E7CE0` |
| CommitRevealObligation | `0x447b11ce03237f0C674eF7F16c913c3B2e8ef494` |
| **Arbiters** | |
| TrivialArbiter | `0x50EDa6c29C740bfbA6875422287025D985b96b7b` |
| TrustedOracleArbiter | `0x3664b11BcCCeCA27C21BBAB43548961eD14d4D6D` |
| AllArbiter | `0x0D95c1Cd62cd9C7cCCB237a3Ae08aA61Ed83381f` |
| AnyArbiter | `0xaaC3465f340C7A2841A120F81Ce6744cda00d263` |
| IntrinsicsArbiter | `0x24aAFec3f86CAd330600dD2397DEB8498D44bfd9` |
| ERC8004Arbiter | `0x67B23406dd9e9EA884B3d14746ef73106b1C35d6` |
| ExclusiveRevocableConfirmationArbiter | `0xBA0e678f4F1a62f5d737F9289B7e1F2F8580DD8D` |
| ExclusiveUnrevocableConfirmationArbiter | `0x141Bfd94A1C2B2728dF693657d1C7589b06A139E` |
| NonexclusiveRevocableConfirmationArbiter | `0xB78A1870C5412EBa6042a5b1dE895E8f879AbeC6` |
| NonexclusiveUnrevocableConfirmationArbiter | `0x74FaFAAEa1bA879E73Cd7e38ec6F3ff86554D4B7` |
| RecipientArbiter | `0xE6CB55B60b6B47B45de05df75B48D656E4bD3730` |
| AttesterArbiter | `0xB0d19784373EC5FDd2E44A2b594B10FE9bBecC94` |
| SchemaArbiter | `0xc15Ef82Adf03820dA8a0705200602107a06652BE` |
| UidArbiter | `0x0Be4E6D777D5C1AE3DDF338AF2398A279571511b` |
| RefUidArbiter | `0xdEc95668f431639AAE975CfA9101Bb2A5b5803F6` |
| RevocableArbiter | `0x550eF7e901F612914651f3c92c0798eBab037AF6` |
| TimeAfterArbiter | `0xd88274b04194bebA06B32D3F67265e4b530F4C4d` |
| TimeBeforeArbiter | `0xEC177a4FA6c42B1EA2bbEC70F3FFaE2aCD94e4aF` |
| TimeEqualArbiter | `0x0E16A9f94aD457214d5e8AdD30c64D8c6FD4a416` |
| ExpirationTimeAfterArbiter | `0x05Ae296859454612a9a346B2EeBE6915319993Ec` |
| ExpirationTimeBeforeArbiter | `0x698008cC7F4714D331Aa27278BfE6B74FA925cF7` |
| ExpirationTimeEqualArbiter | `0x4d05EA86C2C0af7CA94dc71Da45aba9368e664e4` |

### Sepolia

| Contract | Address |
|----------|---------|
| EAS | `0xC2679fBD37d54388Ce493F1DB75320D236e1815e` |
| EAS Schema Registry | `0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0` |
| ERC20EscrowObligation | `0xB2c808911E84E80156101983897Da7c80e13cB47` |
| ERC20PaymentObligation | `0xb822aA07F55a8B75Ee133ede1f21C4E49DE7952f` |
| ERC721EscrowObligation | `0x2A7df117e45D93d34a7893CC3aE8B105Ae0B561C` |
| ERC721PaymentObligation | `0x59A9c929778Ad2cC4D5DB6151bDEf0F9Fa7A068C` |
| ERC1155EscrowObligation | `0xf04d9CA943f57353A3A735494E503280C1cD5e77` |
| ERC1155PaymentObligation | `0x52748DD0E39eD6eA9f626179b5eb512302adA7D9` |
| NativeTokenEscrowObligation | `0x9bA50DB048d1E5db034377abf97F92496D027C71` |
| NativeTokenPaymentObligation | `0xf60db64506E366a0A6c1f4cF9D849Adc7bB886D6` |
| TokenBundleEscrowObligation | `0x677Aa9e1CD9D05f57FbCa2327155EA7479ec7Ac3` |
| TokenBundlePaymentObligation | `0x36Fcf1Ddee838a94B1358285A11e8bbbb90eD9A1` |
| AttestationEscrowObligation | `0x6eb7792D821f32914Be75901F1b4269B13Efad2e` |
| AttestationReferenceEscrowObligation | `0x1A7c6F951e0a33F4910dbe56a200Eb413AEca17b` |
| AtomicAttestationUtils | `0x0000000000000000000000000000000000000000` |
| StringObligation | `0xC51C938f5497be8157DAf8CCc3Eb11Afb8b752C0` |
| CommitRevealObligation | `0x9fD6D7A3B4e4b5dD75c50F5f16Deba46162127C3` |
| TrivialArbiter | `0x594E79466b6ac01C6416C929e428264a4bdF0C92` |
| TrustedOracleArbiter | `0x3B2a812E3eb3B729D40d866Da16c2BB2b6cDd2f2` |
| AllArbiter | `0x847F69d27E4F1A8a115aCa3F4358B079706dc9CE` |
| AnyArbiter | `0xe968dFA581B8aBb94eC5F24d0b56163DE69511fD` |
| IntrinsicsArbiter | `0xaabdDAa76651d20922d1F561f924a40F6fE7710c` |
| ERC8004Arbiter | `0x367fEd55E65bd0FCCF8F966A04989AB61E1b5A49` |
| ExclusiveRevocableConfirmationArbiter | `0x941044D43F9d75dfA8Ad24880B9B9cAD6e116a66` |
| ExclusiveUnrevocableConfirmationArbiter | `0x16aeE626D398B547eDD5fa4BdAA638524C92921d` |
| NonexclusiveRevocableConfirmationArbiter | `0xe483EDA58b5f9Eba06A1ad0151dA5e4a5fFC8300` |
| NonexclusiveUnrevocableConfirmationArbiter | `0x01666d869918aDDDED1B30eF2d36f3C990F09BDE` |
| RecipientArbiter | `0xF1C9E20078A13816ACdDF3153e2eAaDd93Fd6E57` |
| AttesterArbiter | `0x6CC4068d471E96A1669097918e18017f5764f72a` |
| SchemaArbiter | `0x913eAdD13dcCdeD9CD5518075083b6C7A9574A8c` |
| UidArbiter | `0xae4fa2D5d7EDD6Aaf697dC0c98EDb921F0fEc058` |
| RefUidArbiter | `0xE9ee2c57B18283b66d342D33d63C55f1427f9e9B` |
| RevocableArbiter | `0xeda25079f76ef93c54cC042116Be8D88E49D3439` |
| TimeAfterArbiter | `0x0ea9e144FfDc6456E5cE8d1f75c686112e8f29c5` |
| TimeBeforeArbiter | `0x68A6e6022ab9984Ee1A9A6cee384FF2aE8be5264` |
| TimeEqualArbiter | `0x208385Fb349c01af2CfA8C6b86F633F6642718e2` |
| ExpirationTimeAfterArbiter | `0x309509db364526C7aE202eA9ED94a398a0819d38` |
| ExpirationTimeBeforeArbiter | `0xFAf8a07709dB9f90d0A0415876CfE00D904cd40B` |
| ExpirationTimeEqualArbiter | `0x7c782ac7741BB78DB7491Ee222af0a04f7f2bc0b` |

### Ethereum Mainnet

| Contract | Address |
|----------|---------|
| EAS | `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587` |
| EAS Schema Registry | `0xA7b39296258348C78294F95B872b282326A97BDF` |
| ERC20EscrowObligation | `0xB2c808911E84E80156101983897Da7c80e13cB47` |
| ERC20PaymentObligation | `0xb822aA07F55a8B75Ee133ede1f21C4E49DE7952f` |
| ERC721EscrowObligation | `0x2A7df117e45D93d34a7893CC3aE8B105Ae0B561C` |
| ERC721PaymentObligation | `0x59A9c929778Ad2cC4D5DB6151bDEf0F9Fa7A068C` |
| ERC1155EscrowObligation | `0xf04d9CA943f57353A3A735494E503280C1cD5e77` |
| ERC1155PaymentObligation | `0x52748DD0E39eD6eA9f626179b5eb512302adA7D9` |
| NativeTokenEscrowObligation | `0x9bA50DB048d1E5db034377abf97F92496D027C71` |
| NativeTokenPaymentObligation | `0xf60db64506E366a0A6c1f4cF9D849Adc7bB886D6` |
| TokenBundleEscrowObligation | `0x677Aa9e1CD9D05f57FbCa2327155EA7479ec7Ac3` |
| TokenBundlePaymentObligation | `0x36Fcf1Ddee838a94B1358285A11e8bbbb90eD9A1` |
| AttestationEscrowObligation | `0x6eb7792D821f32914Be75901F1b4269B13Efad2e` |
| AttestationReferenceEscrowObligation | `0x1A7c6F951e0a33F4910dbe56a200Eb413AEca17b` |
| AtomicAttestationUtils | `0x0000000000000000000000000000000000000000` |
| StringObligation | `0xC51C938f5497be8157DAf8CCc3Eb11Afb8b752C0` |
| CommitRevealObligation | `0x05d9Aa2A6AE38619b864Ff7f87A8f94301ecAB42` |
| TrivialArbiter | `0x594E79466b6ac01C6416C929e428264a4bdF0C92` |
| TrustedOracleArbiter | `0x3B2a812E3eb3B729D40d866Da16c2BB2b6cDd2f2` |
| AllArbiter | `0x847F69d27E4F1A8a115aCa3F4358B079706dc9CE` |
| AnyArbiter | `0xe968dFA581B8aBb94eC5F24d0b56163DE69511fD` |
| IntrinsicsArbiter | `0xaabdDAa76651d20922d1F561f924a40F6fE7710c` |
| ERC8004Arbiter | `0xBE7fE4d7CEb2140eeBdf01e12D198AEBAdC1F54D` |
| ExclusiveRevocableConfirmationArbiter | `0x941044D43F9d75dfA8Ad24880B9B9cAD6e116a66` |
| ExclusiveUnrevocableConfirmationArbiter | `0x16aeE626D398B547eDD5fa4BdAA638524C92921d` |
| NonexclusiveRevocableConfirmationArbiter | `0xe483EDA58b5f9Eba06A1ad0151dA5e4a5fFC8300` |
| NonexclusiveUnrevocableConfirmationArbiter | `0x01666d869918aDDDED1B30eF2d36f3C990F09BDE` |
| RecipientArbiter | `0xF1C9E20078A13816ACdDF3153e2eAaDd93Fd6E57` |
| AttesterArbiter | `0x6CC4068d471E96A1669097918e18017f5764f72a` |
| SchemaArbiter | `0x913eAdD13dcCdeD9CD5518075083b6C7A9574A8c` |
| UidArbiter | `0xae4fa2D5d7EDD6Aaf697dC0c98EDb921F0fEc058` |
| RefUidArbiter | `0xE9ee2c57B18283b66d342D33d63C55f1427f9e9B` |
| RevocableArbiter | `0xeda25079f76ef93c54cC042116Be8D88E49D3439` |
| TimeAfterArbiter | `0x0ea9e144FfDc6456E5cE8d1f75c686112e8f29c5` |
| TimeBeforeArbiter | `0x68A6e6022ab9984Ee1A9A6cee384FF2aE8be5264` |
| TimeEqualArbiter | `0x208385Fb349c01af2CfA8C6b86F633F6642718e2` |
| ExpirationTimeAfterArbiter | `0x309509db364526C7aE202eA9ED94a398a0819d38` |
| ExpirationTimeBeforeArbiter | `0xFAf8a07709dB9f90d0A0415876CfE00D904cd40B` |
| ExpirationTimeEqualArbiter | `0x7c782ac7741BB78DB7491Ee222af0a04f7f2bc0b` |
