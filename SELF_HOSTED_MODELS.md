# Setting Up Self-Hosted Models with LibreChat

## Option 1: Ollama with ROCm (AMD GPU Support)

### Using Docker Compose (Recommended)

Your `docker-compose.yml` already includes Ollama with ROCm support for AMD GPUs:

```bash
# Start Ollama ROCm container
docker-compose up -d ollama

# Pull the recommended model (qwen3:8b works best with Marketplace Search tool)
docker exec -it ollama_rocm ollama pull qwen3:8b

# List installed models
docker exec -it ollama_rocm ollama list
```

### Supported Models

```bash
# Recommended for Marketplace Search Agent
docker exec -it ollama_rocm ollama pull qwen3:8b  # Best tool calling support

# Other models (not tested with Marketplace tool)
docker exec -it ollama_rocm ollama pull llama3.2:3b
docker exec -it ollama_rocm ollama pull phi3:latest
```

**Note**: Only `qwen3:8b` has been verified to work correctly with the Marketplace Search tool. Other models may not properly execute tool calls.

### Verify Ollama is Working

```bash
# Test the API
curl http://localhost:11434/v1/models

# Chat with a model
ollama run llama3.2:latest "Hello, how are you?"
```

## Option 2: LM Studio (GUI Alternative)

1. Download from: https://lmstudio.ai/
2. Install and open LM Studio
3. Browse and download models from the UI
4. Start local server on port 1234
5. Models will appear automatically in LibreChat

## Option 3: Groq (Cloud but Free)

1. Get free API key: https://console.groq.com/keys
2. Add to `.env`:
   ```bash
   GROQ_API_KEY=your_key_here
   ```
3. Ultra-fast inference with Llama models

## Using Self-Hosted Models in LibreChat

1. **Restart LibreChat** after configuration:
   ```bash
   docker-compose restart api
   ```

2. **Access LibreChat**: http://localhost:3080

3. **Select Endpoint**:
   - Click the model dropdown (top of chat)
   - Choose "Ollama", "LM Studio", or "Groq"
   - Select your preferred model

4. **Use with Agents**:
   - Create a new agent
   - Set "Provider" to your self-hosted endpoint
   - The marketplace search tool will work with your local models!

## Current Configuration

Your `librechat.yaml` is already configured with:
- ✅ Ollama ROCm on `http://ollama_rocm:11434` (AMD GPU via Docker)
- ✅ Groq (if API key provided)
- ✅ Username login enabled

## Recommended Model for Marketplace Search

| Model | Size | Purpose | Status |
|-------|------|---------|--------|
| **qwen3:8b** | ~5GB | Marketplace Search Agent | ✅ Verified Working |

**Important**: Only `qwen3:8b` has been tested and verified to correctly execute the Marketplace Search tool. Other models have shown issues with tool calling.

## Troubleshooting

### Ollama Not Connecting

1. Check Ollama container is running:
   ```bash
   docker-compose ps ollama
   ```

2. Test Ollama API:
   ```bash
   curl http://localhost:11434/v1/models
   ```

3. Check LibreChat can reach Ollama:
   ```bash
   docker-compose exec api curl http://ollama_rocm:11434/v1/models
   ```

### No Models Appearing

1. Pull the recommended model:
   ```bash
   docker exec -it ollama_rocm ollama pull qwen3:8b
   ```

2. Restart LibreChat:
   ```bash
   docker-compose restart api
   ```

3. Check LibreChat logs:
   ```bash
   docker-compose logs api | grep -i ollama
   ```

### Username Login Not Working

If you still can't log in with username:

1. Check the setting is applied:
   ```bash
   docker-compose exec api env | grep EMAIL_LOGIN
   ```

2. Clear browser cache and try again

3. Use email for now, username feature should work after restart

## Next Steps

1. **Start Ollama**: `docker-compose up -d ollama`
2. **Pull qwen3:8b**: `docker exec -it ollama_rocm ollama pull qwen3:8b`
3. **Restart LibreChat**: `docker-compose restart api`
4. **Create an Agent**: Use "Ollama ROCm" endpoint with "qwen3:8b" model
5. **Enable Marketplace Search tool**: Check the tool in agent settings
6. **Test**: Ask the agent to search for marketplace listings!

## Benefits of Self-Hosted Models

- ✅ **Privacy**: Your data never leaves your machine
- ✅ **Cost**: Free to use (only hardware costs)
- ✅ **Speed**: No API rate limits
- ✅ **Offline**: Works without internet
- ✅ **Customizable**: Fine-tune models for your needs

---

**Need help?** Check the LibreChat docs: https://www.librechat.ai/docs/configuration/librechat_yaml
