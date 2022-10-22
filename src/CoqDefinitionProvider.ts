import * as vscode from 'vscode';
import { CoqProject } from './CoqProject';
import * as coqreg from './CoqRegExps';

export class CoqDefinitionProvider implements vscode.DefinitionProvider {

    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
        return new Promise((resolve, reject) => {
            let locations: vscode.Location[] = [];
            let range = document.getWordRangeAtPosition(position, coqreg.reg_ident);
            // #nomatch# should not match anything
            let target = document.getText(range) ?? '#nomatch#';

            CoqProject.instance?.getCoqDocuments().forEach((doc, uri) => {
                doc.getSymbolsFlat()
                    .filter(symbol => symbol.name === target)
                    .forEach(symbol => locations.push(
                        new vscode.Location(
                            vscode.Uri.parse(uri),
                            symbol.selectionRange
                        )
                    ));
            });

            resolve(locations);
        });
    }
}
