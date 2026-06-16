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
| Attestation (v1) | `AttestationEscrowObligation` | `attestation: AttestationRequest`, `arbiter: address`, `demand: bytes` |
| Attestation (v2) | `AttestationEscrowObligation2` | `attestation: AttestationRequest`, `arbiter: address`, `demand: bytes` |

### Escrow lifecycle

1. `doObligation(data, expirationTime)` — lock assets, create EAS attestation
2. Fulfiller creates fulfillment attestation with `refUID` pointing to escrow
3. `collectEscrow(escrowUid, fulfillmentUid)` — arbiter validates, releases assets
4. `reclaimExpired(uid)` — reclaim assets after expiration (buyer only)

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

- `commit(commitment)` — submit hash commitment with ETH bond
- `doObligation(data, refUID)` — reveal fulfillment data
- `computeCommitment(refUID, claimer, data)` — compute expected commitment hash
- `reclaimBond(obligationUid)` — reclaim bond after valid reveal
- `slashBond(commitment)` — slash bond if reveal deadline passes
- Commitment hash: `keccak256(abi.encode(refUID, claimer, keccak256(abi.encode(obligationData))))`
- Built-in `IArbiter` implementation verifies commitment exists in an earlier block

## Barter Utilities

Barter utils combine escrow + payment into atomic single-transaction swaps.

| Contract | Supported swaps |
|----------|----------------|
| `ERC20BarterUtils` | ERC20↔ERC20, ERC20↔ERC721, ERC20↔ERC1155, ERC20↔Bundle, ERC20↔ETH (with permit support) |
| `NativeTokenBarterUtils` | ETH↔ERC20, ETH↔ERC721, ETH↔ERC1155, ETH↔Bundle, ETH↔ETH |
| `TokenBundleBarterUtils` | Bundle↔Bundle (with multi-permit support) |

## Contract Addresses

### Base Sepolia

| Contract | Address |
|----------|---------|
| EAS | `0x4200000000000000000000000000000000000021` |
| EAS Schema Registry | `0x4200000000000000000000000000000000000020` |
| **ERC20** | |
| ERC20EscrowObligation | `0x1Fe964348Ec42D9Bb1A072503ce8b4744266FF43` |
| ERC20PaymentObligation | `0x8d13d7542E64D9Da29AB66B6E9b4a6583C64b3F6` |
| ERC20BarterUtils | `0x946Ef4E912897B4A24b9250513dfeE3fc4303Dde` |
| **ERC721** | |
| ERC721EscrowObligation | `0x7675a56b2880EF059cFC725E715E1139D689c07B` |
| ERC721PaymentObligation | `0x9Daf829f183cA46ad2146F489E7d14335C9B59a9` |
| ERC721BarterUtils | `0x707f280Fa738b4cc175A369d450f2f603094cbAf` |
| **ERC1155** | |
| ERC1155EscrowObligation | `0xB8A3107DA5428a34f818ea4229233fBAe59C16F2` |
| ERC1155PaymentObligation | `0x6f71429bD940Bf3345780a8E5F5cf3BcdffE80C1` |
| ERC1155BarterUtils | `0x4E4F0F883B1fEC20F219E0c8D2ec0061FE3c1328` |
| **Native Token** | |
| NativeTokenEscrowObligation | `0x8a1172D32B8cEf14094cF1E7d6F3d1A36D949FDe` |
| NativeTokenPaymentObligation | `0xAB1E9714fbD4f9B5546e891B7Ba392b08c44c37A` |
| NativeTokenBarterUtils | `0xaaB70Cfc37C5E73e185E2976609A82Ba22A4310d` |
| **Token Bundle** | |
| TokenBundleEscrowObligation | `0x38e8E5684aFB24A88cD9B276032bCBD19C4b9d6e` |
| TokenBundlePaymentObligation | `0xFa5446475De31fa3c6457E2b62EA5a8F8172Cd29` |
| TokenBundleBarterUtils | `0x47C033F49D5A1559AC48f27571204a29b8E728b8` |
| **Attestation** | |
| AttestationEscrowObligation | `0x9D133Cbd51270a2A410465F82dAFFD6c1C87322D` |
| AttestationEscrowObligation2 | `0xa076e9ca47f192E6AfB67817608E382074CF0Dcf` |
| AttestationBarterUtils | `0x84D390BCd90d5f65D14ff66f6860DCa45e776666` |
| **Fulfillment** | |
| StringObligation | `0x544873C22A3228798F91a71C4ef7a9bFe96E7CE0` |
| CommitRevealObligation | `0x447b11ce03237f0C674eF7F16c913c3B2e8ef494` |
| **Arbiters** | |
| TrivialArbiter | `0x50EDa6c29C740bfbA6875422287025D985b96b7b` |
| TrustedOracleArbiter | `0x3664b11BcCCeCA27C21BBAB43548961eD14d4D6D` |
| AllArbiter | `0x0D95c1Cd62cd9C7cCCB237a3Ae08aA61Ed83381f` |
| AnyArbiter | `0xaaC3465f340C7A2841A120F81Ce6744cda00d263` |
| IntrinsicsArbiter | `0x24aAFec3f86CAd330600dD2397DEB8498D44bfd9` |
| IntrinsicsArbiter2 | `0x51a28Ad45BE6eb6fd6D76af56a7D62ECd99547C7` |
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
| ERC20BarterUtils | `0x5bf7c8b0d60d05af0a3De531EB876De271E80dbc` |
| ERC721EscrowObligation | `0x2A7df117e45D93d34a7893CC3aE8B105Ae0B561C` |
| ERC721PaymentObligation | `0x59A9c929778Ad2cC4D5DB6151bDEf0F9Fa7A068C` |
| ERC721BarterUtils | `0xEB0C0c41F708B8b3556a6F44a1a015a6832C2d2C` |
| ERC1155EscrowObligation | `0xf04d9CA943f57353A3A735494E503280C1cD5e77` |
| ERC1155PaymentObligation | `0x52748DD0E39eD6eA9f626179b5eb512302adA7D9` |
| ERC1155BarterUtils | `0x52De4B30721b3E3660A79da7491a9B2F8a9cB1D5` |
| NativeTokenEscrowObligation | `0x9bA50DB048d1E5db034377abf97F92496D027C71` |
| NativeTokenPaymentObligation | `0xf60db64506E366a0A6c1f4cF9D849Adc7bB886D6` |
| NativeTokenBarterUtils | `0xA42032D8BFeE2302cC6F80ff51D283Ffc5a4081f` |
| TokenBundleEscrowObligation | `0x677Aa9e1CD9D05f57FbCa2327155EA7479ec7Ac3` |
| TokenBundlePaymentObligation | `0x36Fcf1Ddee838a94B1358285A11e8bbbb90eD9A1` |
| TokenBundleBarterUtils | `0xA7EacA68Bffc9443eA08fd58633Eeed3f5EE8A92` |
| AttestationEscrowObligation | `0x6eb7792D821f32914Be75901F1b4269B13Efad2e` |
| AttestationEscrowObligation2 | `0x1A7c6F951e0a33F4910dbe56a200Eb413AEca17b` |
| AttestationBarterUtils | `0x5E6602F080E9B37267aa52306c699ae54Cd71056` |
| StringObligation | `0xC51C938f5497be8157DAf8CCc3Eb11Afb8b752C0` |
| CommitRevealObligation | `0x9fD6D7A3B4e4b5dD75c50F5f16Deba46162127C3` |
| TrivialArbiter | `0x594E79466b6ac01C6416C929e428264a4bdF0C92` |
| TrustedOracleArbiter | `0x3B2a812E3eb3B729D40d866Da16c2BB2b6cDd2f2` |
| AllArbiter | `0x847F69d27E4F1A8a115aCa3F4358B079706dc9CE` |
| AnyArbiter | `0xe968dFA581B8aBb94eC5F24d0b56163DE69511fD` |
| IntrinsicsArbiter | `0xaabdDAa76651d20922d1F561f924a40F6fE7710c` |
| IntrinsicsArbiter2 | `0xF486f9a62eeb085e99828e1D706bBA5dfC1bD1fD` |
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

### Filecoin Calibration

| Contract | Address |
|----------|---------|
| EAS | `0x3c79a0225380fB6F3CB990FfC4E3D5aF4546b524` |
| EAS Schema Registry | `0x2BB94a4E6eC0D81dE7f81007b572Ac09A5BE37b4` |
| ERC20EscrowObligation | `0x6bcec91a89a63d50368bce54cb9ed0399992c18b` |
| ERC20PaymentObligation | `0x33f6f558c1fcac597f2b635bc50554055ff98165` |
| ERC20BarterUtils | `0xb5800e34602154ce92c5eb0e7cb455306d7d590e` |
| ERC721EscrowObligation | `0x99f5335b95e1c0be4c218a59aae26efc50d5673f` |
| ERC721PaymentObligation | `0x5b6bff4dc108c58b97721330666f56c8028c097c` |
| ERC721BarterUtils | `0x797a737defb8cae0a30324ecfa52eaab9c0a5fd6` |
| ERC1155EscrowObligation | `0xf9dbc74553faecac775201113198085c4d572805` |
| ERC1155PaymentObligation | `0x4cb076af47f0f3909ebafd88cbc0c4cc8dee17dd` |
| ERC1155BarterUtils | `0x850d8df3ff0149bd5a9191a958b287b25564716b` |
| NativeTokenEscrowObligation | `0x7490102a8b821c70679508426823f26c9bab4714` |
| NativeTokenPaymentObligation | `0xd511278d5b9e5f8f9b99d01ea326b8232c133be5` |
| NativeTokenBarterUtils | `0x3c07027874650794eae300c603f066af182ea86a` |
| TokenBundleEscrowObligation | `0x902ac1997bd29a037263e0d80952c80d69d9afd4` |
| TokenBundlePaymentObligation | `0xc1b02efec19a171ecbb7c8ad54b9617e80fdf40f` |
| TokenBundleBarterUtils | `0xfca2c2df4023a0a418bf354b5bfff1ebfe0520a9` |
| AttestationEscrowObligation | `0xd59c6c6cb025e76a0a1e706c62a9df38b04694e2` |
| AttestationEscrowObligation2 | `0xa22b4d9fe7a746d44be1e724bb1a26593bca2c1b` |
| AttestationBarterUtils | `0xcda1e1ea425e31a789feffc8e3d90f839ff49c9f` |
| StringObligation | `0x66c3f78258823b9b899ab14b11e1dcf978c060d7` |
| CommitRevealObligation | `0x32889Ee549d61Ed5D14f2D499fCc809a4feC0dD8` |
| TrivialArbiter | `0xd56bd862e7bebd0bd7356603e9e52b32c241e2ae` |
| TrustedOracleArbiter | `0x61dc9c2d757a1c9d0d38a281288d9ef918e77baa` |
| AllArbiter | `0x49026902790a8ecb427f335ca0d097c7c5795d13` |
| AnyArbiter | `0xb6890a8cb8cdefce11edc0314125b750f48bff1b` |
| IntrinsicsArbiter | `0x81dc8f2c5677b02afcafef34fa7e75d55dfaef20` |
| IntrinsicsArbiter2 | `0x7b20a4b25af2a2637c240622d6c3875dea609a64` |
| ERC8004Arbiter | `0x3c1E21911C609714dBc0Ab90800c7aD8817B8e83` |
| ExclusiveRevocableConfirmationArbiter | `0xa740634e718c8727853d1e69963303d5cb8ea44c` |
| ExclusiveUnrevocableConfirmationArbiter | `0xb3d71c6f96cdd41e56dd9870b232225c379f2890` |
| NonexclusiveRevocableConfirmationArbiter | `0x831b40ae79d391c7d56209802b9745fe0743dbf5` |
| NonexclusiveUnrevocableConfirmationArbiter | `0xfeaa2fa295d1453ba382b7ee0e3f66c489a6d9bb` |
| RecipientArbiter | `0xe0d55949e6e1590f26ef37a1d01df52fbb1b2fce` |
| AttesterArbiter | `0xe571d48d05962c57c95e48b8a7375466d1d02487` |
| SchemaArbiter | `0x9d5817ff5519f45bf8ed6c3ada638b874dbcb540` |
| UidArbiter | `0xaa9aef96068f2be679ae8781a4fc33ff4798758f` |
| RefUidArbiter | `0x546526311e6639399fdc583df84eee8b123d79d5` |
| RevocableArbiter | `0xe8d45cf2471882730a7e0ac142966df07ae148d4` |
| TimeAfterArbiter | `0x2725a6869b42edfd155889098408ccb3b1ed060e` |
| TimeBeforeArbiter | `0x014aa3dc53004b50bc13aa1d85a83bcca5c0671a` |
| TimeEqualArbiter | `0x1c21a8fb4f69adb0ccdd22d8c125f8689bf227af` |
| ExpirationTimeAfterArbiter | `0xbd90af50fb667724338eb8da541f923f1822ac3c` |
| ExpirationTimeBeforeArbiter | `0xbcce130337f2d8029982a14471d8686afcef20ff` |
| ExpirationTimeEqualArbiter | `0x98d5bc7593143e55e9949da97603126cae0bfd7f` |

### Ethereum Mainnet

| Contract | Address |
|----------|---------|
| EAS | `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587` |
| EAS Schema Registry | `0xA7b39296258348C78294F95B872b282326A97BDF` |
| ERC20EscrowObligation | `0xB2c808911E84E80156101983897Da7c80e13cB47` |
| ERC20PaymentObligation | `0xb822aA07F55a8B75Ee133ede1f21C4E49DE7952f` |
| ERC20BarterUtils | `0x5bf7c8b0d60d05af0a3De531EB876De271E80dbc` |
| ERC721EscrowObligation | `0x2A7df117e45D93d34a7893CC3aE8B105Ae0B561C` |
| ERC721PaymentObligation | `0x59A9c929778Ad2cC4D5DB6151bDEf0F9Fa7A068C` |
| ERC721BarterUtils | `0xEB0C0c41F708B8b3556a6F44a1a015a6832C2d2C` |
| ERC1155EscrowObligation | `0xf04d9CA943f57353A3A735494E503280C1cD5e77` |
| ERC1155PaymentObligation | `0x52748DD0E39eD6eA9f626179b5eb512302adA7D9` |
| ERC1155BarterUtils | `0x52De4B30721b3E3660A79da7491a9B2F8a9cB1D5` |
| NativeTokenEscrowObligation | `0x9bA50DB048d1E5db034377abf97F92496D027C71` |
| NativeTokenPaymentObligation | `0xf60db64506E366a0A6c1f4cF9D849Adc7bB886D6` |
| NativeTokenBarterUtils | `0xA42032D8BFeE2302cC6F80ff51D283Ffc5a4081f` |
| TokenBundleEscrowObligation | `0x677Aa9e1CD9D05f57FbCa2327155EA7479ec7Ac3` |
| TokenBundlePaymentObligation | `0x36Fcf1Ddee838a94B1358285A11e8bbbb90eD9A1` |
| TokenBundleBarterUtils | `0xA7EacA68Bffc9443eA08fd58633Eeed3f5EE8A92` |
| AttestationEscrowObligation | `0x6eb7792D821f32914Be75901F1b4269B13Efad2e` |
| AttestationEscrowObligation2 | `0x1A7c6F951e0a33F4910dbe56a200Eb413AEca17b` |
| AttestationBarterUtils | `0x5E6602F080E9B37267aa52306c699ae54Cd71056` |
| StringObligation | `0xC51C938f5497be8157DAf8CCc3Eb11Afb8b752C0` |
| CommitRevealObligation | `0x05d9Aa2A6AE38619b864Ff7f87A8f94301ecAB42` |
| TrivialArbiter | `0x594E79466b6ac01C6416C929e428264a4bdF0C92` |
| TrustedOracleArbiter | `0x3B2a812E3eb3B729D40d866Da16c2BB2b6cDd2f2` |
| AllArbiter | `0x847F69d27E4F1A8a115aCa3F4358B079706dc9CE` |
| AnyArbiter | `0xe968dFA581B8aBb94eC5F24d0b56163DE69511fD` |
| IntrinsicsArbiter | `0xaabdDAa76651d20922d1F561f924a40F6fE7710c` |
| IntrinsicsArbiter2 | `0xF486f9a62eeb085e99828e1D706bBA5dfC1bD1fD` |
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
