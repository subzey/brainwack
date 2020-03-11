for fn in $(ls *.bf)
do
	base="${fn%.*}"
	echo "Compiling ${fn}..."
	deno --allow-read --allow-write ../index.ts ${fn}\
		--output ${base}.wat\
		--sourcemap ${base}.wat.map

	echo "Optimizing and converting to binary..."
	npx -p binaryen wasm-opt -O4 -c ${base}.wat -o ${base}.wasm
	wc -c ${base}.wasm

	echo "Running..."
	wasmer run ${base}.wasm

	echo $'\n'
done
