import * as vscode from 'vscode';

function getConfig<T>(key: string): T {
    const config = vscode.workspace.getConfiguration('grubhub');
    return config.get<T>(key)!;
}

export const BEARER_TOKEN = getConfig<string>('bearerToken');
export const COOKIE = getConfig<string>('cookie') || '';
export const PERIMETER_X = getConfig<string>('perimeterX') || '';
export const POINT = getConfig<string>('point') || '';

// Validate required settings
export function validateSettings(): void {
    if (!BEARER_TOKEN) {
        throw new Error('Grubhub Bearer Token not configured. Please set grubhub.bearerToken in settings.');
    }
    
    // Optional settings warnings
    if (!COOKIE) {
        console.warn('Grubhub Cookie not configured. Some features may not work correctly.');
    }
    if (!PERIMETER_X) {
        console.warn('Grubhub Perimeter-X Token not configured. Some features may not work correctly.');
    }
}