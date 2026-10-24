#!/usr/bin/env bash
set -uo pipefail

export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--experimental-vm-modules"

failed=0

run_group() {
  local name="$1"
  shift

  echo
  echo "=================================================="
  echo "Running: $name"
  echo "=================================================="

  if "$@"; then
    echo "RESULT: PASS — $name"
  else
    echo "RESULT: FAIL — $name"
    failed=1
  fi
}

# IPFS uses its dedicated ESM configuration.
run_group "IPFS tests" \
  npx jest --config jest.ipfs.config.cjs --runInBand --no-coverage

# These suites have been verified with the route ESM configuration.
run_group "Medical-record routes and SSI integration" \
  npx jest --config jest.routes-esm.config.cjs \
    src/tests/routes/medicalRecord.routes.test.ts \
    src/tests/integration/medicalRecord.prepare.ssi.integration.test.ts \
    --runInBand --no-coverage

# The authorization middleware test passes with the integration config
# after the targeted test-mock correction.
run_group "SSI authorization middleware" \
  npx jest --config jest.integration.cjs \
    src/ssi/tests/CareLinkAuthorizationMiddleware.test.ts \
    --runInBand --no-coverage

# Other suites use the integration configuration. Exclude files already
# assigned above, IPFS tests, and the two ESM diagnostic tests.
mapfile -t integration_files < <(
  npx jest --config jest.integration.cjs --listTests |
    grep -v '/src/ipfs/tests/' |
    grep -v '/src/tests/routes/medicalRecord.routes.test.ts$' |
    grep -v '/src/tests/integration/medicalRecord.prepare.ssi.integration.test.ts$' |
    grep -v '/src/ssi/tests/CareLinkAuthorizationMiddleware.test.ts$' |
    grep -v '/src/tests/integration/veramo.concurrent.diagnostic.test.ts$' |
    grep -v '/src/tests/integration/veramo.esm.diagnostic.test.ts$'
)

if ((${#integration_files[@]})); then
  run_group "Remaining integration-config tests" \
    npx jest --config jest.integration.cjs \
      --runInBand --no-coverage \
      "${integration_files[@]}"
fi

# Type-check the backend.
run_group "TypeScript type check" npx tsc --noEmit

echo
echo "=================================================="
if ((failed)); then
  echo "BACKEND TEST RUN: FAILED — inspect the group above."
  exit 1
else
  echo "BACKEND TEST RUN: PASSED"
fi
