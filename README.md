## Features

The extension enables the outline view for Coq files.
The hierarchy is also displayed on top of the text editor to track the location of your cursor.

The outline view is in the explorer tab to the left.

To open outline view in case it is closed, click View > Open View, and search for "outline".

## Dos and Don'ts
- Any name should be in the same line as its key word. For example,
```coq
(* OK *)
Definition name ...
(* NOT OK *)
Definition
    name ...
```

## Bugs & Todos

- multiple assumptions by one key word.
- the `with` keyword
