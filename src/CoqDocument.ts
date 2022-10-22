import * as vscode from 'vscode';
import { CoqDocumentSymbolProvider } from './CoqDocumentSymbolProvider';

export class CoqDocument implements vscode.Disposable {

    private symbols: vscode.DocumentSymbol[] = [];
    private symbols_flat: vscode.DocumentSymbol[] = [];

    constructor(doc: vscode.TextDocument){
        this.reparseSymbols(doc);
    }

    dispose() {
        
    }

    public getSymbols(){
        return this.symbols;
    }

    public getSymbolsFlat(){
        return this.symbols_flat;
    }

    public reparseSymbols(doc: vscode.TextDocument) {
        CoqDocumentSymbolProvider.provideDocumentSymbols(doc).then(([symbols, symbols_flat]) => {
            this.symbols = symbols;
            this.symbols_flat = symbols_flat;
        });
    }
}
