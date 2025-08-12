# BLAKE3 Example

This is a simple example that demonstrates using the BLAKE3 hash function with empty input.

## Prerequisites

- Rust and Cargo installed on your system. You can install them from [rustup.rs](https://rustup.rs/)

## Running the Example

1. Open a terminal in this directory
2. Run the following command:
   ```bash
   cargo run
   ```

The program will output a 32-byte hash in hexadecimal format. For empty input, the expected output should be:
```
af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262
```

## What the Code Does

1. Creates a new BLAKE3 hasher
2. Updates it with empty input
3. Finalizes the hash into a 32-byte buffer
4. Prints the hash in hexadecimal format 