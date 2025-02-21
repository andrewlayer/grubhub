import * as vscode from 'vscode';
import { registerChatTools } from './grubhubTool';
import { validateSettings } from './config';
import { handler } from './chatRequestHandler';


export function activate(context: vscode.ExtensionContext) {
    try {
        validateSettings();
        const gh = vscode.chat.createChatParticipant('grubhub', handler);

        gh.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

        registerChatTools(context);
    } catch (error) {
        vscode.window.showErrorMessage(`Grubhub Extension Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function deactivate() {}




  