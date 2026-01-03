"use server";

import fs from 'fs';
import path from 'path';
import { parseScript, ScriptLocation } from '@/utils/scriptParser';

// Use dynamic path for cross-platform compatibility
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'DnD campign', 'sessions');

export async function listSessions(): Promise<string[]> {
    try {
        if (!fs.existsSync(SESSIONS_DIR)) {
            console.warn("Sessions directory not found:", SESSIONS_DIR);
            // Fallback to process.cwd() just in case
            const altDir = path.join(process.cwd(), 'data', 'DnD campign', 'sessions');
            if (fs.existsSync(altDir)) {
                return fs.readdirSync(altDir).filter(file => file.endsWith('.md'));
            }
            return [];
        }
        return fs.readdirSync(SESSIONS_DIR).filter(file => file.endsWith('.md'));
    } catch (error) {
        console.error("Error listing sessions:", error);
        return [];
    }
}

export async function loadSessionScript(filename?: string): Promise<ScriptLocation[]> {
    try {
        let filePath: string;

        if (filename) {
            filePath = path.join(SESSIONS_DIR, filename);
        } else {
            // Default fallback
            filePath = path.join(SESSIONS_DIR, 'Session_1_Full_Read_Off_Script.md');
        }

        if (!fs.existsSync(filePath)) {
            console.error("Script file not found at:", filePath);
            return [];
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        return parseScript(fileContent);

    } catch (error) {
        console.error("Error loading script:", error);
        return [];
    }
}
