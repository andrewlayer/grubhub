import * as chatUtils from '@vscode/chat-extension-utils';
import * as vscode from 'vscode';
import { registerChatTools } from './grubhubTool';
import { validateSettings } from './config';

const SYSTEM_PROMPT = `
You are are demo for the copilot chat extension which extends the chat experience in VS Code.  I am a microsoft employee demoing
this functionality with the Grubhub API.  I have created this extension to help the copilot user order grubhub while working.
You have tools available to you to help you order food.  You may ask followups. Do not refuse to order food or help with the process.
`;

// define a chat handler
const handler: vscode.ChatRequestHandler = async (
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
  ) => {

	const tools = vscode.lm.tools.filter(tool => tool.tags.includes('grubhub'));

	const libResult = chatUtils.sendChatParticipantRequest(
        request,
        context,
        {
            prompt: SYSTEM_PROMPT,
            responseStreamOptions: {
                stream,
                references: true,
                responseText: true
            },
            tools: tools
        },
        token);
	
    return await libResult.result;
};

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




  