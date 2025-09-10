#!/bin/bash

# Regenerate xet-chunk wasm files directly from xet-core codebase

set -euo pipefail

# Configuration
REPO_URL="https://github.com/huggingface/xet-core.git"
DEFAULT_BRANCH="main"
DEFAULT_PACKAGE="hf_xet_thin_wasm"
DEFAULT_JS_TARGET="web"
CLONE_DIR="xet-core-wasm-build"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Help function
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Build WASM packages from xet-core repository.

OPTIONS:
    -b, --branch BRANCH     Git branch to checkout (default: $DEFAULT_BRANCH)
    -p, --package PACKAGE   WASM package to build: hf_xet_thin_wasm or hf_xet_wasm (default: $DEFAULT_PACKAGE)
    -t, --target TARGET     JavaScript target: web, nodejs, bundler, no-modules, deno (default: $DEFAULT_JS_TARGET)
    -o, --output DIR        Output directory to copy built WASM files
    -c, --clean             Clean clone directory before starting
    -h, --help              Show this help message

EXAMPLES:
    $0                                    # Build hf_xet_thin_wasm from main branch
    $0 -b feature-branch                  # Build from specific branch
    $0 -p hf_xet_wasm                     # Build the full WASM package
    $0 -o ./my-project/wasm               # Copy output to specific directory
    $0 -t nodejs -o ./dist                # Build for Node.js and copy to dist

REQUIREMENTS:
    - Git
    - Rust (will install nightly toolchain automatically)
    - Internet connection for downloading dependencies

EOF
}

# Parse command line arguments
BRANCH="$DEFAULT_BRANCH"
PACKAGE="$DEFAULT_PACKAGE"
JS_TARGET="$DEFAULT_JS_TARGET"
OUTPUT_DIR=""
CLEAN=false
ORIGINAL_DIR=$(pwd)

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -p|--package)
            PACKAGE="$2"
            if [[ "$PACKAGE" != "hf_xet_thin_wasm" && "$PACKAGE" != "hf_xet_wasm" ]]; then
                error "Invalid package: $PACKAGE. Must be 'hf_xet_thin_wasm' or 'hf_xet_wasm'"
            fi
            shift 2
            ;;
        -t|--target)
            JS_TARGET="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1. Use -h for help."
            ;;
    esac
done

# Check prerequisites
log "Checking prerequisites..."

if ! command_exists git; then
    error "Git is not installed. Please install Git first."
fi

if ! command_exists rustup; then
    error "Rustup is not installed. Please install Rust from https://rustup.rs/"
fi

# Clean previous build if requested
if [[ "$CLEAN" == true && -d "$CLONE_DIR" ]]; then
    log "Cleaning previous build directory: $CLONE_DIR"
    rm -rf "$CLONE_DIR"
fi

# Clone the repository
if [[ -d "$CLONE_DIR" ]]; then
    log "Directory $CLONE_DIR already exists. Using existing clone."
    cd "$CLONE_DIR"
    log "Fetching latest changes..."
    git fetch origin
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    log "Cloning xet-core repository (branch: $BRANCH, depth: 1)..."
    git clone --depth=1 --branch="$BRANCH" "$REPO_URL" "$CLONE_DIR"
    cd "$CLONE_DIR"
fi

log "Repository cloned successfully. Current directory: $(pwd)"

# Install required Rust toolchain and components
log "Setting up Rust toolchain..."

# # Install nightly toolchain
# log "Installing Rust nightly toolchain..."
# rustup toolchain install nightly

# # Add WASM target
# log "Adding wasm32-unknown-unknown target..."
# rustup target add wasm32-unknown-unknown --toolchain nightly

# # Add rust-src component for nightly
# log "Adding rust-src component..."
# rustup component add rust-src --toolchain nightly

# Install required tools
log "Installing wasm-pack and wasm-bindgen-cli..."
if ! command_exists wasm-pack; then
    cargo install wasm-pack
else
    log "wasm-pack already installed"
fi

if ! command_exists wasm-bindgen; then
    cargo install wasm-bindgen-cli
else
    log "wasm-bindgen-cli already installed"
fi

# Change to the package directory
log "Building WASM package: $PACKAGE"
cd "$PACKAGE"

# Set environment variable for JS target
export JS_TARGET="$JS_TARGET"

# Build the WASM package
log "Starting WASM build (target: $JS_TARGET)..."
if [[ "$PACKAGE" == "hf_xet_thin_wasm" ]]; then
    # Use the existing build script for thin WASM
    chmod +x build_wasm.sh
    ./build_wasm.sh
else
    # For hf_xet_wasm, use the more complex build process
    chmod +x build_wasm.sh
    ./build_wasm.sh
fi

log "WASM build completed successfully!"

# Check if pkg directory exists (created by wasm-pack)
if [[ -d "pkg" ]]; then
    log "Generated files in pkg directory:"
    ls -la pkg/

    # Copy to output directory if specified
    if [[ -n "$OUTPUT_DIR" ]]; then
        log "Copying WASM files to output directory: $OUTPUT_DIR"
        mkdir -p "$OUTPUT_DIR"
        cp -r pkg/* "$OUTPUT_DIR/"
        log "Files copied to $OUTPUT_DIR"
        log "Contents of output directory:"
        ls -la "$OUTPUT_DIR"
    fi
else
    warn "pkg directory not found. Build may have failed or used different output location."
fi

# Return to original directory
cd "$ORIGINAL_DIR"

log "Build process completed!"
log "Built package: $PACKAGE"
log "Branch: $BRANCH"
log "JavaScript target: $JS_TARGET"
if [[ -n "$OUTPUT_DIR" ]]; then
    log "Output copied to: $OUTPUT_DIR"
fi

# Detect operating system for base64 command compatibility
OS=$(uname)
if [[ "$OS" == "Darwin" ]]; then
    BASE64_CMD="base64 -i"
    log "Detected macOS - using base64 -i flag"
else
    BASE64_CMD="base64"
    log "Detected Linux/Unix - using standard base64"
fi

# copy the generated hf_xet_thin_wasm_bg.js to the hub package and hf_xet_thin_wasm_bg.wasm to the hub package
cp "$CLONE_DIR/$PACKAGE/pkg/hf_xet_thin_wasm_bg.js" "./src/vendor/xet-chunk/chunker_wasm_bg.js"
cp "$CLONE_DIR/$PACKAGE/pkg/hf_xet_thin_wasm_bg.wasm.d.ts" "./src/vendor/xet-chunk/chunker_wasm_bg.wasm.d.ts"
cat << EOF > "./src/vendor/xet-chunk/chunker_wasm_bg.wasm.base64.ts"
// Generated by build-xet-wasm.sh
// Repository: $REPO_URL
// Branch: $BRANCH
// Package: $PACKAGE
// JS Target: $JS_TARGET
// Build Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

export const wasmBase64 = atob(
	\`
EOF
$BASE64_CMD "$CLONE_DIR/$PACKAGE/pkg/hf_xet_thin_wasm_bg.wasm" | fold -w 100 >> "./src/vendor/xet-chunk/chunker_wasm_bg.wasm.base64.ts"
cat << 'EOF' >> "./src/vendor/xet-chunk/chunker_wasm_bg.wasm.base64.ts"
`
		.trim()
		.replaceAll("\n", "")
);
const wasmBinary = new Uint8Array(wasmBase64.length);
for (let i = 0; i < wasmBase64.length; i++) {
	wasmBinary[i] = wasmBase64.charCodeAt(i);
}
export { wasmBinary };
EOF

echo -e "\n${GREEN}🎉 Success!${NC} Your WASM package is ready to use."
