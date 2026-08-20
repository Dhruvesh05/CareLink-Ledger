/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/*.test.ts"],
	moduleFileExtensions: ["ts", "js", "json"],
	setupFiles: ["<rootDir>/src/jest.setup.ts"],
	clearMocks: true,
	restoreMocks: true,
	resetMocks: false,
	collectCoverageFrom: [
		"src/ipfs/**/*.ts",
		"!src/ipfs/tests/**/*.ts",
		"!src/ipfs/index.ts"
	],
	transform: {
		"^.+\\.ts$": [
			"ts-jest",
			{
				tsconfig: "<rootDir>/tsconfig.test.json"
			}
		]
	}
};