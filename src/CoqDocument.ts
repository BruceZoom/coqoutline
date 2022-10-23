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

    public async reparseSymbols(doc: vscode.TextDocument) {
        let results = await CoqDocumentSymbolProvider.provideDocumentSymbols(doc);
        this.symbols = results[0];
        this.symbols_flat = results[1];
        // then(([symbols, symbols_flat]) => {
        //     this.symbols = symbols;
        //     this.symbols_flat = symbols_flat;
        // }).catch(reason => console.debug(reason));
    }
}
