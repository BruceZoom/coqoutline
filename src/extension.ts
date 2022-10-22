import * as vscode from 'vscode';
import { CoqProject } from './CoqProject';
import { CoqDocumentSymbolProvider } from './CoqDocumentSymbolProvider';
import { CoqDefinitionProvider } from './CoqDefinitionProvider';

let project: CoqProject;

export function activate(context: vscode.ExtensionContext) {
	
	console.debug("activate coqoutline");

	project = CoqProject.create();
	context.subscriptions.push(project);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{scheme: "file", language: "coq"}, 
			new CoqDocumentSymbolProvider()
		)
	);
	

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{scheme: "file", language: "coq"}, 
			new CoqDefinitionProvider()
		)
	);

}

export function deactivate() {}
