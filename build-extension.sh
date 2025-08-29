#!/bin/bash

# BearMark Chrome Extension Build Script

echo "🚀 Building BearMark Chrome Extension..."

# Create extension directory if it doesn't exist
mkdir -p extension/icons
mkdir -p extension/js
mkdir -p extension/styles

# Build and copy files
echo "📁 Building and copying files..."

# Build the project to get compiled CSS
echo "🔨 Building project..."
npm run build > /dev/null 2>&1

# Copy compiled CSS
if [ -f "dist/assets/"*.css ]; then
    cp dist/assets/*.css extension/styles/compiled.css
    echo "✅ Copied compiled styles"
else
    echo "❌ Failed to build/copy compiled styles"
fi

# Download JS dependencies if they don't exist
echo "📥 Checking JS dependencies..."
if [ ! -f "extension/js/alpine.min.js" ]; then
    echo "Downloading Alpine.js..."
    curl -s -o extension/js/alpine.min.js https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js
    echo "✅ Downloaded Alpine.js"
fi

if [ ! -f "extension/js/marked.min.js" ]; then
    echo "Downloading Marked.js..."
    curl -s -o extension/js/marked.min.js https://cdn.jsdelivr.net/npm/marked/marked.min.js
    echo "✅ Downloaded Marked.js"
fi

# Copy app.js (already copied)
if [ -f "extension/js/app.js" ]; then
    echo "✅ App.js ready"
else
    echo "❌ App.js not found"
fi

# Verify required files
echo "🔍 Verifying extension files..."

required_files=(
    "extension/manifest.json"
    "extension/newtab-vanilla.html"
    "extension/popup.html"
    "extension/background.js"
    "extension/popup.js"
    "extension/js/vanilla-app.js"
    "extension/js/storage.js"
    "extension/js/marked.min.js"
    "extension/styles/compiled.css"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

# Create basic icons if they don't exist
echo "🎨 Checking icons..."
if [ ! -f "extension/icons/icon-16.png" ]; then
    echo "⚠️  Icons not found. Please generate them using extension/icons/create-icons.html"
    echo "   Or create placeholder icons:"
    
    # Create simple placeholder icons using ImageMagick if available
    if command -v convert &> /dev/null; then
        echo "📸 Creating placeholder icons with ImageMagick..."
        convert -size 16x16 xc:'#f4a261' extension/icons/icon-16.png
        convert -size 32x32 xc:'#f4a261' extension/icons/icon-32.png  
        convert -size 48x48 xc:'#f4a261' extension/icons/icon-48.png
        convert -size 128x128 xc:'#f4a261' extension/icons/icon-128.png
        echo "✅ Created placeholder icons"
    else
        echo "   Install ImageMagick or create icons manually"
    fi
else
    echo "✅ Icons found"
fi

# Check if any files are missing
if [ ${#missing_files[@]} -eq 0 ]; then
    echo ""
    echo "🎉 BearMark Chrome Extension built successfully!"
    echo ""
    echo "📋 Installation Instructions:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Enable 'Developer mode' (toggle in top-right)"
    echo "3. Click 'Load unpacked'"
    echo "4. Select the 'extension' folder"
    echo "5. Open a new tab to see BearMark!"
    echo ""
    echo "📁 Extension files are in: $(pwd)/extension/"
    echo ""
else
    echo ""
    echo "❌ Build incomplete. Missing files:"
    printf '%s\n' "${missing_files[@]}"
    echo ""
    echo "Please ensure all files are present before installing the extension."
fi

# Optional: Create a ZIP file for distribution
if [ "$1" = "--zip" ]; then
    echo "📦 Creating distribution ZIP..."
    cd extension
    zip -r ../bearmark-extension.zip . -x "*.DS_Store" "*/.*"
    cd ..
    echo "✅ Created bearmark-extension.zip"
fi

echo "🔚 Build script completed."
