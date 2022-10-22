## Features

The extension enables the outline view for Coq files.
The hierarchy is also displayed on top of the text editor to track the location of your cursor.

The outline view is in the explorer tab to the left.

To open outline view in case it is closed, click View > Open View, and search for "outline".

## Dos and Don'ts
- Comments should be in separate lines from your code.
    ```coq
    (* NOT OK *)
    (* comment *) Definition (* comment *) code ... (* comment *)
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
- Nested definitions are not allowed.
- `with` should be treated the same as other key words, i.e., it should at the begging of a new line like
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
- Fields in classes and records are now supported. But field definitions should be in different lines of class names or record names, and each field definition should leads a new line.
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
- When defining a module through inheritance, the entire definition should be put in the same line.
    ```coq
    (* OK *)
    Module A := B.
    (* NOT OK *)
    Module A
        := B.
    ```
  
## Bugs & Todos

- [ ] does not support utf-8 characters
- [x] multiple assumptions by one key word.
- [x] the `with` keyword
- [ ] the range (end line) of program definitions may be wrong, no "Defined" token
- [x] incorrectly includes code in comments
