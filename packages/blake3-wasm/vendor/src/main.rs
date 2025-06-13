use std::io::Write;

fn main() {
    println!("Starting BLAKE3 hash computation for empty input");
    
    // Create a new hasher
    let mut hasher = reference_impl::Hasher::new();
    println!("Created new hasher");
    
    // Update with empty input
    let input = &[0u8, 1u8];
    println!("Input length: {} bytes", input.len());
    hasher.update(input);
    println!("Updated hasher with input");
    
    // Create a buffer for the output
    let mut output = [0u8; 32];
    
    // Get the hash
    hasher.finalize(&mut output);
    println!("Finalized hash computation");
    
    // Print the hash in hex format
    let mut stdout = std::io::stdout();
    print!("Final hash: ");
    for byte in output {
        write!(stdout, "{:02x}", byte).unwrap();
    }
    println!();
} 