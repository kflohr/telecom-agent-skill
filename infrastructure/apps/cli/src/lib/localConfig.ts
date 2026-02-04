import fs from "fs";
import os from "os";
import path from "path";

export type LocalConfig = {
    apiUrl: string;
    workspaceToken?: string;
    workspaceId?: string;
};

const DIR = path.join(os.homedir(), ".telecom");
const FILE = path.join(DIR, "config.json");

export function readConfig(): LocalConfig | null {
    try {
        const raw = fs.readFileSync(FILE, "utf8");
        return JSON.parse(raw) as LocalConfig;
    } catch {
        return null;
    }
}

export function writeConfig(cfg: LocalConfig) {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), "utf8");
}

export function configPath() {
    return FILE;
}
