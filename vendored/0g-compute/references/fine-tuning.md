# Fine-tuning Reference

Complete guide for fine-tuning AI models on 0G's distributed GPU network.

**Important:** Fine-tuning is available on both **mainnet** and **testnet**. Mainnet provider: `0x940b4a101CaBa9be04b16A7363cafa29C1660B0d` (models: Qwen2.5-0.5B-Instruct, Qwen3-32B).

## Complete Workflow

### 1. List Available Providers

```bash
0g-compute-cli fine-tuning list-providers
```

Output example:

```
┌──────────────────────────────────────────────────┬──────────────────────────────────────────────────┐
│ Provider 1                                       │ 0xf07240Efa67755B5311bc75784a061eDB47165Dd       │
├──────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Available                                        │ ✓                                                │
├──────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ Price Per Byte in Dataset (0G)                   │ 0.000000000000000001                             │
└──────────────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

**Field Descriptions:**

- **Provider**: Provider address. Official provider: `0xf07240Efa67755B5311bc75784a061eDB47165Dd`
- **Available**: `✓` = available, `✗` = occupied
- **Price Per Byte**: Service fee based on dataset byte count

### 2. List Available Models

```bash
0g-compute-cli fine-tuning list-models
```

**Available Models:**

#### Predefined Models

System-provided models available across all providers:

| Model Name                   | Type                  | Description                                                                                                                                                |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `distilbert-base-uncased`    | Text Classification   | DistilBERT is a smaller, faster version of BERT. [More info](https://huggingface.co/distilbert/distilbert-base-uncased)                                   |
| `Qwen2.5-0.5B-Instruct`     | Instruction-tuned LLM | Qwen 2.5 0.5B parameter instruction-tuned model. Available on mainnet. [More info](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct)                   |
| `Qwen3-32B`                 | Large LLM             | Qwen 3 32B parameter model. Available on mainnet. [More info](https://huggingface.co/Qwen/Qwen3-32B)                                                     |

#### Provider's Models

Custom models offered by external providers. Availability and quality may vary by provider.

### 3. Get Model Usage Template (Optional)

For custom models from third-party providers:

```bash
0g-compute-cli fine-tuning model-usage \
  --provider <PROVIDER_ADDRESS> \
  --model <MODEL_NAME> \
  --output <PATH_TO_SAVE_TEMPLATE>
```

This downloads:

- Dataset construction guidelines
- Training configuration template
- Usage instructions

### 4. Prepare Configuration File

Download parameter templates from the [releases page](https://github.com/0gfoundation/0g-serving-broker/releases) and modify according to your needs.

Configuration file typically includes:

- Learning rate
- Batch size
- Number of epochs
- Training parameters specific to the model

### 5. Prepare Your Dataset

Download dataset format specifications and verification scripts from the [releases page](https://github.com/0gfoundation/0g-serving-broker/releases).

Ensure your dataset complies with requirements:

- Correct file format
- Proper data structure
- Valid encoding

### 6. Upload Dataset to 0G Storage

```bash
0g-compute-cli fine-tuning upload --data-path <PATH_TO_DATASET>
```

Output:

```
Root hash: 0xabc123...
```

**Important:** Save this root hash! You'll need it for creating the task.

### 7. Calculate Dataset Size

```bash
0g-compute-cli fine-tuning calculate-token \
  --model <MODEL_NAME> \
  --dataset-path <PATH_TO_DATASET> \
  --provider <PROVIDER_ADDRESS>
```

This calculates the size for cost estimation.

### 8. Transfer Funds to Provider

```bash
0g-compute-cli transfer-fund \
  --provider <PROVIDER_ADDRESS> \
  --amount 1
```

Ensure you have sufficient funds for the fine-tuning task.

### 9. Create Fine-tuning Task

```bash
0g-compute-cli fine-tuning create-task \
  --provider <PROVIDER_ADDRESS> \
  --model <MODEL_NAME> \
  --dataset <DATASET_ROOT_HASH> \
  --config-path <PATH_TO_CONFIG_FILE> \
  --data-size <DATASET_SIZE>
```

**Parameters:**

| Parameter        | Description                             | Required |
| ---------------- | --------------------------------------- | -------- |
| `--provider`     | Address of the service provider         | Yes      |
| `--model`        | Name of the pretrained model            | Yes      |
| `--dataset`      | Root hash from upload step              | Yes      |
| `--config-path`  | Path to configuration file              | Yes      |
| `--data-size`    | Dataset size from calculate step        | Yes      |
| `--gas-price`    | Gas price override                      | No       |

Output:

```
Verify provider...
Provider verified
Creating task...
Created Task ID: 6b607314-88b0-4fef-91e7-43227a54de57
```

**Important:** When creating a task for the same provider, you must wait for the previous task to be completed (`Finished` status) before creating a new task. If provider is busy, you'll be prompted to queue or cancel.

### 10. Monitor Task Progress

```bash
0g-compute-cli fine-tuning get-task \
  --provider <PROVIDER_ADDRESS> \
  --task <TASK_ID>
```

Output example:

```
┌───────────────────────────────────┬─────────────────────────────────────────────────────┐
│ Field                             │ Value                                               │
├───────────────────────────────────┼─────────────────────────────────────────────────────┤
│ ID                                │ beb6f0d8-4660-4c62-988d-00246ce913d2                │
├───────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Created At                        │ 2025-03-11T01:20:07.644Z                            │
├───────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Pre-trained Model Hash            │ 0xcb42b5ca9e998c82dd239ef2d20d22a4ae16b3dc...       │
├───────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Dataset Hash                      │ 0xaae9b4e031e06f84b20f10ec629f36c57719ea51...       │
├───────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Training Params                   │ {...}                                               │
├───────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Fee (neuron)                      │ 179668154                                           │
├───────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Progress                          │ Training                                            │
└───────────────────────────────────┴─────────────────────────────────────────────────────┘
```

### 11. View Training Logs

```bash
0g-compute-cli fine-tuning get-log \
  --provider <PROVIDER_ADDRESS> \
  --task <TASK_ID>
```

Output example:

```
creating task....
Step: 0, Logs: {'loss': 0.5, 'accuracy': 0.85}
Step: 1, Logs: {'loss': 0.4, 'accuracy': 0.88}
...
Training model for task beb6f0d8-4660-4c62-988d-00246ce913d2 completed successfully
```

### 12. Acknowledge and Download Model

When task status becomes `Delivered`:

```bash
0g-compute-cli fine-tuning acknowledge-model \
  --provider <PROVIDER_ADDRESS> \
  --task-id <TASK_ID> \
  --data-path <PATH_TO_SAVE_ENCRYPTED_MODEL>
```

This:

- Downloads the encrypted model from storage
- Updates contract to confirm download
- Enables provider to proceed with fee settlement

**Note:** The downloaded model is encrypted and requires decryption.

### 13. Decrypt Model

When task status becomes `Finished`:

```bash
0g-compute-cli fine-tuning decrypt-model \
  --provider <PROVIDER_ADDRESS> \
  --task-id <TASK_ID> \
  --encrypted-model <PATH_TO_ENCRYPTED_MODEL> \
  --output <PATH_TO_DECRYPTED_MODEL.zip>
```

This:

- Retrieves the encrypted key from contract
- Decrypts the key using your private key
- Decrypts the model with the decrypted key

**Important:** Ensure output path ends with `.zip` (e.g., `model_output.zip`). Unzip after downloading to access the decrypted model.

### 14. Unzip Decrypted Model

```bash
unzip <PATH_TO_DECRYPTED_MODEL.zip> -d <OUTPUT_DIRECTORY>
```

## Task Status Lifecycle

| Status              | Description                                        |
| ------------------- | -------------------------------------------------- |
| `Init`              | Task submitted to provider                         |
| `SettingUp`         | Provider preparing environment                     |
| `SetUp`             | Environment ready, about to start training         |
| `Training`          | Model training in progress                         |
| `Trained`           | Training completed successfully                    |
| `Delivering`        | Provider uploading result to storage               |
| `Delivered`         | Result uploaded (ready to acknowledge)             |
| `UserAcknowledged`  | User confirmed download                            |
| `Finished`          | Task complete (key available for decryption)       |
| `Failed`            | Task failed                                        |

## Additional Commands

### List Your Tasks

```bash
0g-compute-cli fine-tuning list-tasks --provider <PROVIDER_ADDRESS>
```

Shows all tasks you've submitted to a specific provider.

### Download Dataset

Download previously uploaded datasets:

```bash
0g-compute-cli fine-tuning download \
  --data-path <PATH_TO_SAVE> \
  --data-root <DATASET_ROOT_HASH>
```

### Cancel Task

Cancel a task before it starts running:

```bash
0g-compute-cli fine-tuning cancel-task \
  --provider <PROVIDER_ADDRESS> \
  --task <TASK_ID>
```

**Note:** Only pending tasks can be canceled. Tasks already in progress or completed cannot be canceled.

## Cost Estimation

### Pricing Model

Fine-tuning costs are based on:

- Dataset size (bytes)
- Provider's price per byte
- Current fee: typically `0.000000000000000001 0G` per byte

### Calculate Costs

```bash
# 1. Get provider pricing
0g-compute-cli fine-tuning list-providers

# 2. Calculate dataset size
0g-compute-cli fine-tuning calculate-token \
  --model <MODEL_NAME> \
  --dataset-path <PATH_TO_DATASET> \
  --provider <PROVIDER_ADDRESS>

# 3. Estimate cost: dataset_size * price_per_byte
```

## Best Practices

### Before Starting

1. **Verify provider availability** before uploading large datasets
2. **Test with small datasets first** to validate configuration
3. **Check account balance** and transfer sufficient funds
4. **Save all root hashes** from uploads
5. **Keep configuration files** for reproducibility

### During Training

1. **Monitor logs regularly** to catch issues early
2. **Check task status** periodically
3. **Don't create duplicate tasks** while one is running

### After Completion

1. **Download models promptly** after `Delivered` status
2. **Store decryption keys securely**
3. **Keep encrypted backups** before decryption
4. **Verify model quality** after decryption

## Troubleshooting

### Provider Busy

```
Error: Provider is currently processing another task
```

**Solutions:**

- Wait and retry later
- Use different provider: `0g-compute-cli fine-tuning list-providers`
- Queue your task (prompted automatically)

### Insufficient Balance

```
Error: Insufficient balance in sub-account
```

**Solutions:**

```bash
# Check balance
0g-compute-cli get-account

# Deposit more funds
0g-compute-cli deposit --amount 5

# Transfer to provider
0g-compute-cli transfer-fund --provider <PROVIDER_ADDRESS> --amount 2
```

### Invalid Dataset Format

```
Error: Dataset validation failed
```

**Solutions:**

- Download verification script from releases
- Check dataset structure matches requirements
- Verify file encoding (usually UTF-8)
- Ensure proper JSON/CSV formatting

### Task Failed

```
Progress: Failed
```

**Solutions:**

- Check logs: `0g-compute-cli fine-tuning get-log --provider <PROVIDER_ADDRESS> --task <TASK_ID>`
- Common issues:
  - Invalid configuration parameters
  - Dataset format mismatch
  - Insufficient GPU memory (reduce batch size)
  - Corrupted dataset upload

### Download Issues

```
Error: Failed to download model
```

**Solutions:**

- Verify task status is `Delivered`
- Check network connection
- Ensure sufficient disk space
- Retry download command

### Decryption Issues

```
Error: Failed to decrypt model
```

**Solutions:**

- Verify task status is `Finished`
- Ensure you're using the correct private key
- Check encrypted model file integrity
- Verify output path ends with `.zip`

## Security Considerations

### Private Key Safety

- **Never share** your private key
- **Use environment variables** for private keys
- **Don't commit** keys to version control
- **Use hardware wallets** for production

### Dataset Security

- **Review data** before uploading to ensure no sensitive information
- **Encrypt sensitive datasets** before upload
- **Use testnet first** for experimental data
- **Keep backups** of original datasets

### Model Security

- **Verify provider** TEE attestation before use
- **Keep encrypted backups** of fine-tuned models
- **Test models** before production deployment
- **Monitor usage** of deployed models

## Example: Complete Fine-tuning Session

```bash
# Setup
0g-compute-cli setup-network  # Choose testnet
0g-compute-cli login

# Check balance and deposit
0g-compute-cli get-account
0g-compute-cli deposit --amount 3

# Find provider
0g-compute-cli fine-tuning list-providers
# Use: 0xf07240Efa67755B5311bc75784a061eDB47165Dd

# Upload dataset
0g-compute-cli fine-tuning upload --data-path ./my_dataset.json
# Save root hash: 0xabc123...

# Calculate size
0g-compute-cli fine-tuning calculate-token \
  --model distilbert-base-uncased \
  --dataset-path ./my_dataset.json \
  --provider 0xf07240Efa67755B5311bc75784a061eDB47165Dd

# Transfer funds
0g-compute-cli transfer-fund \
  --provider 0xf07240Efa67755B5311bc75784a061eDB47165Dd \
  --amount 1

# Create task
0g-compute-cli fine-tuning create-task \
  --provider 0xf07240Efa67755B5311bc75784a061eDB47165Dd \
  --model distilbert-base-uncased \
  --dataset 0xabc123... \
  --config-path ./config.json \
  --data-size 1000000
# Task ID: 6b607314-88b0-4fef-91e7-43227a54de57

# Monitor progress
watch -n 30 '0g-compute-cli fine-tuning get-task \
  --provider 0xf07240Efa67755B5311bc75784a061eDB47165Dd \
  --task 6b607314-88b0-4fef-91e7-43227a54de57'

# View logs
0g-compute-cli fine-tuning get-log \
  --provider 0xf07240Efa67755B5311bc75784a061eDB47165Dd \
  --task 6b607314-88b0-4fef-91e7-43227a54de57

# Download when Delivered
0g-compute-cli fine-tuning acknowledge-model \
  --provider 0xf07240Efa67755B5311bc75784a061eDB47165Dd \
  --task-id 6b607314-88b0-4fef-91e7-43227a54de57 \
  --data-path ./encrypted_model.bin

# Decrypt when Finished
0g-compute-cli fine-tuning decrypt-model \
  --provider 0xf07240Efa67755B5311bc75784a061eDB47165Dd \
  --task-id 6b607314-88b0-4fef-91e7-43227a54de57 \
  --encrypted-model ./encrypted_model.bin \
  --output ./my_model.zip

# Extract model
unzip ./my_model.zip -d ./my_fine_tuned_model/
```

## Resources

- **Parameter Templates**: [GitHub Releases](https://github.com/0gfoundation/0g-serving-broker/releases)
- **Dataset Specs**: [GitHub Releases](https://github.com/0gfoundation/0g-serving-broker/releases)
- **Verification Scripts**: [GitHub Releases](https://github.com/0gfoundation/0g-serving-broker/releases)
- **Support**: [Discord](https://discord.gg/0glabs)
