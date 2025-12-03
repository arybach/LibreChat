# Deploying Qwen 2.5 AWQ Model with vLLM + ROCm

## Overview

This guide helps you deploy the **Qwen 2.5 7B AWQ** model (or larger variants) using vLLM with ROCm support for AMD GPUs. The model will be accessible through an OpenAI-compatible API and integrated with LibreChat.

## Prerequisites

### Hardware Requirements

| Model | VRAM | Recommended GPU |
|-------|------|-----------------|
| Qwen 2.5 7B AWQ | ~4GB | RX 7600, RX 6600 or better |
| Qwen 2.5 14B AWQ | ~7GB | RX 7700 XT, RX 6700 XT or better |
| Qwen 2.5 32B AWQ | ~16GB | RX 7900 XTX, RX 6900 XT or better |

### Software Requirements

- **AMD GPU** with ROCm support (RDNA 2/3 or newer)
- **Docker** installed and running
- **8GB+ System RAM** (in addition to VRAM)
- **Ubuntu 20.04+** or compatible Linux distribution

### ROCm Compatibility

Check if your GPU is supported: https://rocm.docs.amd.com/en/latest/release/gpu_os_support.html

Supported GPUs include:
- RX 7900 XTX/XT, RX 7800 XT, RX 7700 XT, RX 7600
- RX 6950 XT, RX 6900 XT, RX 6800 XT, RX 6700 XT, RX 6600 XT

## Quick Start

### 1. Install ROCm (if not already installed)

```bash
# Ubuntu/Debian
wget https://repo.radeon.com/amdgpu-install/latest/ubuntu/jammy/amdgpu-install_6.0.60000-1_all.deb
sudo apt install ./amdgpu-install_6.0.60000-1_all.deb
sudo amdgpu-install --usecase=graphics,rocm

# Verify installation
rocm-smi
```

### 2. Add User to GPU Groups

```bash
sudo usermod -aG video,render $USER
newgrp video
newgrp render
```

### 3. Get HuggingFace Token (Optional but Recommended)

1. Go to https://huggingface.co/settings/tokens
2. Create a new token (read access)
3. Add to `.env`:
   ```bash
   echo "HF_TOKEN=your_token_here" >> .env
   ```

### 4. Run Automated Setup

```bash
cd /projects/LibreChat
bash setup-vllm-rocm.sh
```

The script will:
- ✅ Check your AMD GPU
- ✅ Verify ROCm installation
- ✅ Pull vLLM Docker image
- ✅ Download and start the Qwen model
- ✅ Test the API endpoint

**Note:** First run takes 10-15 minutes to download the model (~4GB).

### 5. Restart LibreChat

```bash
docker-compose restart api
```

### 6. Use the Model

1. Open http://localhost:3080
2. Click model dropdown
3. Select **"vLLM Qwen (ROCm)"**
4. Choose your model (e.g., `qwen2.5-7b-awq`)
5. Start chatting!

## Manual Setup

If you prefer manual setup or need to customize:

### 1. Start vLLM Server

```bash
# Basic setup
docker-compose -f docker-compose.vllm.yml up -d

# View logs
docker-compose -f docker-compose.vllm.yml logs -f

# Check status
curl http://localhost:8000/v1/models
```

### 2. Test the API

```bash
# List models
curl http://localhost:8000/v1/models

# Generate text
curl http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-7b-awq",
    "prompt": "Explain quantum computing in simple terms:",
    "max_tokens": 100,
    "temperature": 0.7
  }'

# Chat completion
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-7b-awq",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```

## Configuration

### Adjusting GPU Memory Usage

Edit `docker-compose.vllm.yml`:

```yaml
# For 8GB VRAM
--gpu-memory-utilization 0.9

# For 12GB+ VRAM
--gpu-memory-utilization 0.95

# For 6GB VRAM (tight)
--gpu-memory-utilization 0.7
```

### Changing Max Context Length

```yaml
# Default: 8192 tokens
--max-model-len 8192

# For longer contexts (requires more VRAM)
--max-model-len 16384

# For shorter contexts (saves VRAM)
--max-model-len 4096
```

### Switching Models

```bash
# Edit docker-compose.vllm.yml, change:
--model Qwen/Qwen2.5-7B-Instruct-AWQ

# To one of:
--model Qwen/Qwen2.5-14B-Instruct-AWQ
--model Qwen/Qwen2.5-32B-Instruct-AWQ

# Then restart:
docker-compose -f docker-compose.vllm.yml restart
```

## Monitoring & Management

### GPU Usage

```bash
# Monitor GPU usage in real-time
watch -n 1 rocm-smi

# Detailed GPU info
rocm-smi --showproductname
rocm-smi --showmeminfo vram
```

### Container Management

```bash
# View logs
docker-compose -f docker-compose.vllm.yml logs -f

# Stop vLLM
docker-compose -f docker-compose.vllm.yml down

# Restart vLLM
docker-compose -f docker-compose.vllm.yml restart

# Check status
docker-compose -f docker-compose.vllm.yml ps
```

### Performance Stats

```bash
# Check vLLM metrics
curl http://localhost:8000/metrics

# Test generation speed
time curl http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen2.5-7b-awq", "prompt": "Hello", "max_tokens": 100}'
```

## Troubleshooting

### GPU Not Detected

```bash
# Check GPU devices
ls -la /dev/kfd /dev/dri/render*

# Verify ROCm
rocm-smi

# Check Docker has GPU access
docker run --rm --device=/dev/kfd --device=/dev/dri \
  vllm/vllm-openai:latest rocm-smi
```

### Out of Memory (OOM)

1. **Reduce GPU memory utilization**:
   ```yaml
   --gpu-memory-utilization 0.7
   ```

2. **Reduce context length**:
   ```yaml
   --max-model-len 4096
   ```

3. **Use smaller model**:
   ```yaml
   --model Qwen/Qwen2.5-7B-Instruct-AWQ
   ```

### Slow Performance

1. **Check GPU is being used**:
   ```bash
   rocm-smi
   # Should show GPU activity and memory usage
   ```

2. **Verify quantization is active**:
   ```bash
   docker-compose -f docker-compose.vllm.yml logs | grep -i awq
   # Should see "AWQ quantization enabled"
   ```

3. **Increase batch size** (if you have VRAM):
   ```yaml
   --max-num-seqs 32
   ```

### Model Download Fails

1. **Check HuggingFace token**:
   ```bash
   echo $HF_TOKEN
   ```

2. **Manual download**:
   ```bash
   docker run --rm -it \
     -e HF_TOKEN=$HF_TOKEN \
     -v ./models:/root/.cache/huggingface \
     vllm/vllm-openai:latest \
     python -c "from huggingface_hub import snapshot_download; \
     snapshot_download('Qwen/Qwen2.5-7B-Instruct-AWQ')"
   ```

### Server Won't Start

```bash
# Check logs
docker-compose -f docker-compose.vllm.yml logs

# Common issues:
# - Port 8000 already in use: change port mapping
# - Insufficient VRAM: use smaller model or reduce memory usage
# - ROCm driver issues: reinstall ROCm
```

## Using with LibreChat Agents

1. **Create an Agent**:
   - Go to LibreChat
   - Click "Agents" in sidebar
   - Create new agent

2. **Configure Agent**:
   - **Provider**: Select "vLLM Qwen (ROCm)"
   - **Model**: Choose your model
   - **Tools**: Enable marketplace_search, etc.

3. **Test with Marketplace**:
   ```
   User: "Find me furniture under $500 in New York"
   ```
   
   The agent will use your local Qwen model to:
   - Understand the request
   - Call the marketplace_search tool
   - Format the results

## Performance Benchmarks

Approximate speeds on different GPUs (tokens/second):

| GPU | Model | Speed |
|-----|-------|-------|
| RX 7900 XTX | Qwen 2.5 7B AWQ | ~80-100 tok/s |
| RX 7900 XT | Qwen 2.5 7B AWQ | ~70-85 tok/s |
| RX 7700 XT | Qwen 2.5 7B AWQ | ~50-65 tok/s |
| RX 6800 XT | Qwen 2.5 7B AWQ | ~45-60 tok/s |

## Advantages of This Setup

- ✅ **Privacy**: All inference happens locally
- ✅ **No API costs**: Free after hardware investment
- ✅ **Fast**: AWQ quantization maintains speed
- ✅ **Quality**: Qwen 2.5 is a high-quality model
- ✅ **AMD Support**: Works on AMD GPUs via ROCm
- ✅ **OpenAI Compatible**: Drop-in replacement
- ✅ **Scalable**: Can run multiple models

## Alternative Models

Other AWQ models that work well:

```bash
# Mistral 7B
--model TheBloke/Mistral-7B-Instruct-v0.2-AWQ

# Llama 3.1 8B
--model casperhansen/llama-3.1-8b-instruct-awq

# CodeLlama 13B
--model TheBloke/CodeLlama-13B-Instruct-AWQ

# DeepSeek Coder
--model deepseek-ai/deepseek-coder-6.7b-instruct-awq
```

## Next Steps

1. ✅ vLLM server is running
2. ✅ Model is loaded and accessible
3. ✅ LibreChat is configured
4. 🎯 **Try it out**: Chat with your local AI!
5. 📊 **Monitor**: Keep an eye on GPU usage
6. 🔧 **Optimize**: Adjust settings for your hardware

---

**Questions?** Check vLLM docs: https://docs.vllm.ai/
