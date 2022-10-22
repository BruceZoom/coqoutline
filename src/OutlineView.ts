
'use strict';

import { assert, debug } from 'console';
// src/extension.ts

import * as vscode from 'vscode';

const key_region_start = "Section|Module Type|Module";
const key_region_end = "End";
// theorems need to be closed by key_thm_end
const key_theorem = "Theorem|Lemma|Remark|Fact|Corollary|Property|Proposition|Goal";
const key_thm_end = "(Qed|Admitted|Abort)\\.";
// belows need to be closed by key_def_end
const key_definition = "Program Definition|Program Fixpoint|Program CoFixpoint|Program Function|Function|CoFixpoint|Fixpoint|Definition|Example|Let|CoInductive|Inductive";
const key_class = "Class";
const key_record = "Record";
const key_ltac = "Ltac";
const key_assumption_plural = "Parameters|Axioms|Conjectures|Variables|Hypotheses";
const key_assumption_singular = "Parameter|Axiom|Conjecture|Variable|Hypothesis";
const key_assumption = key_assumption_plural + "|" + key_assumption_singular;
const key_def_end = "\\.";
const key_with = "with";
const ident = "[a-zA-Z_][a-zA-Z0-9_']*";
const idents = "([a-zA-Z_][a-zA-Z0-9_'\\s]*)*";
const idents_with_parenth = "\\(\\s*[a-zA-Z_][a-z-A-Z0-9_'\\s]*:";

const reg_key = RegExp("^(" + [
                    key_region_start, key_region_end, key_definition, key_theorem,
                    key_class, key_record, key_ltac, key_assumption, key_with
                ].join('|') + ")\\s+");
// included in key
const reg_key_region_start = RegExp("(" + key_region_start + ")");
const reg_key_region_end = RegExp("(" + key_region_end + ")");
const reg_key_definition = RegExp("(" + key_definition + ")");
const reg_key_theorem = RegExp("(" + key_theorem + ")");
const reg_key_class = RegExp("(" + key_class + ")");
const reg_key_record = RegExp("(" + key_record + ")");
const reg_key_ltac = RegExp("(" + key_ltac + ")");
const reg_key_assumption_singular = RegExp("(" + key_assumption_singular + ")");
const reg_key_assumption_plural = RegExp("(" + key_assumption_plural + ")");
const reg_key_with = RegExp("(" + key_with + ")");
// not included in key
const reg_key_def_end = RegExp("(" + key_def_end + ")$");
const reg_key_thm_end = RegExp("(" + key_thm_end + ")$");

const reg_ident = RegExp("(" + ident + ")");
const reg_idents = RegExp("(" + idents + ")");
const reg_idents_with_parenth = RegExp("(" + idents_with_parenth + ")", "g");

const reg_field = RegExp("(^" + ident + ")");
const reg_field_end = RegExp(";$");

const reg_comment_l = /\(\*/g;
const reg_comment_r = /([^\(]\*\))|(^\*\))/g;

export class CoqDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    private static parse(line: string): [string, string]
    {
        let rkey = line.match(reg_key);
        if (rkey === null) {
            return ["", ""];
        }
        // console.debug(rkey);
        let rname = line.substring(rkey[0].length).match(reg_ident);
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

    
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> 
    {
        return new Promise((resolve, reject) => 
        {
            let symbols: vscode.DocumentSymbol[] = [];
            let nodes = [symbols];
            let node_ids = [""];
            
            let def_stack: vscode.DocumentSymbol[] = [];
            let thm_stack: vscode.DocumentSymbol[] = [];
            
            let cnt_comment = 0;

            let focused_class: vscode.DocumentSymbol | null = null;
            let field_ended = true;

            for (var lnum = 0; lnum < document.lineCount; lnum++) {
                assert(nodes.length === node_ids.length, "Hierarchy level mismatch.");
                
                var line = document.lineAt(lnum);
                
                let tokens = CoqDocumentSymbolProvider.parse(line.text.trim());
                // console.debug("hierarchy:" + node_ids);
                // console.debug("cur token:" + tokens);
                let field = line.text.trim().match(reg_field);
                
                // if outside comment block
                if (cnt_comment <= 0)
                {
                    if (reg_key_region_start.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            "Section" === tokens[0] ?
                                vscode.SymbolKind.Namespace:
                                vscode.SymbolKind.Module,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        
                        // exclude module inheritance
                        if ("Module" !== tokens[0] || !line.text.includes(":="))
                        {
                            nodes.push(symbol.children);
                            node_ids.push(tokens[1]);
                        }
                        // console.debug("push: " + tokens[1]);
                    }
                    else if (reg_key_region_end.test(tokens[0]))
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
                    else if (reg_key_definition.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Field,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        def_stack.push(symbol);
                    }
                    else if (reg_key_theorem.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Interface,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
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
                        field_ended = false;
                    }
                    else if (reg_key_class.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Class,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        focused_class = symbol;
                        def_stack.push(symbol);
                    }
                    else if (reg_key_record.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Struct,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        focused_class = symbol;
                        def_stack.push(symbol);
                    }
                    else if (reg_key_ltac.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.Property,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        def_stack.push(symbol);
                    }
                    else if (reg_key_assumption_plural.test(tokens[0]))
                    {
                        let ident_names = line.text.trim().substring(tokens[0].length).trim().match(reg_idents);
                        if (ident_names !== null && ident_names.join("") !== "")
                        {
                            ident_names[0].trim().split(" ").forEach(ident_name => {
                                let symbol = new vscode.DocumentSymbol(
                                    ident_name.trim(),
                                    CoqDocumentSymbolProvider.to_singular(tokens[0]),
                                    vscode.SymbolKind.TypeParameter,
                                    line.range, line.range);

                                    nodes[nodes.length-1].push(symbol);
                                    def_stack.push(symbol);
                            });
                        }
                        ident_names = line.text.trim().substring(tokens[0].length).trim().match(reg_idents_with_parenth);
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
                                    def_stack.push(symbol);
                                }
                            });
                        }
                    }
                    else if (reg_key_assumption_singular.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            tokens[0],
                            vscode.SymbolKind.TypeParameter,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        def_stack.push(symbol);
                    }

                    // add with definition
                    if (def_stack.length > 0 && reg_key_with.test(tokens[0]))
                    {
                        let symbol = new vscode.DocumentSymbol(
                            tokens[1],
                            def_stack[def_stack.length-1].detail,
                            def_stack[def_stack.length-1].kind,
                            line.range, line.range);

                        nodes[nodes.length-1].push(symbol);
                        def_stack.push(symbol);
                    }
                }
                
                // above keywords are leading ones in a line, guaranteed not in comment
                // calculate the comment level, only count definition end and theorem end when it is at 0 level
                let cnt_comment_l = line.text.match(reg_comment_l)?.length;
                let cnt_comment_r = line.text.match(reg_comment_r)?.length;
                cnt_comment += (cnt_comment_l === undefined?0:cnt_comment_l) - (cnt_comment_r === undefined?0:cnt_comment_r);

                if (focused_class !== null && !field_ended && cnt_comment <= 0 && reg_field_end.test(line.text.trim()))
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
                if (def_stack.length > 0 && cnt_comment <= 0 && reg_key_def_end.test(line.text.trim()))
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
                }
                if (thm_stack.length > 0 && cnt_comment <= 0 && reg_key_thm_end.test(line.text.trim()))
                {
                    let symbol = thm_stack[thm_stack.length - 1];
                    symbol.range = new vscode.Range(
                        symbol.range.start, line.range.end
                    );
                    thm_stack.pop();
                }
            }

            resolve(symbols);
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