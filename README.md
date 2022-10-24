# Coq Outline 
A VSCode extension that provides outline view for Coq files.

## Features
- Provide outline views for Coq files.
- Provide go to definition function to track Coq definitions.
- It supports following types of symbols.
  - Section/Module/Module Type as regions.
  - Modules instances as definitions.
  - (Program) Definition/Fixpoint/CoFixpoint/Function and so on.
  - (Co)Inductive definitions and their constructors.
  - Class/Record as aggregations of their fields.
  - Class/Record fields.
  - Ltac definitions.
  - Parameter/Axiom/Conjecture/Variable/Hypothesis and their plural variants.
  - Definitions by the `with` keyword.

## Screen Shots
- Screen shot of the outline view.
  ![](img/outline-screenshot.png)
- Screen shot of the context menu and peek definition.
  ![](img/context-screenshot.png)
  ![](img/peek-screenshot.png)

## Requirements
* VS Code 1.72.0, or more recent
* Coq 8.7.0, or more recent
* VSCoq 0.3.6

## Installation
The extension has not published yet.
To install a beta version, please go to [the Github Repo](https://github.com/BruceZoom/coqoutline) and download latest release.
Then, either press "Cmd-Shift-P" and "Extensions: Install from VSIX", or run `code --install-extension coqoutline-0.2.2.vsix` (or whatever version number) from your terminal.

## Instructions
- To open the outline view in case you have turned it off, click `View > Open View`, then search for and select `outline`.
- To lookup the definition of a symbol, right click the symbol and select `Go to Definition` or `Peek > Peek Definition` in the context menu.
  - It searches definition by string matching. As a result, it retrieves all definitions with the same name regardless of the context.

### Dos and Don'ts when writing Coq
The extension uses regular expressions to analyze Coq documents, thus not all Coq writing styles is accepted.
The followings are rules recommended when writing Coq with this extension.
Violating them may cause the extension analyze your Coq files in wrong ways.

- Comments should not be in the middle of a keyword and the symbol it defines.
    ```coq
    (* NOT OK *)
    Definition (* comment *) name ...
    ```
- Any name should be in the same line as its key word. And any keyword must be the first word in a line. For example,
    ```coq
    (* OK *)
    Definition name ...
    (* NOT OK *)
    Definition
        name ...
    (* NOT OK *)
    (* anything *) Definition name ...
    ```
<!-- - Nested definitions are not allowed. -->
- Keyword `with` should be treated the same as other key words and follows two rules above.
    ```coq
    (* OK *)
    Inductive a ...
        with b ...
    (* NOT OK *)
    Inductive a ... with b ...
    ```
- Allow multiple definitions of assumptions in the same line.
    ```coq
    (* OK *)
    Parameters a b c : Type.
    Parameters (a : Type) (b c: Type).
    (* NOT OK, only a and b will be parsed *)
    Parameters a b
        c : Type.
    ```
- Fields in classes and records are supported. But field definitions should be in different lines of class names or record names, and each field definition should leads a new line.
    ```coq
    (* OK *)
    Class A : Type := {
        x : Type;
        y: Type
    }.
    (* NOT OK *)
    (* should be put in two lines *)
    Class B : Type := { i : Type;
        (* should be put in two lines *)
        j: Type; k: Type
    }.
    ```
- Inductive definition and its constructors should not be put in the same line, and remember to put at least a white space between items.
  ```coq
  (* OK *)
  Inductive A: Type :=
  | A | B
  | C.
  (* NOT OK *)
  Inductive A: Type := | A
  | B| C.
  ```
- When defining a module instance, the `:=` symbol should be put in the same line as the keyword.
    ```coq
    (* OK *)
    Module A := B.
    (* NOT OK *)
    Module A
        := B.
    ```
- `Defined` is treated the same as `Qed`, no succeeding ident is allowed.
  
## Known Issues & ToDos

- [ ] does not support utf-8 characters
- [x] multiple assumptions by one key word.
- [x] the `with` keyword
- [x] the range (end line) of program definitions may be wrong, no "Defined" token
- [x] incorrectly includes code in comments
- [x] inductive constructors not handled
- [x] after renaming an open file, the outline view cannot display but definitions can already be located
