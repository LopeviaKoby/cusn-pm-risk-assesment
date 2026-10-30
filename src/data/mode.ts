export type DataMode = "demo" | "api";

export const dataMode: DataMode = import.meta.env.MODE === "api" ? "api" : "demo";
