# Custom Features Added to LibreChat

This fork adds marketplace search and AMD GPU support to LibreChat.

## Features

### 1. Marketplace Search Aggregator
- **Craigslist Integration**: Search multiple cities and categories
- **Facebook Marketplace**: Authenticated scraping with your account
- **Facebook Groups**: Search your joined groups for listings
- **RESTful API**: Query listings programmatically
- **LangChain Tool**: Integrated with LibreChat agents

**Locations**: New York, Los Angeles, Chicago, Miami  
**Categories**: Furniture, Apartments, Motorcycles, Autos

### 2. AMD GPU Support (ROCm)
- **Ollama with ROCm**: Run LLMs on AMD Radeon 8060S iGPU
- **Qwen3:8b Model**: 4.87GB VRAM usage
- **32GB VRAM**: Integrated GPU support with gfx1151 architecture

## Setup

### Prerequisites
```bash
# For AMD GPU support
export HSA_OVERRIDE_GFX_VERSION=11.5.1

# For Facebook authentication (optional)
# Export your browser cookies and save to marketplace-cookies/facebook.json
```

### Environment Variables
```bash
# Marketplace Search
SEARCH_AGGREGATOR_URL=http://search_aggregator:3001
ENABLE_FACEBOOK=true
ENABLE_CRAIGSLIST=true
FACEBOOK_GROUP_IDS=your,group,ids

# AMD GPU
HSA_OVERRIDE_GFX_VERSION=11.5.1
```

### Quick Start
```bash
docker-compose up -d
```

## Architecture

- **search-aggregator/**: Node.js microservice for scraping marketplaces
- **api/app/clients/tools/marketplace.js**: LangChain tool integration
- **Ollama ROCm**: Local LLM inference on AMD GPU

## Documentation

- `DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `search-aggregator/README.md` - Search aggregator details
- `search-aggregator/EXPORT_FACEBOOK_COOKIES.md` - Facebook auth setup

## Original Project

Forked from [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat)

## License

MIT License - Same as upstream LibreChat
