# TrustOrigin Backend
## Overview
This will be filled with information about what features are implemented. Should follow this document https://docs.google.com/document/d/1W24Y622iy2hxvkh0bclEoatzR9af8QYW7HahXiAHDOM/edit#heading=h.2gy042pltgv

## How to run locally
### Prerequisites
- Rust
- DFX

### Steps
1. Ensure you could do `cargo build --target wasm32-unknown-unknown` in this directory
2. Go to the main directory `cd ..`
3. Run `dfx start --background`
4. Run `dfx deploy`

Your application should now running on Canister which run locally on port  `4943`.