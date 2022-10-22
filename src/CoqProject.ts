import * as vscode from 'vscode';
import { CoqDocument } from './CoqDocument';

export class CoqProject implements vscode.Disposable
{
    public static instance: CoqProject|null = null;
    private coqDocuments = new Map<string, CoqDocument>();

    constructor() {
        vscode.workspace.onDidChangeTextDocument((params) => this.onDidChangeTextDocument(params));
        vscode.workspace.onDidOpenTextDocument((params) => this.onDidOpenTextDocument(params));
        vscode.workspace.findFiles("**/*.v").then((results) => {
            results.forEach((uri) => {
                vscode.workspace.openTextDocument(uri).then(doc => this.tryLoadDocument(doc));
            });
        });
        // vscode.workspace.textDocuments.forEach((doc => this.tryLoadDocument(doc)));
    }

    public static create() {
        if(!CoqProject.instance)
        {
            CoqProject.instance = new CoqProject();
        }
        return CoqProject.instance;
    }

    dispose() {
        this.coqDocuments.forEach((doc) => doc.dispose());
        this.coqDocuments.clear();
    }

    public getCoqDocument(uri: vscode.Uri): CoqDocument|undefined {
        return this.coqDocuments.get(uri.toString());
    }

    public getCoqDocuments() {
        return this.coqDocuments;
    }

    private tryLoadDocument(doc: vscode.TextDocument) {
        if(doc.languageId !== 'coq')
        {
            return;
        }
        const uri = doc.uri.toString();
        if(!this.coqDocuments.has(uri)) {
            this.coqDocuments.set(uri, new CoqDocument(doc));
        }
    }

    private onDidChangeTextDocument(params: vscode.TextDocumentChangeEvent) {
        let uri = params.document.uri.toString();
        let doc = this.coqDocuments.get(uri);
        if(!doc) {
            return;
        }
        doc.reparseSymbols(params.document);
    }

    private onDidOpenTextDocument(doc: vscode.TextDocument) {
        this.tryLoadDocument(doc);
    }

    // provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]>  {
    //     return new Promise((resolve, reject) => 
    //     {
    //         throw new Error('Method not implemented.');
    //     });
    // }
    
    // provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition> {
    //     return new Promise((resolve, reject) => 
    //     {
    //         throw new Error('Method not implemented.');
    //     });
    // }

}
