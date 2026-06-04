// Runs a CLI entrypoint: invoke the main fn, print any uncaught error to stderr, exit non-zero.
export function runCli(main: () => Promise<void>): void {
	main().catch((error: unknown) => {
		console.error(error)
		process.exit(1)
	})
}