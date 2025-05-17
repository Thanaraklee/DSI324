# Update packages
sudo apt-get update -y

# Install Git
# sudo apt install git-all

# Install Python
## Compiling package
sudo apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev wget curl -y
## Download Python into /tmp directory
cd /tmp
curl -O --verbose https://www.python.org/ftp/python/3.13.3/Python-3.13.3.tgz
tar -xf Python-3.13.3.tgz
## Evaluates and prepares Python
cd Python-3.13.3
./configure --enable-optimizations
sudo make install
cd $HOME

sudo apt-get update -y
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

# Add Docker's official GPG key:
sudo apt-get update -y
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

sudo docker run hello-world


