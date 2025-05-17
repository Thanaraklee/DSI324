#!/bin/bash
# This script is used to set up a Python virtual environment and install the required packages for the project.

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
else
    echo "Virtual environment already exists."
fi

# Activate the virtual environment
# Check the operating system and activate the virtual environment accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
  # For macOS
  source .venv/bin/activate
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # For Linux
  source .venv/bin/activate
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  # For Windows (Git Bash or Cygwin)
  source .venv/Scripts/activate
else
  echo "Unsupported operating system: $OSTYPE"
  exit 1
fi

# install the project in editable mode
pip3 install -e .

# Upgrade pip and install required packages
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# Install PyTorch with CUDA 12.6 support
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126

# Verify CUDA is available
python3 -c "import torch; print(f'CUDA is available: {torch.cuda.is_available()}')"
