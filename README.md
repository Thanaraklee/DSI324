# PDF Search and Metadata Platform

This project enables intelligent document search using neural embeddings and full-text search. It also includes features for previewing and downloading PDFs and inspecting metadata.

# Features
- Neural Search (using `BAAI/bge-m3`)
- Full-text Search
- PDF Preview and Download
- Metadata Viewer

# Model
- HuggingFace: https://huggingface.co/BAAI/bge-m3

## Project Structure
```text
.
├── backend/
│   ├── service.py              # FastAPI app to serve neural & text search
│   ├── extract_minio.py        # Extract text from PDFs stored in MinIO
│   ├── upload_minio.py         # Upload files from Google Drive to MinIO
│   ├── qdrant_upload.py        # Upload vector data to Qdrant
│   └── ...
├── frontend/                   # Web UI with search, preview and metadata
├── data/                       # Text data extracted from PDFs
├── start.sh                    # Initial setup script
└── docker-compose.yml          # All-in-one environment for services
```

## Preparation (Optional - For Custom Setup or Data Pipeline)
If you want to prepare your own dataset or process documents from scratch, follow these steps:
1. Upload PDFs from Google Drive to MinIO
    ```bash
    python backend/upload_minio.py
    ```
2. Extract text from PDFs in MinIO
(Extracted text will be saved in the `data/` directory.)
    ```bash
    python backend/extract_minio.py
    ```
3. Upload extracted text to Qdrant using `BAAI/bge-m3` model
    ```bash
    python backend/qdrant_upload.py
    ```

## Usage (Quick Start for Users)
If you just want to run and use the app, these 3 steps are enough:
1. Start backend services (FastAPI + Qdrant + MinIO)
    ```bash
    docker compose up -d
    ```
2. Launch the FastAPI server
    ```bash
    python backend/service.py
    ```
3. Start the web UI
    ```bash
    cd frontend
    npm install
    npm run start
    ```
Then visit: http://localhost:3000

## Model Used
- Vector Embedding Model: `BAAI/bge-m3`
    - Supports multilingual and cross-domain embedding
    - Used to power neural search on top of Qdrant

---

## System Requirements

### Operating System
The following Ubuntu distributions are supported:

- Ubuntu 24.10 (Oracular)
- Ubuntu 24.04 LTS (Noble)
- Ubuntu 22.04 LTS (Jammy)
- Ubuntu 20.04 LTS (Focal)

### Hardware Requirements

| Resource       | Minimum Specification              |
|----------------|------------------------------------|
| Storage        | 50 GB or more                      |
| CPU            | 4 cores                            |
| RAM            | 8 GB                               |
| Network        | Internet connection is required    |

### Software Requirements

- Python 3.13.3 installed and working
- `git` must be installed
- Docker must be installed and accessible
- You **must not** run this project inside **VirtualBox** or **VMware Workstation**, because they do **not** support CUDA passthrough properly.


## CUDA Compatibility Note
If you intend to use CUDA functionality (e.g., for accelerated vector embedding with PyTorch), ensure:
- Your host system has a supported NVIDIA GPU
- You have installed NVIDIA drivers and **CUDA version 12.8**
- You run the system on bare metal or on a cloud provider that supports GPU passthrough

CUDA is **not supported** in VirtualBox or VMware Workstation.




