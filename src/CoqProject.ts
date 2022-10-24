import { assert } from 'console';
import * as vscode from 'vscode';
import { CoqDocument } from './CoqDocument';

export class CoqProject implements vscode.Disposable
{
    public static instance: CoqProject|null = null;
    private coqDocuments = new Map<string, CoqDocument>();

    constructor() {
        vscode.workspace.onDidChangeTextDocument((params) => this.onDidChangeTextDocument(params));
        vscode.workspace.onDidOpenTextDocument((params) => this.onDidOpenTextDocument(params));

        vscode.workspace.onDidCreateFiles((params) => this.onDidCreateFiles(params));
        vscode.workspace.onDidDeleteFiles((params) => this.onDidDeleteFiles(params));
        vscode.workspace.onDidRenameFiles(this.onDidRenameFiles, this);

        vscode.workspace.findFiles("_CoqProject").then((results) => {
            // only prepare symbols for all Coq files in the workspace
            // when _CoqProject is found at workspace root, i.e., this is a Coq project
            // this is to prevent to unnecessarily traverse through large workspaces
            if (results.length >= 1)
            {
                vscode.workspace.findFiles("**/*.v").then((results) => {
                    results.forEach((uri) => {
                        vscode.workspace.openTextDocument(uri).then(doc => this.tryLoadDocument(doc));
                    });
                });
            }
        });
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
        if(!this.coqDocuments.has(uri.toString())) {
            // try load it once if not found
            console.debug("reload " + uri.path);
            vscode.workspace.openTextDocument(uri).then(doc => this.tryLoadDocument(doc));
        }
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
            let coqDoc = new CoqDocument(doc);
            this.coqDocuments.set(uri, coqDoc);
            return coqDoc;
        }
    }

    private onDidChangeTextDocument(params: vscode.TextDocumentChangeEvent) {
        let uri = params.document.uri.toString();
        let doc = this.coqDocuments.get(uri);
        if(!doc) {
            // try load it if not found
            this.tryLoadDocument(params.document)?.reparseSymbols(params.document);
            return;
        }
        doc.reparseSymbols(params.document);
    }

    private onDidOpenTextDocument(doc: vscode.TextDocument)
    {
        this.tryLoadDocument(doc)?.reparseSymbols(doc);
    }

    private onDidCreateFiles(params: vscode.FileCreateEvent) {
        params.files.forEach((uri) => {
            vscode.workspace.openTextDocument(uri).then(doc => this.tryLoadDocument(doc));
        });
    }

    private onDidDeleteFiles(params: vscode.FileDeleteEvent) {
        params.files.forEach((uri) => {
            this.coqDocuments.delete(uri.toString());
        });
    }

    private onDidRenameFiles(params: vscode.FileRenameEvent) {
        params.files.forEach((uris) => {
            // do nothing if the rename is invalid
            if (uris.newUri === uris.oldUri
                || !this.coqDocuments.has(uris.oldUri.toString()))
            {
                return;
            }
            let oldCoqDoc = this.coqDocuments.get(uris.oldUri.toString());
            if (oldCoqDoc !== undefined)
            {
                // update the new one
                // MARK: must update synchronously, otherwise not in effect
                this.coqDocuments.set(uris.newUri.toString(), oldCoqDoc);
                // remove old one
                this.coqDocuments.delete(uris.oldUri.toString());
            }
        });
    }
}
