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

## Screenshots
- Screenshot of the outline view.
  ![outline-screenshot](https://user-images.githubusercontent.com/32293407/197471888-930fd668-c98a-403a-82ca-cc020b0f57dd.png)
- Screenshots of the context menu and peek definition.
  ![context-screenshot](https://user-images.githubusercontent.com/32293407/197471962-5a63c583-4365-4ec8-889d-a6888ea2b234.png)
  ![peek-screenshot](https://user-images.githubusercontent.com/32293407/197472015-6bca6f00-e1b0-4a95-a0fa-3f1501a14e86.png)

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
- [x] multiple assumptions by one key word. (supported)
- [x] the `with` keyword (supported)
- [x] the range (end line) of program definitions may be wrong, no "Defined" token (supported)
- [x] incorrectly includes code in comments (fixed)
- [x] inductive constructors not handled (fixed)
- [x] after renaming an open file, the outline view cannot display but definitions can already be located (fixed)
