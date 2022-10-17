
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
const key_assumption = "Parameters?|Axioms?|Conjectures?|Variables?|Hypothesis|Hypotheses";
const key_def_end = "\\.";
const ident = "[a-zA-Z_][a-zA-Z0-9_']*";

const reg_key = RegExp("^(" + [
                    key_region_start, key_region_end, key_definition, key_theorem,
                    key_class, key_record, key_ltac, key_assumption
                ].join('|') + ")\\s+");
const reg_key_region_start = RegExp("(" + key_region_start + ")");
const reg_key_region_end = RegExp("(" + key_region_end + ")");
const reg_key_definition = RegExp("(" + key_definition + ")");
const reg_key_theorem = RegExp("(" + key_theorem + ")");
const reg_key_class = RegExp("(" + key_class + ")");
const reg_key_record = RegExp("(" + key_record + ")");
const reg_key_ltac = RegExp("(" + key_ltac + ")");
const reg_key_assumption = RegExp("(" + key_assumption + ")");
const reg_key_def_end = RegExp("(" + key_def_end + ")$");
const reg_key_thm_end = RegExp("(" + key_thm_end + ")$");
const reg_name = RegExp("(" + ident + ")");

export class CoqDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    private parse(line: string): [string, string]
    {
        
        let rkey = line.match(reg_key);
        if (rkey === null) {
            return ["", ""];
        }
        // console.debug(rkey);
        
        let rname = line.substring(rkey[0].length).match(reg_name);
        // console.debug(rname);
        if (rname === null) {
            return [rkey[1], ""];
        }
        return [rkey[1], rname[1]];
    }

    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> 
        {
        return new Promise((resolve, reject) => 
        {
            let symbols: vscode.DocumentSymbol[] = [];
            let nodes = [symbols];
            let node_ids = [""];
            let def_stack: vscode.DocumentSymbol[] = [];
            let thm_stack: vscode.DocumentSymbol[] = [];
            // let node_parent : vscode.DocumentSymbol[] = [vscode.DocumentSymbol.prototype];

            for (var lnum = 0; lnum < document.lineCount; lnum++) {
                assert(nodes.length === node_ids.length, "Hierarchy level mismatch.");
                
                var line = document.lineAt(lnum);
                
                let tokens = this.parse(line.text.trim());
                // console.debug("hierarchy:" + node_ids);
                // console.debug("cur token:" + tokens);

                if (reg_key_region_start.test(tokens[0]))
                {
                    let symbol = new vscode.DocumentSymbol(
                        tokens[1],
                        tokens[0],
                        /Section/.test(tokens[0]) ?
                            vscode.SymbolKind.Namespace:
                            vscode.SymbolKind.Module,
                        line.range, line.range);

                    nodes[nodes.length-1].push(symbol);
                    
                    nodes.push(symbol.children);
                    node_ids.push(tokens[1]);
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
                else if (reg_key_class.test(tokens[0]))
                {
                    let symbol = new vscode.DocumentSymbol(
                        tokens[1],
                        tokens[0],
                        vscode.SymbolKind.Class,
                        line.range, line.range);

                    nodes[nodes.length-1].push(symbol);
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
                else if (reg_key_assumption.test(tokens[0]))
                {
                    let symbol = new vscode.DocumentSymbol(
                        tokens[1],
                        tokens[0],
                        vscode.SymbolKind.TypeParameter,
                        line.range, line.range);

                    nodes[nodes.length-1].push(symbol);
                    def_stack.push(symbol);
                }
                
                // below need to check separately for each line
                // so that a def/thm can close it at the same line it starts
                // it is also safe since we check the stack length
                if (def_stack.length > 0 && reg_key_def_end.test(line.text.trim()))
                {
                    console.debug(line);
                    let symbol = def_stack[def_stack.length - 1];
                    symbol.range = new vscode.Range(
                        symbol.range.start, line.range.end
                    );
                    def_stack.pop();
                }
                if (thm_stack.length > 0 && reg_key_thm_end.test(line.text.trim()))
                {
                    console.debug(line);
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