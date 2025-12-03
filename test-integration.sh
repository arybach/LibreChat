#!/bin/bash

# Test script for Search Aggregator + LibreChat integration
# Run this after deployment to verify everything works

set -e

echo "🧪 Testing Search Aggregator Integration"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected, got $response)"
        ((FAILED++))
        return 1
    fi
}

test_json_response() {
    local name=$1
    local url=$2
    local field=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null)
    
    if echo "$response" | grep -q "\"$field\""; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        ((FAILED++))
        return 1
    fi
}

echo "1. Service Health Checks"
echo "------------------------"
test_endpoint "Search Aggregator Health" "http://localhost:3001/health" "200"
test_endpoint "LibreChat Main" "http://localhost:3080" "200"
echo ""

echo "2. API Endpoints"
echo "----------------"
test_json_response "Listings Stats" "http://localhost:3001/api/listings/stats" "success"
test_json_response "Categories API" "http://localhost:3001/api/listings/categories" "categories"
test_json_response "Search API" "http://localhost:3001/api/listings/search?limit=1" "data"
echo ""

echo "3. Database Connection"
echo "---------------------"
echo -n "Checking MongoDB... "
if docker-compose exec -T mongodb mongosh --quiet --eval "db.serverStatus().ok" LibreChat 2>/dev/null | grep -q "1"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo -n "Checking listings collection... "
count=$(docker-compose exec -T mongodb mongosh --quiet --eval "db.listings.countDocuments()" LibreChat 2>/dev/null || echo "0")
if [ "$count" -ge "0" ]; then
    echo -e "${GREEN}✓ PASSED${NC} ($count documents)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi
echo ""

echo "4. Docker Services"
echo "------------------"
echo -n "Search Aggregator container... "
if docker-compose ps search_aggregator | grep -q "Up"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo -n "LibreChat API container... "
if docker-compose ps api | grep -q "Up"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo -n "MongoDB container... "
if docker-compose ps mongodb | grep -q "Up"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi
echo ""

echo "5. Network Connectivity"
echo "----------------------"
echo -n "API can reach Search Aggregator... "
if docker-compose exec -T api wget -q -O- http://search_aggregator:3001/health 2>/dev/null | grep -q "healthy"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi
echo ""

echo "6. Environment Variables"
echo "------------------------"
echo -n "SEARCH_AGGREGATOR_URL in API... "
if docker-compose exec -T api env 2>/dev/null | grep -q "SEARCH_AGGREGATOR_URL"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (May still work with default)"
fi
echo ""

echo "7. Scraping Test (Optional)"
echo "---------------------------"
echo -n "Would you like to run a test scrape? (y/n): "
read -r response
if [ "$response" = "y" ]; then
    echo "Triggering test scrape..."
    curl -X POST http://localhost:3001/api/scrape/trigger 2>/dev/null
    echo ""
    echo "Check logs: docker-compose logs -f search_aggregator"
fi
echo ""

echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open LibreChat: http://localhost:3080"
    echo "2. Create a new agent chat"
    echo "3. Try: 'Find me furniture in New York under $500'"
    echo "4. The AI should use the marketplace_search tool"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check logs: docker-compose logs search_aggregator"
    echo "2. Verify .env configuration"
    echo "3. Ensure all containers are running: docker-compose ps"
    echo "4. Review DEPLOYMENT_GUIDE.md for detailed setup"
    echo ""
    exit 1
fi
