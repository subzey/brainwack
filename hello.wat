(module
	(func $fd_write (import "wasi_unstable" "fd_write") (param i32 i32 i32 i32) (result i32))
	(func $proc_exit (import "wasi_unstable" "proc_exit") (param i32))
	
	(memory $mem (export "memory") 1)

	(func $putChar (param $ptr i32)
		;; Update pointer in iovec
		(i32.store (i32.const 30000) (get_local $ptr))
		;; Call fd_write with that iovec
		(call $fd_write
			(i32.const 1) ;; fd, 1 = stdout
			(i32.const 30000) (i32.const 1) ;; *iovs, iovs_len
			(i32.const 30008) ;; where to write written count
		)
		;; Ignore errors
		(drop)
	)

	(func (export "_start")
		(local $ptr i32)
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 8) (i32.load8_u (get_local $ptr)))
		)
		(block (loop
			(br_if 1 (i32.eqz (i32.load8_u (get_local $ptr))))

			(set_local $ptr
				(i32.add (i32.const 1) (get_local $ptr))
			)
			(i32.store8 (get_local $ptr)
				(i32.add (i32.const 4) (i32.load8_u (get_local $ptr)))
			)
			(block (loop
				(br_if 1 (i32.eqz (i32.load8_u (get_local $ptr))))

				(set_local $ptr
					(i32.add (i32.const 1) (get_local $ptr))
				)
				(i32.store8 (get_local $ptr)
					(i32.add (i32.const 2) (i32.load8_u (get_local $ptr)))
				)
				(set_local $ptr
					(i32.add (i32.const 1) (get_local $ptr))
				)
				(i32.store8 (get_local $ptr)
					(i32.add (i32.const 3) (i32.load8_u (get_local $ptr)))
				)
				(set_local $ptr
					(i32.add (i32.const 1) (get_local $ptr))
				)
				(i32.store8 (get_local $ptr)
					(i32.add (i32.const 3) (i32.load8_u (get_local $ptr)))
				)
				(set_local $ptr
					(i32.add (i32.const 1) (get_local $ptr))
				)
				(i32.store8 (get_local $ptr)
					(i32.add (i32.const 1) (i32.load8_u (get_local $ptr)))
				)
				(set_local $ptr
					(i32.add (i32.const -4) (get_local $ptr))
				)
				(i32.store8 (get_local $ptr)
					(i32.add (i32.const 255) (i32.load8_u (get_local $ptr)))
				)
				(br 0)
			))
			(set_local $ptr
				(i32.add (i32.const 1) (get_local $ptr))
			)
			(i32.store8 (get_local $ptr)
				(i32.add (i32.const 1) (i32.load8_u (get_local $ptr)))
			)
			(set_local $ptr
				(i32.add (i32.const 1) (get_local $ptr))
			)
			(i32.store8 (get_local $ptr)
				(i32.add (i32.const 1) (i32.load8_u (get_local $ptr)))
			)
			(set_local $ptr
				(i32.add (i32.const 1) (get_local $ptr))
			)
			(i32.store8 (get_local $ptr)
				(i32.add (i32.const 255) (i32.load8_u (get_local $ptr)))
			)
			(set_local $ptr
				(i32.add (i32.const 2) (get_local $ptr))
			)
			(i32.store8 (get_local $ptr)
				(i32.add (i32.const 1) (i32.load8_u (get_local $ptr)))
			)
			(block (loop
				(br_if 1 (i32.eqz (i32.load8_u (get_local $ptr))))

				(set_local $ptr
					(i32.add (i32.const -1) (get_local $ptr))
				)
				(br 0)
			))
			(set_local $ptr
				(i32.add (i32.const -1) (get_local $ptr))
			)
			(i32.store8 (get_local $ptr)
				(i32.add (i32.const 255) (i32.load8_u (get_local $ptr)))
			)
			(br 0)
		))
		(set_local $ptr
			(i32.add (i32.const 2) (get_local $ptr))
		)
		(call $putChar (get_local $ptr))
		(set_local $ptr
			(i32.add (i32.const 1) (get_local $ptr))
		)
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 253) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 7) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(call $putChar (get_local $ptr))
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 3) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(set_local $ptr
			(i32.add (i32.const 2) (get_local $ptr))
		)
		(call $putChar (get_local $ptr))
		(set_local $ptr
			(i32.add (i32.const -1) (get_local $ptr))
		)
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 255) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(set_local $ptr
			(i32.add (i32.const -1) (get_local $ptr))
		)
		(call $putChar (get_local $ptr))
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 3) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 250) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 248) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(set_local $ptr
			(i32.add (i32.const 2) (get_local $ptr))
		)
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 1) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
		(set_local $ptr
			(i32.add (i32.const 1) (get_local $ptr))
		)
		(i32.store8 (get_local $ptr)
			(i32.add (i32.const 2) (i32.load8_u (get_local $ptr)))
		)
		(call $putChar (get_local $ptr))
	)

	(data (i32.const 30004)
		"\01"
	)
)
