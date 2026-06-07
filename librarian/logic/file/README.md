Use one file per use case
Each file should receive input and return output
It can use the DB Layer as is
It can process complex flows
It can reference other logic items
It should not be aware of external details like the protocol that's being used or the engine used to store files.
It should be agnostic to details as much as possible.
It should not contain SQL Queries
Queries should go in the DB Layer

Basically it will know how to call lower level layers using abstractions
