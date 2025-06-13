use std::io::Write;

fn main() {
    // Create a new hasher
    let mut hasher = reference_impl::Hasher::new();
    
    // Update with empty input
    hasher.update(b"");
    
    // Create a buffer for the output
    let mut output = [0u8; 32];
    
    // Get the hash
    hasher.finalize(&mut output);
    
    // Print the hash in hex format
    let mut stdout = std::io::stdout();
    for byte in output {
        write!(stdout, "{:02x}", byte).unwrap();
    }
    println!();
} 