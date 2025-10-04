#!/bin/bash

# Robotics Club Door Lock - Deployment Script
# This script helps deploy the application to various platforms

set -e

echo "🤖 Robotics Club Door Lock - Deployment Script"
echo "=============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_env() {
    echo "📋 Validating environment..."
    
    if [ ! -f ".env" ]; then
        echo "❌ .env file not found. Please copy .env.example and configure it."
        exit 1
    fi
    
    # Check required environment variables
    required_vars=("BREVO_API_KEY" "GOOGLE_SERVICE_ACCOUNT_EMAIL" "GOOGLE_PRIVATE_KEY" "GOOGLE_SHEET_ID")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            echo "❌ Required environment variable $var not found in .env"
            exit 1
        fi
    done
    
    echo "✅ Environment validation passed"
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    
    if command_exists npm; then
        npm install
        cd frontend && npm install && cd ..
    else
        echo "❌ npm not found. Please install Node.js and npm."
        exit 1
    fi
    
    echo "✅ Dependencies installed"
}

# Function to build application
build_app() {
    echo "🏗️  Building application..."
    
    cd frontend
    npm run build
    cd ..
    
    echo "✅ Application built successfully"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    npm test
    
    echo "✅ Tests passed"
}

# Function to start application
start_app() {
    echo "🚀 Starting application..."
    
    if [ "$NODE_ENV" = "production" ]; then
        npm start
    else
        npm run dev
    fi
}

# Function to deploy to Docker
deploy_docker() {
    echo "🐳 Deploying with Docker..."
    
    if command_exists docker; then
        docker build -t robotics-door-lock .
        docker run -d \
            --name robotics-door-lock \
            --env-file .env \
            -p 3000:3000 \
            robotics-door-lock
        
        echo "✅ Docker deployment completed"
        echo "📍 Application running at http://localhost:3000"
    else
        echo "❌ Docker not found. Please install Docker."
        exit 1
    fi
}

# Function to deploy with Docker Compose
deploy_compose() {
    echo "🐳 Deploying with Docker Compose..."
    
    if command_exists docker-compose; then
        docker-compose up -d
        
        echo "✅ Docker Compose deployment completed"
        echo "📍 Application running at http://localhost:3000"
    else
        echo "❌ Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: ./deploy.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  --validate    Validate environment configuration"
    echo "  --install     Install dependencies"
    echo "  --build       Build the application"
    echo "  --test        Run tests"
    echo "  --start       Start the application"
    echo "  --docker      Deploy with Docker"
    echo "  --compose     Deploy with Docker Compose"
    echo "  --full        Complete deployment (install, build, test, start)"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh --full       # Complete deployment"
    echo "  ./deploy.sh --docker     # Docker deployment"
    echo "  ./deploy.sh --validate   # Just validate environment"
}

# Main execution
main() {
    case "${1:-}" in
        --validate)
            validate_env
            ;;
        --install)
            install_deps
            ;;
        --build)
            build_app
            ;;
        --test)
            run_tests
            ;;
        --start)
            validate_env
            start_app
            ;;
        --docker)
            validate_env
            deploy_docker
            ;;
        --compose)
            validate_env
            deploy_compose
            ;;
        --full)
            validate_env
            install_deps
            build_app
            run_tests
            echo "🎉 Deployment completed successfully!"
            echo "📍 Run 'npm start' to start the application"
            ;;
        --help)
            show_help
            ;;
        "")
            echo "❌ No option specified. Use --help for usage information."
            exit 1
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"