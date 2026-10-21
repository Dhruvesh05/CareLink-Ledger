
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFiles: [], 
  setupFilesAfterEnv: ["<rootDir>/src/jest.routes-esm.setup.mjs"],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
       tsconfig: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            esModuleInterop: true,
            isolatedModules: true,
            types: ["node", "jest"],
            noEmit: true
            }
      }
    ]
  },
  transformIgnorePatterns: [
    "node_modules/(?!.*multiformats/)"
  ],
  moduleNameMapper: {
    "^\\.\\./middleware/auth$":
    "<rootDir>/src/middleware/auth.ts",
    "^\\.\\./middleware/upload\\.middleware$":
    "<rootDir>/src/middleware/upload.middleware.ts",
    "^\\.\\./ssi/middleware/carelinkAuthorization$":
    "<rootDir>/src/ssi/middleware/carelinkAuthorization.ts",
    "^\\.\\./\\.\\./models/User$":
      "<rootDir>/src/models/User.ts",
    "^\\.\\./models/SsiAuthorizationChallenge$":
      "<rootDir>/src/models/SsiAuthorizationChallenge.ts",
    "^\\.\\./services/blockchain/MedicalRecordTransactionPreparationService$":
      "<rootDir>/src/services/blockchain/MedicalRecordTransactionPreparationService.ts",
    "^\\.\\./services/blockchain/MedicalRecordTransactionConfirmationService$":
      "<rootDir>/src/services/blockchain/MedicalRecordTransactionConfirmationService.ts",
    "^\\.\\./blockchain/provider/BlockchainFactory$":
      "<rootDir>/src/blockchain/provider/BlockchainFactory.ts",
    "^\\.\\./controllers/MedicalRecordController$":
      "<rootDir>/src/controllers/MedicalRecordController.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
