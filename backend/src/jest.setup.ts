import { jest } from "@jest/globals";

jest.mock("dotenv", () => ({
	config: jest.fn(),
}));