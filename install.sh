#!/bin/bash

# Repository settings - replace with your repository URL
REPO_URL="https://github.com/subhendupsingh/linkedin-message-sender.git"
REPO_FOLDER="repository"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to display messages with color
print_message() {
    echo -e "\033[1;34m$1\033[0m"
}

print_error() {
    echo -e "\033[1;31m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m$1\033[0m"
}

# Check if Homebrew is installed
if ! command_exists brew; then
    print_message "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for current session
    eval "$(/opt/homebrew/bin/brew shellenv)"
    
    if ! command_exists brew; then
        print_error "Failed to install Homebrew. Please install it manually."
        exit 1
    fi
    print_success "Homebrew installed successfully!"
fi

# Check if Git is installed
if ! command_exists git; then
    print_message "Installing Git..."
    brew install git
    
    if ! command_exists git; then
        print_error "Failed to install Git. Please install it manually."
        exit 1
    fi
    print_success "Git installed successfully!"
else
    print_message "Git is already installed."
fi

# Clone or update repository
if [ ! -d "$REPO_FOLDER" ]; then
    print_message "Cloning repository..."
    git clone "$REPO_URL" "$REPO_FOLDER"
    if [ $? -ne 0 ]; then
        print_error "Failed to clone repository."
        exit 1
    fi
    cd "$REPO_FOLDER"
else
    print_message "Repository folder already exists. Updating..."
    cd "$REPO_FOLDER"
    git pull
fi

# Check if Node.js is installed
if ! command_exists node; then
    print_message "Installing Node.js..."
    brew install node
    
    if ! command_exists node; then
        print_error "Failed to install Node.js. Please install it manually."
        exit 1
    fi
    print_success "Node.js installed successfully!"
else
    print_message "Node.js is already installed."
fi

# Check if npm is available
if ! command_exists npm; then
    print_error "npm not found. Please ensure Node.js is installed correctly."
    exit 1
fi

# Create package.json if it doesn't exist
if [ ! -f package.json ]; then
    print_message "Initializing npm project..."
    npm init -y
fi

# Check if Playwright is installed
if ! npm list playwright >/dev/null 2>&1; then
    print_message "Installing Playwright..."
    npm install playwright
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install Playwright."
        exit 1
    fi
    print_success "Playwright installed successfully!"
fi

# Install Playwright browsers (including Chromium)
print_message "Installing Playwright browsers..."
npx playwright install chromium

if [ $? -ne 0 ]; then
    print_error "Failed to install Playwright browsers."
    exit 1
fi
print_success "Playwright browsers installed successfully!"

# Install project dependencies
print_message "Installing project dependencies..."
npm install

# Run the Node.js script
print_message "Running Node.js script..."
node index.js

if [ $? -ne 0 ]; then
    print_error "Error occurred while running the script."
    exit 1
fi

print_success "Script execution completed successfully!"

# Keep the terminal window open
read -p "Press Enter to exit..."