# Setting Up Self-Hosted Models with LibreChat

## Option 1: Ollama (Recommended - Easy & Free)

### Install Ollama

```bash
# On Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# On Windows
# Download from https://ollama.com/download
```

### Start Ollama

```bash
# Ollama runs on port 11434 by default
ollama serve
```

### Pull Models

```bash
# Recommended models (pick based on your hardware)

# Small & Fast (3-4GB RAM)
ollama pull llama3.2:3b
ollama pull phi3:latest

# Medium (8GB+ RAM)
ollama pull llama3.2:latest
ollama pull qwen2.5:latest
ollama pull mistral:latest

# Large & Powerful (16GB+ RAM)
ollama pull llama3.1:70b
ollama pull codellama:latest

# List installed models
ollama list
```

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
- ✅ Ollama on `http://host.docker.internal:11434`
- ✅ LM Studio on `http://host.docker.internal:1234`
- ✅ Groq (if API key provided)
- ✅ Username login enabled

## Recommended Models for Different Use Cases

| Use Case | Model | Size | Speed |
|----------|-------|------|-------|
| **General Chat** | llama3.2:latest | 2GB | Fast |
| **Coding** | codellama:latest | 3.8GB | Fast |
| **Reasoning** | qwen2.5:latest | 4.7GB | Medium |
| **Fast & Light** | phi3:latest | 2.3GB | Very Fast |
| **Powerful** | llama3.1:70b | 40GB | Slow |

## Troubleshooting

### Ollama Not Connecting

1. Check Ollama is running:
   ```bash
   curl http://localhost:11434/v1/models
   ```

2. If using Docker on Windows/Mac, ensure Ollama can be accessed:
   ```bash
   # Test from inside Docker
   docker-compose exec api curl http://host.docker.internal:11434/v1/models
   ```

3. On Linux, you may need to use `http://172.17.0.1:11434` instead

### No Models Appearing

1. Pull at least one model first:
   ```bash
   ollama pull llama3.2:latest
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

1. **Install Ollama** (if not already installed)
2. **Pull a model**: `ollama pull llama3.2:latest`
3. **Restart LibreChat**: `docker-compose restart api`
4. **Test it out**: Create a chat and select "Ollama" endpoint
5. **Try with Agents**: Use your local model to search marketplace listings!

## Benefits of Self-Hosted Models

- ✅ **Privacy**: Your data never leaves your machine
- ✅ **Cost**: Free to use (only hardware costs)
- ✅ **Speed**: No API rate limits
- ✅ **Offline**: Works without internet
- ✅ **Customizable**: Fine-tune models for your needs

---

**Need help?** Check the LibreChat docs: https://www.librechat.ai/docs/configuration/librechat_yaml
