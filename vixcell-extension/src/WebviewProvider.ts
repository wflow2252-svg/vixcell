import * as vscode from 'vscode';

export class VixcellWebviewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Receive sidebar message requests
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'openDesigner':
                    vscode.commands.executeCommand('vixcell.openWorkspace');
                    break;
                case 'showInfo':
                    vscode.window.showInformationMessage(`[Vixcell] ${data.message}`);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    padding: 15px;
                    font-family: var(--vscode-font-family, sans-serif);
                    color: var(--vscode-foreground);
                    background-color: transparent;
                }
                .btn {
                    display: block;
                    width: 100%;
                    padding: 8px 12px;
                    margin-bottom: 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    text-align: center;
                    font-weight: bold;
                    font-size: 11px;
                }
                .btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                h3 {
                    margin-bottom: 15px;
                    font-size: 14px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 8px;
                }
                p {
                    font-size: 11px;
                    opacity: 0.8;
                    line-height: 1.4;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <h3>VIXCELL DESIGN HUB</h3>
            <p>Welcome to Vixcell local-first AI workspace. Open the visual editor canvas to design your interfaces directly inside your IDE.</p>
            <button class="btn" onclick="openDesigner()">Launch Visual Workspace</button>
            <button class="btn" style="background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);" onclick="showHelp()">Documentation & Help</button>
            
            <script>
                const vscode = acquireVsCodeApi();
                function openDesigner() {
                    vscode.postMessage({ type: 'openDesigner' });
                }
                function showHelp() {
                    vscode.postMessage({ type: 'showInfo', message: 'Opening Documentation...' });
                }
            </script>
        </body>
        </html>`;
    }
}
