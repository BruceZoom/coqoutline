import * as vscode from 'vscode';
import * as outline from './OutlineView';

export function activate(context: vscode.ExtensionContext) {
	
	console.debug("activate coqoutline");

	// console.log("Starting Coq Outline...");
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{scheme: "file", language: "coq"}, 
			new outline.CoqDocumentSymbolProvider()
		)
	);

	// vscode.workspace.onDidChangeTextDocument((params) => {

	// });
	

	// context.subscriptions.push(
	// 	vscode.languages.registerDefinitionProvider(
	// 		{scheme: "file", language: "coq"}, 
	// 		new outline.CoqDefinitionProvider()
	// 	)
	// );

}

export function deactivate() {}
