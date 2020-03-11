# BrainWAck - a Brainfuck to WA compiler

**This is Work in Progress. Do not use it in production!**

In case you have a production grade Brainfuck programs, of course.

## How to Run It

BrainWAck is a [deno](https://deno.land/) script.

Run `deno index.ts --help` for more info.

The result is a WAT (WebAssembly Text) file. Some WASI runtimes like [wasmer](https://wasmer.io/) or [wasmtime](https://wasmtime.dev/) can execute WA both in text and binary format.

```sh
wasmer run the_output_file.wat
wasmtime run the_output_file.wat
```

Other runtimes may accept only the binary format. Try [wat2wasm](https://github.com/WebAssembly/wabt) or [wasm-opt](https://github.com/WebAssembly/binaryen).

## The Gist

[Brainfuck](https://esolangs.org/wiki/Brainfuck) is an esoteric programming language with a very small instruction set.

The [WebAssembly instruction set](https://webassembly.org/docs/semantics/) is also pretty small. Basically it's just a bare minimum to make a functional program with no (or almost no) syntactic sugar.

Although it is possible to write a Brainfuck interpreter in WA, it's not really an iteresting stuff to do.

BrainWAck is a Brainfuck *compiler* instead. It means, every BF instruction is mapped to native WA ones.

## Instructions Mapping

### Advance Pointer Instructions

The `>` and `<` increments and decrements the internal pointer.

Assuming there is a local variable `$ptr` is declared, WA code that corresponds to the `>` is:

```wat
;; In stacked form
(local.get $ptr) ;; Read the $ptr value onto the stack
(i32.const 1) ;; Place 1 onto the stack
(i32.add) ;; Get two values from the stack, add them and place onto the stack
(local.set $ptr) ;; Store the value as the new $ptr value
```

```wat
;; Equivalent: In S-expression form
(local.set $ptr
	(i32.add
		(local.get $ptr)
		(i32.const 1)
	)
)

```

For `<` we just add `-1`.

| Brainfuck instruction | WebAssembly instructions |
| --------------------- | ----------------------- |
| `>` | `(local.set $ptr ... )` |
| `<` | `(local.set $ptr ... )` |

### Increment/Decrement Values

The `+` and `-` increments and decrements the value in a current cell. The current cell is that the internal pointer points to.

The code for `+` looks similar to the one for `>` , but instead of incrementing the _pointer_ we increment the _value in memeory on that pointer_:

```wat
(i32.store8 (local.get $ptr)
	(i32.add
		(i32.load8_u (local.get $ptr))
		(i32.const 1)
	)
)
```

| Brainfuck instruction | WebAssembly instructions |
| --------------------- | ----------------------- |
| `+` | `(local.store8 (local.get $ptr ... ))` |
| `-` | `(local.store8 (local.get $ptr ... ))` |

### Loops

The loop in BF, `[` ... `]`, is entered then the current cell value is nonzero, exited when it is zero.

The corresponding WA code is:

```wat
(loop $the_loop
	(if (i32.load8_u (local.get $ptr))
		(then
			;; loop contents
			(br $the_loop) ;; `br`anch the loop means, to continue it
		)
	)
)

```

| Brainfuck instruction | WebAssembly instructions |
| --------------------- | ----------------------- |
| `[` | `(loop (if ...` |
| `]` | `))` |


### IO

`.` and `,` inputs and outputs the value from/into the current cell.

Unfortunately, the WebAssembly spec doesn't define a standardized way a module would input or output the data.

Luckily, [WASI](https://wasi.dev/) does.

The code for `.` is... not so easy to grasp, but it's not so hard.

Assuming the WASI `fd_read` is imported as `$fd_read`.

```wat
;; First, declare an IO vector in a WA memory that describes
;; the portion of a memory that would be output
;; For this example, the iovec will start on offset 0x1234
;; For this example, the actual written bytes count in stored to offset 0x5678

(i32.store
	(i32.const 0x1234)
	;; The binary data to output starts at $ptr
	(local.get $ptr)
)
(i32.store
	(i32.const 0x1238) ;; 0x1234 + 4
	;; The binary data to output is 1 byte long
	(local.get 1)
)
(call $fd_write
	(i32.const 1) ;; 1 = stdout, like POSIX
	(i32.const 0x1234) ;; The address of an iovec
	(i32.const 1) ;; The length of iovec (# of IO records)
	(i32.const 0x5678) ;; Where to write a # of actually written bytes
)
;; Ignore write errors
(drop)
```

And it's time to finalize the table:

| Brainfuck instruction | WebAssembly instructions |
| --------------------- | ----------------------- |
| `.` | `(call $fd_write (i32.const 1) ... )` |
| `,` | `(call $fd_read (i32.const 0) ... )` |

## Compilation

### Tokenizer

The Brainfuck tokenization is straightforward. A tokenizer returns an `Iterable` of tokens `+`, `>`, etc, with theit source code location.

### Parser

The parser constructs an abstract syntax tree (AST) for the further usage.

Some syntax errors like unbalanced `[]` are emmitted at this stage.

### Optimizer

The optimizer modifies the AST and prepares it for the code generation.

For example, it would be too wasteful to encode `>>>` as

```wat
(local.set $ptr (i32.add (local.get $ptr) (i32.const 1)))
(local.set $ptr (i32.add (local.get $ptr) (i32.const 1)))
(local.set $ptr (i32.add (local.get $ptr) (i32.const 1)))
```

The optimized merges these instructions into a single one. That instruction cannot occur in a Brainfuck source, but that's okay.

### Dependency Resolver

Analyzes the AST and extracts the information for the code generator.

For example, we don't have to import a `fd_read` from WASI if a program doesn't read anything.

### Memory Layout

Lays out the WA memory based on program dependencies. All those Iovecs and pointers should be assigned some values. It happens here.

### Code Generation & Source Mapping

Generates a WebAssembly code based on everything happened before.

Plus, a source map, [like this one](https://sokra.github.io/source-map-visualization/#base64,KG1vZHVsZQogIChmdW5jICRmZF93cml0ZSAoaW1wb3J0ICJ3YXNpX3Vuc3RhYmxlIiAiZmRfd3JpdGUiKSAocGFyYW0gaTMyIGkzMiBpMzIgaTMyKSAocmVzdWx0IGkzMikpCiAgKGZ1bmMgJHByb2NfZXhpdCAoaW1wb3J0ICJ3YXNpX3Vuc3RhYmxlIiAicHJvY19leGl0IikgKHBhcmFtIGkzMikpCiAgKG1lbW9yeSAkbWVtIChleHBvcnQgIm1lbW9yeSIpIDEpCiAgKGZ1bmMgJHB1dENoYXIgKHBhcmFtICRwdHIgaTMyKQogICAgOzsgVXBkYXRlIHBvaW50ZXIgaW4gaW92ZWMKICAgIChpMzIuc3RvcmUgKGkzMi5jb25zdCAweDc1MzApIChsb2NhbC5nZXQgJHB0cikpCiAgICA7OyBJZ25vcmUgZXJyb3JzCiAgICAoZHJvcAogICAgICA7OyBDYWxsIGZkX3dyaXRlIHdpdGggdGhhdCBpb3ZlYwogICAgICAoY2FsbCAkZmRfd3JpdGUKICAgICAgICAoaTMyLmNvbnN0IDEpIDs7IGZkLCAxID0gc3Rkb3V0CiAgICAgICAgKGkzMi5jb25zdCAweDc1MzApIChpMzIuY29uc3QgMSkgOzsgKmlvdnMsIGlvdnNfbGVuCiAgICAgICAgKGkzMi5jb25zdCAweDc1MzgpIDs7IHdoZXJlIHRvIHdyaXRlIHdyaXR0ZW4gY291bnQKICAgICAgKQogICAgKQogICkKICAoZnVuYyAoZXhwb3J0ICJfc3RhcnQiKQogICAgKGxvY2FsICRwdHIgaTMyKQogICAgKGkzMi5zdG9yZTggKGxvY2FsLmdldCAkcHRyKQogICAgICAoaTMyLmFkZCAoaTMyLmxvYWQ4X3UgKGxvY2FsLmdldCAkcHRyKSkgKGkzMi5jb25zdCAzKSkKICAgICkKICAgIChsb29wCiAgICAgIChpZiAoaTMyLmxvYWQ4X3UgKGxvY2FsLmdldCAkcHRyKSkgKHRoZW4KICAgICAgICAoaTMyLnN0b3JlOCAobG9jYWwuZ2V0ICRwdHIpCiAgICAgICAgICAoaTMyLmFkZCAoaTMyLmxvYWQ4X3UgKGxvY2FsLmdldCAkcHRyKSkgKGkzMi5jb25zdCAtMSkpCiAgICAgICAgKQogICAgICAgIChjYWxsICRwdXRDaGFyIChsb2NhbC5nZXQgJHB0cikpCiAgICAgICAgKGJyIDEpCiAgICAgICkpCiAgICApCiAgKQogIChkYXRhICRtZW0gKGkzMi5jb25zdCAweDc1MzQpCiAgICAiXDAxIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA7OyAwMDAwNzUzMDogICAgIC4KICApCikK,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJyYWluZnVjay1zb3VyY2UuYmYiXSwic291cmNlc0NvbnRlbnQiOlsiKysrWy0uXSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQUE7TUFBQTtJQUFBO0lBQUc7TUFBQTtRQUFDO1VBQUE7UUFBQTtRQUFDO1FBQUM7TUFBSDtJQUFBIiwiZmlsZSI6ImV4YW1wbGUuanMifQ==,KysrWy0uXQ==).
