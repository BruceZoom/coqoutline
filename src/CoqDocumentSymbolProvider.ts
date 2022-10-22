import { assert } from 'console';
// src/extension.ts

import * as vscode from 'vscode';
import { CoqProject } from './CoqProject';
import * as coqreg from './CoqRegExps';

export class CoqDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, rejects) => {
            if (CoqProject.instance !== null) {
                let coqDoc = CoqProject.instance.getCoqDocument(document.uri);
                if (coqDoc !== undefined)
                {
                    resolve(coqDoc.getSymbols());
                }
            }
        });
    }

    private static parse(line: string): [string, string]
    {
        let rkey = line.match(coqreg.reg_key);
        if (rkey === null) {
            return ["", ""];
        }
        // console.debug(rkey);
        let rname = line.substring(rkey[0].length).match(coqreg.reg_ident);
        // console.debug(rname);
        if (rname === null) {
            return [rkey[1], "#undefined#"];
        }
        return [rkey[1], rname[1]];
    }

    private static to_singular(str: string): string {
        if(str.endsWith("ses"))
        {
            return str.substring(0, str.length-2) + "is";
        }
        else if (str.endsWith("s"))
        {
            return str.substring(0, str.length-1);
        }
        else
        {
            return str;
        }
    }

    /**
     * 
     * @param document The document to analyze symbols.
     * @returns A tuple of hierarchical symbols and its flatten symbol list.
     */
    public static provideDocumentSymbols(document: vscode.TextDocument): Promise<[vscode.DocumentSymbol[], vscode.DocumentSymbol[]]> 
    {
        return new Promise((resolve, reject) => 
        {
            let symbols: vscode.DocumentSymbol[] = [];
            let nodes = [symbols];
            let node_ids = [""];
            let symbols_flat = [];
            
            let def_stack: vscode.DocumentSymbol[] = [];
            let thm_stack: vscode.DocumentSymbol[] = [];
            
            let cnt_comment = 0;

            let focused_class: vscode.DocumentSymbol | null = null;
            let field_ended = true;

            let focused_inductive: vscode.DocumentSymbol | null = null;

            for (var lnum = 0; lnum < document.lineCount; lnum++) {
                assert(nodes.length === node_ids.length, "Hierarchy level mismatch.");
                
                var line = document.lineAt(lnum);
                
                let tokens = CoqDocumentSymbolProvider.parse(line.text.trim());
                // console.debug("hierarchy:" + node_ids);
                // console.debug("cur token:" + tokens);
                let field = line.text.trim().match(coqreg.reg_field);
                
                // if outside comment block
                if (cnt_comment <= 0)
                {
                    if (coqreg.reg_key_region_start.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            "Section" === tokens[0] ?
                                vscode.SymbolKind.Namespace:
                                vscode.SymbolKind.Module,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        symbols_flat.push(symbol);
                        
                        // exclude module inheritance
                        if ("Module" !== tokens[0] || !line.text.includes(":="))
                        {
                            nodes.push(symbol.children);
                            node_ids.push(tokens[1]);
                        }
                        // console.debug("push: " + tokens[1]);
                    }
                    else if (coqreg.reg_key_region_end.test(tokens[0]))
                    {
                        if(node_ids[nodes.length - 1] === tokens[1]){
                            nodes.pop();
                            node_ids.pop();
                            let parent = nodes[nodes.length - 1][nodes[nodes.length - 1].length - 1];
                            parent.range = new vscode.Range(
                                parent.range.start, line.range.end
                            );
                        }
                        // var i = nodes.length - 1
                        // var node_id = tokens[1]
                        // while (i > 0 && node_ids[i] != node_id) i--
                        // if (i > 0){
                        //     while (nodes.length > i){
                        //         nodes.pop()
                        //         node_ids.pop()
                        //     }
                        // }
                    }
                    else if (focused_inductive !== null)
                    {
                        let item;
                        while ((item = coqreg.reg_inductive_item.exec(line.text.trim())) !== null)
                        {
                            let symbol = new vscode.DocumentSymbol(
                                item[0].replace(/\|/g, " ").trim(),
                                'Constructor',
                                vscode.SymbolKind.Constructor,
                                line.range, line.range);
    
                            focused_inductive.children.push(symbol);
                            symbols_flat.push(symbol);
                        }
                    }
                    else if (coqreg.reg_key_definition.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Field,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        if (coqreg.reg_key_inductive.test(tokens[0]))
                        {
                            focused_inductive = symbol;
                        }
                        symbols_flat.push(symbol);
                        def_stack.push(symbol);
                    }
                    else if (coqreg.reg_key_theorem.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Interface,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        symbols_flat.push(symbol);
                        thm_stack.push(symbol);
                    }
                    // detects field of class and record before detections of these two
                    // because we assume fields and class name are not in the same line
                    else if (focused_class !== null && field_ended && field !== null)
                    {
                        let symbol = new vscode.DocumentSymbol(
                            field[1],
                            'Field',
                            vscode.SymbolKind.Variable,
                            line.range, line.range);

                        focused_class.children.push(symbol);
                        symbols_flat.push(symbol);
                        field_ended = false;
                    }
                    else if (coqreg.reg_key_class.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Class,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        symbols_flat.push(symbol);
                        focused_class = symbol;
                        def_stack.push(symbol);
                    }
                    else if (coqreg.reg_key_record.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Struct,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        symbols_flat.push(symbol);
                        focused_class = symbol;
                        def_stack.push(symbol);
                    }
                    else if (coqreg.reg_key_ltac.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Property,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        symbols_flat.push(symbol);
                        def_stack.push(symbol);
                    }
                    else if (coqreg.reg_key_assumption_plural.test(tokens[0]))
                    {
                        let ident_names = line.text.trim().substring(tokens[0].length).trim().match(coqreg.reg_idents);
                        if (ident_names !== null && ident_names.join("") !== "")
                        {
                            ident_names[0].trim().split(" ").forEach(ident_name => {
                                let symbol = new vscode.DocumentSymbol(
                                    ident_name.trim(),
                                    CoqDocumentSymbolProvider.to_singular(tokens[0]),
                                    vscode.SymbolKind.TypeParameter,
                                    line.range, line.range);

                                nodes[nodes.length-1].push(symbol);
                                symbols_flat.push(symbol);
                                def_stack.push(symbol);
                            });
                        }
                        ident_names = line.text.trim().substring(tokens[0].length).trim().match(coqreg.reg_idents_with_parenth);
                        if (ident_names !== null && ident_names.join("") !== "")
                        {
                            // console.debug(ident_names.join("").replace(/\(/g, " ",).replace(/:/g, " ").trim().split(" "));
                            ident_names.join("").replace(/\(/g, " ",).replace(/:/g, " ").trim().split(" ").forEach(ident_name => {
                                if(ident_name !== "")
                                {
                                    let symbol = new vscode.DocumentSymbol(
                                        ident_name.trim(),
                                        CoqDocumentSymbolProvider.to_singular(tokens[0]),
                                        vscode.SymbolKind.TypeParameter,
                                        line.range, line.range);
    
                                    nodes[nodes.length-1].push(symbol);
                                    symbols_flat.push(symbol);
                                    def_stack.push(symbol);
                                }
                            });
                        }
                    }
                    else if (coqreg.reg_key_assumption_singular.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.TypeParameter,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        symbols_flat.push(symbol);
                        def_stack.push(symbol);
                    }

                    // add with definition
                    if (def_stack.length > 0 && coqreg.reg_key_with.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            def_stack[def_stack.length-1].detail,
                            def_stack[def_stack.length-1].kind,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        symbols_flat.push(symbol);
                        def_stack.push(symbol);
                    }
                }
                
                // above keywords are leading ones in a line, guaranteed not in comment
                // calculate the comment level, only count definition end and theorem end when it is at 0 level
                // let cnt_comment_l = line.text.match(coqreg.reg_comment_l)?.length;
                // let cnt_comment_r = line.text.match(coqreg.reg_comment_r)?.length;
                // cnt_comment += (cnt_comment_l === undefined?0:cnt_comment_l) - (cnt_comment_r === undefined?0:cnt_comment_r);
                let comment_item;
                while ((comment_item = coqreg.reg_comment.exec(line.text)) !== null)
                {
                    cnt_comment += (comment_item[0] === "(*") ? 1 : -1;
                }

                if (focused_class !== null && !field_ended && cnt_comment <= 0 && coqreg.reg_field_end.test(line.text.trim()))
                {
                    let symbol = focused_class.children[focused_class.children.length - 1];
                    symbol.range = new vscode.Range(
                        symbol.range.start, line.range.end
                    );
                    field_ended = true;
                }
                // below need to check separately for each line
                // so that a def/thm can close it at the same line it starts
                // it is also safe since we check the stack length
                if (def_stack.length > 0 && cnt_comment <= 0 && coqreg.reg_key_def_end.test(line.text.trim()))
                {
                    while (def_stack.length > 0)
                    {
                        let symbol = def_stack[def_stack.length - 1];
                        symbol.range = new vscode.Range(
                            symbol.range.start, line.range.end
                        );
                        def_stack.pop();
                    }
                    // a class definition ends after a period
                    if (focused_class !== null)
                    {
                        // end the trailing field if not ended
                        if (!field_ended)
                        {
                            let symbol = focused_class.children[focused_class.children.length - 1];
                            symbol.range = new vscode.Range(
                                symbol.range.start, line.range.end
                            );
                            field_ended = true;
                        }
                        focused_class = null;
                    }
                    if (focused_inductive !== null)
                    {
                        focused_inductive = null;
                    }
                }
                if (thm_stack.length > 0 && cnt_comment <= 0 && coqreg.reg_key_thm_end.test(line.text.trim()))
                {
                    let symbol = thm_stack[thm_stack.length - 1];
                    symbol.range = new vscode.Range(
                        symbol.range.start, line.range.end
                    );
                    thm_stack.pop();
                }
            }

            resolve([symbols, symbols_flat]);
        });
    }
}

// export class CoqDefinitionProvider implements vscode.DefinitionProvider{
    
//     provideDefinition(
//         document: vscode.TextDocument,
//         position: vscode.Position,
//         token: vscode.CancellationToken): Promise<vscode.Definition | vscode.LocationLink[]> {
//         return new Promise((resolve, reject) => {
//             let range = document.getWordRangeAtPosition(position, reg_ident);
//             let target = document.getText(range);
//             if (target === null){
//                 reject();
//             }
            
//             vscode.workspace.textDocuments.forEach(
//                 (doc) => {
//                     // doc.getText().search()
//                 }
//             );

//             let loc = new vscode.Location(document.uri, position);
            
//             resolve(loc);
//         });
//     }
// }