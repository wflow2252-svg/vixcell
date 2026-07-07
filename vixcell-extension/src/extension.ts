import * as vscode from 'vscode';
import { VixcellWebviewProvider } from './WebviewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('[Vixcell AI] Extension is now active.');

    // 1. Register Sidebar Webview View Provider
    const sidebarProvider = new VixcellWebviewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'vixcellSidebar',
            sidebarProvider
        )
    );

    // 2. Register command to open full editor Webview Workspace
    let openWorkspaceCmd = vscode.commands.registerCommand('vixcell.openWorkspace', () => {
        const panel = vscode.window.createWebviewPanel(
            'vixcellWorkspace',
            'Vixcell Design Workspace',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [context.extensionUri]
            }
        );

        panel.webview.html = getWebviewContent(panel.webview);

        // Handle messages from the Webview (postMessage API bridge)
        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'saveFile':
                        try {
                            const { filePath, content } = message.data;
                            if (vscode.workspace.workspaceFolders) {
                                const workspaceRoot = vscode.workspace.workspaceFolders[0].uri;
                                const fileUri = vscode.Uri.joinPath(workspaceRoot, filePath);
                                await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf8'));
                                vscode.window.showInformationMessage(`[Vixcell] Saved ${filePath} successfully.`);
                                panel.webview.postMessage({ command: 'saveSuccess', data: { filePath } });
                            } else {
                                vscode.window.showErrorMessage('[Vixcell] No workspace folders found to save files.');
                            }
                        } catch (err: any) {
                            vscode.window.showErrorMessage(`[Vixcell] Failed to save file: ${err.message}`);
                        }
                        return;

                    case 'showNotification':
                        vscode.window.showInformationMessage(`[Vixcell] ${message.text}`);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(openWorkspaceCmd);
}

function getWebviewContent(webview: vscode.Webview): string {
    // Embed the locally hosted Vixcell Next.js app in a full-height secure container iframe
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vixcell Design Workspace</title>
        <style>
            html, body, iframe {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                border: none;
                overflow: hidden;
                background-color: #ffffff;
            }
        </style>
    </head>
    <body>
        <iframe src="http://localhost:3000/builder?embedded=true" id="vixcell-iframe"></iframe>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            // Forward messages from iframe window to VS Code extension host
            window.addEventListener('message', (event) => {
                const message = event.data;
                if (message && message.source === 'vixcell-client') {
                    vscode.postMessage(message.payload);
                }
            });

            // Forward messages from VS Code extension host to iframe window
            window.addEventListener('message', (event) => {
                const message = event.data;
                if (message && message.source !== 'vixcell-client') {
                    const iframe = document.getElementById('vixcell-iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage(message, '*');
                    }
                }
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {}
