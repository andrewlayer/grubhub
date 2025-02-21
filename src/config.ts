import * as vscode from 'vscode';
import { geocodeAddress } from './services/geocoding';

function getConfig<T>(key: string): T {
    const config = vscode.workspace.getConfiguration('grubhub');
    return config.get<T>(key)!;
}

export const BEARER_TOKEN = getConfig<string>('bearerToken');
export const COOKIE = getConfig<string>('cookie') || '';
export const PERIMETER_X = getConfig<string>('perimeterX') || '';
export const ADDRESS = getConfig<string>('address');

let cachedPoint: string | null = null;

export async function getPoint(): Promise<string> {
    if (cachedPoint) {
        return cachedPoint;
    }

    if (!ADDRESS) {
        throw new Error('Delivery address not configured. Please set grubhub.address in settings.');
    }

    try {
        const coords = await geocodeAddress(ADDRESS);
        cachedPoint = `POINT(${coords.longitude} ${coords.latitude})`;
        return cachedPoint;
    } catch (error) {
        throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Validate required settings
export function validateSettings(): void {
    if (!BEARER_TOKEN) {
        throw new Error('Grubhub Bearer Token not configured. Please set grubhub.bearerToken in settings.');
    }
    if (!ADDRESS) {
        throw new Error('Delivery address not configured. Please set grubhub.address in settings.');
    }
    
    // Optional settings warnings
    if (!COOKIE) {
        console.warn('Grubhub Cookie not configured. Some features may not work correctly.');
    }
    if (!PERIMETER_X) {
        console.warn('Grubhub Perimeter-X Token not configured. Some features may not work correctly.');
    }
}