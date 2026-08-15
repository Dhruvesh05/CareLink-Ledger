import mongoose from "mongoose";
import { env } from "./env";

export async function connectDatabase(): Promise<void> {
	if (!env.MONGODB_URI) {
		console.warn("[database] MONGODB_URI is not set. Skipping MongoDB connection.");
		return;
	}

	if (mongoose.connection.readyState === 1) {
		return;
	}

	await mongoose.connect(env.MONGODB_URI);
	console.log("[database] MongoDB connected");
}

export function getDatabaseHealth() {
	const state = mongoose.connection.readyState;

	const labels: Record<number, string> = {
		0: "disconnected",
		1: "connected",
		2: "connecting",
		3: "disconnecting"
	};

	return {
		readyState: state,
		status: labels[state] || "unknown"
	};
}
