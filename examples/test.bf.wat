(module
  (func $fd_write (import "wasi_unstable" "fd_write") (param i32 i32 i32 i32) (result i32))
  (func $proc_exit (import "wasi_unstable" "proc_exit") (param i32))
  (memory $mem (export "memory") 1)
  (func $putChar (param $ptr i32)
    ;; Update pointer in iovec
    (i32.store (i32.const 0x7530) (local.get $ptr))
    ;; Ignore errors
    (drop
      ;; Call fd_write with that iovec
      (call $fd_write
        (i32.const 1) ;; fd, 1 = stdout
        (i32.const 0x7530) (i32.const 1) ;; *iovs, iovs_len
        (i32.const 0x7538) ;; where to write written count
      )
    )
  )
  (func (export "_start")
    (local $ptr i32)
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const 3))
    )
    (loop
      (if (i32.load8_u (local.get $ptr)) (then
        (i32.store8 (local.get $ptr)
          (i32.add (i32.load8_u (local.get $ptr)) (i32.const -1))
        )
        (call $putChar (local.get $ptr))
        (br 1)
      ))
    )
  )
  (data $mem (i32.const 0x7534)
    "\01"                                  ;; 00007530:     .
  )
)