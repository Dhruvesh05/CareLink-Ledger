/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    roots: ["<rootDir>/src/ipfs"],
    testMatch: ["**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json"],
    setupFilesAfterEnv: [],
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,
    collectCoverageFrom: [
        "src/ipfs/**/*.ts",
        "!src/ipfs/tests/**/*.ts",
        "!src/ipfs/index.ts"
    ],
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "<rootDir>/tsconfig.ipfs.test.json"
            }
        ]
    },
    transformIgnorePatterns: [
        "node_modules/(?!.*multiformats/)"
    ],
    moduleNameMapper: {
        "^\\.\\./\\.\\./models/User\\.js$": "<rootDir>/src/models/User.ts",
        "^\\.\\./\\.\\./models/SsiAuthorizationChallenge\\.js$": "<rootDir>/src/models/SsiAuthorizationChallenge.ts",
        "^\\.\\./\\.\\./services/blockchain/MedicalRecordTransactionPreparationService\\.js$": "<rootDir>/src/services/blockchain/MedicalRecordTransactionPreparationService.ts",
        "^\\.\\./\\.\\./services/blockchain/MedicalRecordTransactionConfirmationService\\.js$": "<rootDir>/src/services/blockchain/MedicalRecordTransactionConfirmationService.ts",
        "^\\.\\./\\.\\./blockchain/provider/BlockchainFactory\\.js$": "<rootDir>/src/blockchain/provider/BlockchainFactory.ts",
        "^\\.\\./config/veramo\\.config$": "<rootDir>/src/ssi/config/veramo.config.ts",
        "^\\.\\./config/veramo\\.config\\.js$": "<rootDir>/src/ssi/config/veramo.config.ts",
        "^\\.\\./\\.\\./config/env$": "<rootDir>/src/config/env.ts",
        "^\\.\\./\\.\\./config/env\\.js$": "<rootDir>/src/config/env.ts",
        "^\\.\\./\\.\\./utils/jwt$": "<rootDir>/src/utils/jwt.ts",
        "^\\.\\./\\.\\./utils/jwt\\.js$": "<rootDir>/src/utils/jwt.ts",
        "^\\.\\./\\.\\./middleware/auth\\.ts$": "<rootDir>/src/middleware/auth.ts",
        "^\\.\\./\\.\\./middleware/upload\\.middleware\\.ts$": "<rootDir>/src/middleware/upload.middleware.ts",
        "^\\.\\.\\/\\.\\.\\/ssi\\/middleware\\/carelinkAuthorization\\.ts$": "<rootDir>/src/ssi/middleware/carelinkAuthorization.ts",
        "^\\.\\.\\/\\.\\.\\/controllers\\/MedicalRecordController\\.ts$": "<rootDir>/src/controllers/MedicalRecordController.ts",
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
};
