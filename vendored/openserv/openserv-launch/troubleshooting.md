# OpenServ Launch API Troubleshooting

Common issues and solutions when launching tokens.

---

## Validation Errors

### "Token name is required" or "Token symbol is required"

**Problem:** Missing required fields in the request body.

**Solution:**

- Include both `name` and `symbol` in your request
- Ensure the Content-Type header is set to `application/json`
- Verify the JSON is valid (no trailing commas, properly quoted strings)

### "Token symbol must contain only letters and numbers"

**Problem:** Symbol contains invalid characters.

**Solution:**

- Use only A-Z and 0-9 in the symbol
- The API will automatically uppercase the symbol
- No spaces, hyphens, or special characters allowed

### "Invalid Ethereum address format"

**Problem:** The `wallet` field is not a valid Ethereum address.

**Solution:**

- Use a full 42-character address starting with `0x`
- Ensure all characters are valid hexadecimal (0-9, a-f, A-F)
- Verify the address using viem's `isAddress()`

### "Image URL must be a direct link to an image file"

**Problem:** The `imageUrl` doesn't point to an actual image file.

**Solution:**

- Use a direct URL ending with an image extension: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.avif`, `.bmp`, `.ico`
- Query parameters after the extension are allowed (e.g., `logo.png?v=1`)
- Don't use URLs to web pages that display images (e.g., Imgur gallery pages)

### "Invalid Twitter handle format"

**Problem:** Twitter handle doesn't match expected format.

**Solution:**

- Use 1-15 alphanumeric characters or underscores
- The `@` prefix is optional (both `@mytoken` and `mytoken` work)
- No spaces or special characters

---

## Rate Limiting

### "Daily launch limit reached (1 per day)"

**Problem:** The creator wallet has already launched a token in the past 24 hours.

**Solution:**

- Wait 24 hours from the previous launch
- Use a different creator wallet address
- This limit is per wallet, not per IP or API key

### Creator wallet validation failed

**Problem:** The wallet address doesn't have sufficient on-chain activity.

**Solution:**

- Ensure the wallet has made at least one transaction on Base
- The wallet should have some ETH balance or transaction history
- This is a spam prevention measure

---

## Transaction Failures

### "Transaction failed" or timeout errors

**Problem:** Blockchain transaction didn't complete successfully.

**Solution:**

1. Check Base network status for congestion
2. Retry the request (the API is idempotent for failed launches)
3. Verify the API's deployer wallet has sufficient ETH for gas

### "Insufficient funds" error

**Problem:** The API's deployer wallet doesn't have enough ETH.

**Solution:**

- This is a server-side issue; contact the API operator
- The deployer needs ~0.01 ETH for a typical launch

---

## Response Parsing

### Missing fields in response

**Problem:** Expected fields are missing from the API response.

**Solution:**

- Optional fields (`description`, `imageUrl`, `website`, `twitter`) only appear if provided
- Check the `success` field first to confirm the launch succeeded
- On error, look for the `error` field instead of normal response fields

### Invalid JSON response

**Problem:** Response is not valid JSON.

**Solution:**

- Check the response status code (2xx for success, 4xx/5xx for errors)
- Verify you're hitting the correct endpoint
- Check for network issues or proxy interference

---

## Common Mistakes

### Missing Content-Type header

**Problem:** Request fails with unexpected errors.

**Solution:**

```bash
# Always include Content-Type for POST requests
curl -X POST "https://instant-launch.openserv.ai/api/launch" \
  -H "Content-Type: application/json" \
  -d '{"name": "...", ...}'
```

### Sending form data instead of JSON

**Problem:** API returns validation errors for all fields.

**Solution:**

- Send JSON body, not form data
- Use `JSON.stringify()` in JavaScript
- Set `Content-Type: application/json`

### Using testnet addresses

**Problem:** Token launches but isn't visible on Base mainnet.

**Solution:**

- The API only operates on Base Mainnet (chainId: 8453)
- Use mainnet wallet addresses
- All links in the response point to mainnet explorers

---

## Debugging Tips

1. **Check the response body** - Error messages are descriptive and include the specific validation issue

2. **Validate locally first** - Test your request data with a JSON validator and address checker before sending

3. **Verify on Basescan** - After a successful launch, use the explorer link to confirm the token exists

4. **Test with minimal data** - Start with just `name`, `symbol`, and `wallet` before adding optional fields

---

## Example Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed: symbol: Token symbol must be 10 characters or less"
}
```

### Rate Limit (400)

```json
{
  "success": false,
  "error": "Daily launch limit reached (1 per day)"
}
```

### Server Error (500)

```json
{
  "success": false,
  "error": "Transaction failed: insufficient funds for gas"
}
```
