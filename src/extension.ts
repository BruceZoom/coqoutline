import * as vscode from 'vscode';
import * as outline from './OutlineView';

export function activate(context: vscode.ExtensionContext) {
	
	// console.log("Starting Coq Outline...");
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{scheme: "file", language: "coq"}, 
			new outline.CoqDocumentSymbolProvider()
		)
	);

}

export function deactivate() {}
