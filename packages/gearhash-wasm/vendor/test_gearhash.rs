use gearhash::{Hasher, DEFAULT_TABLE};

// Simple deterministic RNG for reproducible results (24-bit version)
struct SimpleRng {
    state: u32,
}

impl SimpleRng {
    fn new(seed: u32) -> Self {
        Self { state: seed & 0xFFFFFF } // Keep only 24 bits
    }
    
    fn next_u24(&mut self) -> u32 {
        // Simple 24-bit linear congruential generator
        // Using 24-bit arithmetic to avoid overflow
        self.state = (self.state.wrapping_mul(1111) + 12345) & 0xFFFFFF;
        self.state
    }
    
    fn fill_bytes(&mut self, dest: &mut [u8]) {
        for chunk in dest.chunks_mut(3) {
            let value = self.next_u24();
            for (i, byte) in chunk.iter_mut().enumerate() {
                *byte = ((value >> (i * 8)) & 0xFF) as u8;
            }
        }
    }
}

const BENCH_INPUT_SEED: u32 = 0xbecd17f;
const BENCH_MASK: u64 = 0x0000d90003530000;
const INPUT_SIZE: usize = 100_000;

fn generate_test_input() -> Vec<u8> {
    let mut bytes = vec![0u8; INPUT_SIZE];
    let mut rng = SimpleRng::new(BENCH_INPUT_SEED);
    rng.fill_bytes(&mut bytes);
    bytes
}

fn test_gearhash() {
    println!("Generating test input with seed: 0x{:x}", BENCH_INPUT_SEED);
    let input_buf = generate_test_input();
    println!("Input size: {} bytes", input_buf.len());
    println!("Mask: 0x{:x}", BENCH_MASK);
    
    let mut hasher = Hasher::new(&DEFAULT_TABLE);
    let mut offset = 0;
    let mut chunk_count = 0;
    let mut total_processed = 0;
    
    println!("\nProcessing chunks:");
    println!("Chunk | Offset | Size | Hash");
    println!("------|--------|------|------------------");
    
    while offset < input_buf.len() {
        let chunk_start = offset;
        
        if let Some(match_size) = hasher.next_match(&input_buf[offset..], BENCH_MASK) {
            offset += match_size;
            total_processed += match_size;
            chunk_count += 1;
            
            println!("{:5} | {:6} | {:4} | 0x{:016x}", 
                chunk_count, chunk_start, match_size, hasher.get_hash());

            hasher.set_hash(0);
        } else {
            // No more matches, process remaining bytes
            let remaining = input_buf.len() - offset;
            total_processed += remaining;
            chunk_count += 1;
            
            println!("{:5} | {:6} | {:4} | 0x{:016x} (final)", 
                chunk_count, offset, remaining, hasher.get_hash());
            break;
        }
    }
    
    println!("\nSummary:");
    println!("Total chunks: {}", chunk_count);
    println!("Total bytes processed: {}", total_processed);
    println!("Average chunk size: {:.1} bytes", total_processed as f64 / chunk_count as f64);
    
    // Print first few bytes of each chunk for verification
    println!("\nFirst 16 bytes of each chunk:");
    offset = 0;
    chunk_count = 0;
    
    while offset < input_buf.len() {
        if let Some(match_size) = hasher.next_match(&input_buf[offset..], BENCH_MASK) {
            let chunk = &input_buf[offset..offset + match_size];
            println!("Chunk {}: {:02x?}", chunk_count + 1, &chunk[..chunk.len().min(16)]);
            offset += match_size;
            chunk_count += 1;
        } else {
            let chunk = &input_buf[offset..];
            println!("Chunk {}: {:02x?} (final)", chunk_count + 1, &chunk[..chunk.len().min(16)]);
            break;
        }
    }
}

fn main() {
    test_gearhash();

    let input_buf = generate_test_input();
    println!("First 100 bytes: {:02x?}", &input_buf[..100]);
} 