(module
  (func $fd_write (import "wasi_unstable" "fd_write") (param i32 i32 i32 i32) (result i32))
  (func $proc_exit (import "wasi_unstable" "proc_exit") (param i32))
  (memory $mem (export "memory") 1)
  (func $putChar (param $ptr i32)
    ;; Update pointer in iovec
    (i32.store (i32.const 0x7558) (local.get $ptr))
    ;; Ignore errors
    (drop
      ;; Call fd_write with that iovec
      (call $fd_write
        (i32.const 1) ;; fd, 1 = stdout
        (i32.const 0x7558) (i32.const 1) ;; *iovs, iovs_len
        (i32.const 0x7560) ;; where to write written count
      )
    )
  )
  (func $memoryError
    ;; Report about the invalid memory access and exit
    (drop
      (call $fd_write
        (i32.const 2) ;; fd, 2 = stderr
        (i32.const 0x754c) (i32.const 1) ;; *iovs, iovs_len
        (i32.const 0x7554) ;; where to write written count
      )
    )
    (call $proc_exit (i32.const 1))
  )
  (func (export "_start")
    (local $ptr i32)
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const 8))
    )
    (loop
      (if (i32.load8_u (local.get $ptr)) (then
        (local.set $ptr
          (i32.add (local.get $ptr) (i32.const 1))
        )
        (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
        (i32.store8 (local.get $ptr)
          (i32.add (i32.load8_u (local.get $ptr)) (i32.const 4))
        )
        (loop
          (if (i32.load8_u (local.get $ptr)) (then
            (local.set $ptr
              (i32.add (local.get $ptr) (i32.const 1))
            )
            (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
            (i32.store8 (local.get $ptr)
              (i32.add (i32.load8_u (local.get $ptr)) (i32.const 2))
            )
            (local.set $ptr
              (i32.add (local.get $ptr) (i32.const 1))
            )
            (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
            (i32.store8 (local.get $ptr)
              (i32.add (i32.load8_u (local.get $ptr)) (i32.const 3))
            )
            (local.set $ptr
              (i32.add (local.get $ptr) (i32.const 1))
            )
            (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
            (i32.store8 (local.get $ptr)
              (i32.add (i32.load8_u (local.get $ptr)) (i32.const 3))
            )
            (local.set $ptr
              (i32.add (local.get $ptr) (i32.const 1))
            )
            (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
            (i32.store8 (local.get $ptr)
              (i32.add (i32.load8_u (local.get $ptr)) (i32.const 1))
            )
            (if (i32.gt_u (i32.const 4) (local.get $ptr)) (then (call $memoryError)))
            (local.set $ptr
              (i32.add (local.get $ptr) (i32.const -4))
            )
            (i32.store8 (local.get $ptr)
              (i32.add (i32.load8_u (local.get $ptr)) (i32.const -1))
            )
            (br 1)
          ))
        )
        (local.set $ptr
          (i32.add (local.get $ptr) (i32.const 1))
        )
        (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
        (i32.store8 (local.get $ptr)
          (i32.add (i32.load8_u (local.get $ptr)) (i32.const 1))
        )
        (local.set $ptr
          (i32.add (local.get $ptr) (i32.const 1))
        )
        (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
        (i32.store8 (local.get $ptr)
          (i32.add (i32.load8_u (local.get $ptr)) (i32.const 1))
        )
        (local.set $ptr
          (i32.add (local.get $ptr) (i32.const 1))
        )
        (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
        (i32.store8 (local.get $ptr)
          (i32.add (i32.load8_u (local.get $ptr)) (i32.const -1))
        )
        (local.set $ptr
          (i32.add (local.get $ptr) (i32.const 2))
        )
        (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
        (i32.store8 (local.get $ptr)
          (i32.add (i32.load8_u (local.get $ptr)) (i32.const 1))
        )
        (loop
          (if (i32.load8_u (local.get $ptr)) (then
            (if (i32.gt_u (i32.const 1) (local.get $ptr)) (then (call $memoryError)))
            (local.set $ptr
              (i32.add (local.get $ptr) (i32.const -1))
            )
            (br 1)
          ))
        )
        (if (i32.gt_u (i32.const 1) (local.get $ptr)) (then (call $memoryError)))
        (local.set $ptr
          (i32.add (local.get $ptr) (i32.const -1))
        )
        (i32.store8 (local.get $ptr)
          (i32.add (i32.load8_u (local.get $ptr)) (i32.const -1))
        )
        (br 1)
      ))
    )
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const 2))
    )
    (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
    (call $putChar (local.get $ptr))
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const 1))
    )
    (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const -3))
    )
    (call $putChar (local.get $ptr))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const 7))
    )
    (call $putChar (local.get $ptr))
    (call $putChar (local.get $ptr))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const 3))
    )
    (call $putChar (local.get $ptr))
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const 2))
    )
    (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
    (call $putChar (local.get $ptr))
    (if (i32.gt_u (i32.const 1) (local.get $ptr)) (then (call $memoryError)))
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const -1))
    )
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const -1))
    )
    (call $putChar (local.get $ptr))
    (if (i32.gt_u (i32.const 1) (local.get $ptr)) (then (call $memoryError)))
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const -1))
    )
    (call $putChar (local.get $ptr))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const 3))
    )
    (call $putChar (local.get $ptr))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const -6))
    )
    (call $putChar (local.get $ptr))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const -8))
    )
    (call $putChar (local.get $ptr))
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const 2))
    )
    (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const 1))
    )
    (call $putChar (local.get $ptr))
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const 1))
    )
    (if (i32.gt_u (local.get $ptr) (i32.const 29999)) (then (call $memoryError)))
    (i32.store8 (local.get $ptr)
      (i32.add (i32.load8_u (local.get $ptr)) (i32.const 2))
    )
    (call $putChar (local.get $ptr))
  )
  (data $mem (i32.const 0x7530)
    ;; Binaryen cannot parse multiline data strings :(
    "\4d\65\6d\6f\72\79\20\61\63\63\65\73\73\20\6f\75\74\20\6f\66\20\62\6f\75\6e\64\73\0a\30\75\00\00\1c\00\00\00\00\00\00\00\00\00\00\00\01"
    ;; 00007530: 4d 65 6d 6f 72 79 20 61 63 63 65 73 73 20 6f 75  Memory access ou
    ;; 00007540: 74 20 6f 66 20 62 6f 75 6e 64 73 0a 30 75 00 00  t of bounds.0u..
    ;; 00007550: 1c 00 00 00 00 00 00 00 00 00 00 00 01           .............
  )
)
