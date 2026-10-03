#!/usr/bin/env bash

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000/api}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

print_header() {
  echo
  echo -e "${BLUE}====================================================${NC}"
  echo -e "${BLUE}       AI Marketplace Backend API Tester${NC}"
  echo -e "${BLUE}====================================================${NC}"
  echo
  echo "Base URL: $BASE_URL"
  echo
}

test_get() {
  local endpoint="$1"
  local expected="${2:-200}"

  local url="${BASE_URL}${endpoint}"

  echo -n "GET  ${endpoint} ... "

  response=$(curl -s -w "\n%{http_code}" "$url")

  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n1)

  if [[ "$status" == "$expected" ]]; then
    echo -e "${GREEN}PASS${NC} [$status]"
    echo "     Response: $body"
    ((PASS++))
  else
    echo -e "${RED}FAIL${NC} [$status] expected [$expected]"
    echo "     Response: $body"
    ((FAIL++))
  fi

  echo
}

test_post() {
  local endpoint="$1"
  local body="$2"
  local expected="${3:-200}"

  local url="${BASE_URL}${endpoint}"

  echo -n "POST ${endpoint} ... "

  response=$(curl -s \
    -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$body" \
    "$url")

  response_body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n1)

  if [[ "$status" == "$expected" ]]; then
    echo -e "${GREEN}PASS${NC} [$status]"
    echo "     Response: $response_body"
    ((PASS++))
  else
    echo -e "${RED}FAIL${NC} [$status] expected [$expected]"
    echo "     Response: $response_body"
    ((FAIL++))
  fi

  echo
}

check_backend() {
  echo -e "${BLUE}Checking backend...${NC}"

  if curl -s --connect-timeout 3 "$BASE_URL/test/health" >/dev/null; then
    echo -e "${GREEN}Backend is running.${NC}"
    echo
    return 0
  fi

  echo -e "${RED}Backend is NOT reachable.${NC}"
  echo
  echo "Make sure Spring Boot is running:"
  echo
  echo "  cd Backend/aimarketplace"
  echo "  mvn spring-boot:run"
  echo

  exit 1
}

main() {

  print_header

  check_backend

  echo -e "${BLUE}========== PUBLIC ENDPOINTS ==========${NC}"
  echo

  test_get "/test/health" 200
  test_get "/test/public" 200

  echo -e "${BLUE}========== PROTECTED ENDPOINT ==========${NC}"
  echo

  # Without JWT this should normally return 401 or 403.
  echo -n "GET  /test/private without JWT ... "

  response=$(curl -s \
    -o /tmp/private-response.json \
    -w "%{http_code}" \
    "$BASE_URL/test/private")

  if [[ "$response" == "401" || "$response" == "403" ]]; then
    echo -e "${GREEN}PASS${NC} [$response]"
    echo "     Protected endpoint correctly rejected unauthenticated request."
    ((PASS++))
  else
    echo -e "${RED}FAIL${NC} [$response]"
    echo "     Expected 401 or 403."
    cat /tmp/private-response.json
    echo
    ((FAIL++))
  fi

  echo

  echo -e "${BLUE}========== AUTH ENDPOINT ==========${NC}"
  echo

  # Generate a random wallet address for nonce testing.
  WALLET_ADDRESS=$(
    python3 - <<'PY'
import secrets

# Valid Ethereum-style address format.
print("0x" + secrets.token_hex(20))
PY
  )

  echo "Testing wallet:"
  echo "$WALLET_ADDRESS"
  echo

  echo -e "${YELLOW}Requesting nonce...${NC}"

  NONCE_RESPONSE=$(curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"walletAddress\":\"$WALLET_ADDRESS\"}" \
    "$BASE_URL/auth/request-nonce")

  echo "Response:"
  echo "$NONCE_RESPONSE"
  echo

  NONCE=$(echo "$NONCE_RESPONSE" | python3 -c '
import sys, json

try:
    data=json.load(sys.stdin)
    print(data.get("nonce",""))
except:
    print("")
')

  if [[ -n "$NONCE" ]]; then
    echo -e "${GREEN}PASS${NC} Nonce received."
    ((PASS++))
  else
    echo -e "${RED}FAIL${NC} No nonce received."
    ((FAIL++))
  fi

  echo

  echo -e "${BLUE}========== SUMMARY ==========${NC}"
  echo

  echo -e "Passed: ${GREEN}${PASS}${NC}"
  echo -e "Failed: ${RED}${FAIL}${NC}"

  echo

  if [[ "$FAIL" -eq 0 ]]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN} ALL TESTED ENDPOINTS PASSED${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
  else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED} SOME ENDPOINTS FAILED${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
  fi
}

main "$@"
