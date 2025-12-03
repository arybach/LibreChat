#!/bin/bash

# vLLM + ROCm Setup Script for Qwen 2.5 7B AWQ
# This script sets up vLLM with ROCm support for AMD GPUs

set -e

echo "🚀 vLLM + ROCm Setup for Qwen 2.5 7B AWQ"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on AMD GPU
echo "1. Checking AMD GPU..."
if ! lspci | grep -i "VGA.*AMD" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Warning: No AMD GPU detected. This setup requires an AMD GPU.${NC}"
    read -p "Continue anyway? (y/N): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ AMD GPU detected${NC}"
    lspci | grep -i "VGA.*AMD"
fi

# Check ROCm installation
echo ""
echo "2. Checking ROCm..."
if ! command -v rocm-smi &> /dev/null; then
    echo -e "${YELLOW}⚠ ROCm not detected on host${NC}"
    echo "ROCm will be provided by the Docker container"
else
    echo -e "${GREEN}✓ ROCm is installed${NC}"
    rocm-smi --showproductname 2>/dev/null || true
fi

# Check Docker
echo ""
echo "3. Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check GPU access from Docker
echo ""
echo "4. Verifying GPU access..."
if [ -e /dev/kfd ] && [ -e /dev/dri ]; then
    echo -e "${GREEN}✓ GPU devices found: /dev/kfd, /dev/dri${NC}"
    ls -la /dev/kfd /dev/dri/render* 2>/dev/null || true
else
    echo -e "${RED}❌ GPU devices not found${NC}"
    echo "Make sure ROCm kernel driver is installed"
    exit 1
fi

# Check/create HuggingFace token
echo ""
echo "5. HuggingFace Configuration"
if [ -z "$HF_TOKEN" ]; then
    echo -e "${YELLOW}⚠ HF_TOKEN not set${NC}"
    echo ""
    echo "To download models from HuggingFace, you need a token:"
    echo "1. Go to https://huggingface.co/settings/tokens"
    echo "2. Create a new token (read access is sufficient)"
    echo "3. Add to .env: HF_TOKEN=your_token_here"
    echo ""
    read -p "Enter HF_TOKEN now (or press Enter to skip): " hf_token
    if [ -n "$hf_token" ]; then
        if ! grep -q "HF_TOKEN=" .env 2>/dev/null; then
            echo "HF_TOKEN=$hf_token" >> .env
            echo -e "${GREEN}✓ HF_TOKEN added to .env${NC}"
        fi
        export HF_TOKEN=$hf_token
    fi
else
    echo -e "${GREEN}✓ HF_TOKEN is configured${NC}"
fi

# Create models directory
echo ""
echo "6. Creating models cache directory..."
mkdir -p ./models
echo -e "${GREEN}✓ Models directory created${NC}"

# Check available models
echo ""
echo "7. Available Qwen AWQ Models:"
echo "   - Qwen/Qwen2.5-7B-Instruct-AWQ (Recommended, ~4GB)"
echo "   - Qwen/Qwen2.5-14B-Instruct-AWQ (~7GB)"
echo "   - Qwen/Qwen2.5-32B-Instruct-AWQ (~16GB)"
echo ""

# Ask which model to use
echo "Select model to deploy:"
echo "1) Qwen2.5-7B-Instruct-AWQ (Default, 4GB)"
echo "2) Qwen2.5-14B-Instruct-AWQ (7GB)"
echo "3) Qwen2.5-32B-Instruct-AWQ (16GB)"
read -p "Enter choice [1-3] (default: 1): " model_choice

case $model_choice in
    2)
        model_name="Qwen/Qwen2.5-14B-Instruct-AWQ"
        model_short="qwen2.5-14b-awq"
        ;;
    3)
        model_name="Qwen/Qwen2.5-32B-Instruct-AWQ"
        model_short="qwen2.5-32b-awq"
        ;;
    *)
        model_name="Qwen/Qwen2.5-7B-Instruct-AWQ"
        model_short="qwen2.5-7b-awq"
        ;;
esac

echo -e "${GREEN}Selected: $model_name${NC}"

# Update docker-compose file with selected model
echo ""
echo "8. Updating docker-compose.yml vLLM service..."
sed -i "s|--model Qwen/Qwen.*|--model $model_name|g" docker-compose.yml
echo -e "${GREEN}✓ Configuration updated${NC}"

# Build Docker image with ROCm
echo ""
echo "9. Building vLLM ROCm Docker image..."
echo "This may take 10-15 minutes on first build..."
docker-compose build vllm

# Start vLLM
echo ""
echo "10. Starting vLLM server..."
docker-compose up -d vllm

echo ""
echo "11. Waiting for model to load (this may take 5-10 minutes)..."
echo "Monitoring logs (Ctrl+C to stop viewing, server will keep running)..."
echo ""
docker-compose logs -f vllm &
LOGS_PID=$!

# Wait for server to be ready
max_wait=600  # 10 minutes
waited=0
while [ $waited -lt $max_wait ]; do
    if curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
        kill $LOGS_PID 2>/dev/null || true
        echo ""
        echo -e "${GREEN}✓ vLLM server is ready!${NC}"
        break
    fi
    sleep 10
    waited=$((waited + 10))
    if [ $((waited % 60)) -eq 0 ]; then
        echo "Still loading... ($((waited / 60)) minutes elapsed)"
    fi
done

if [ $waited -ge $max_wait ]; then
    kill $LOGS_PID 2>/dev/null || true
    echo -e "${RED}❌ Server did not start within 10 minutes${NC}"
    echo "Check logs: docker-compose logs vllm"
    exit 1
fi

# Test the API
echo ""
echo "12. Testing API..."
response=$(curl -s http://localhost:8000/v1/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "'$model_short'",
        "prompt": "Hello! ",
        "max_tokens": 20
    }')

if echo "$response" | grep -q "choices"; then
    echo -e "${GREEN}✓ API is working!${NC}"
    echo "Response: $response" | jq '.choices[0].text' 2>/dev/null || echo "$response"
else
    echo -e "${YELLOW}⚠ API test inconclusive${NC}"
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "========================================"
echo ""
echo "📊 Server Information:"
echo "   - Model: $model_name"
echo "   - API Endpoint: http://localhost:8000"
echo "   - OpenAI-compatible: Yes"
echo "   - Model name: $model_short"
echo ""
echo "🔧 Useful Commands:"
echo "   - View logs: docker-compose logs -f vllm"
echo "   - Stop server: docker-compose stop vllm"
echo "   - Restart: docker-compose restart vllm"
echo "   - Check status: docker-compose ps vllm"
echo ""
echo "🧪 Test API:"
echo "   curl http://localhost:8000/v1/models"
echo ""
echo "📝 Next Steps:"
echo "   1. vLLM is running on LibreChat network at http://vllm:8000"
echo "   2. librechat.yaml already configured with vLLM endpoint"
echo "   3. Restart LibreChat: docker-compose restart api"
echo "   4. Open http://localhost:3080 and select 'vLLM Qwen' endpoint"
echo ""
echo "💡 GPU Usage:"
echo "   Monitor: watch -n 1 rocm-smi"
echo ""
