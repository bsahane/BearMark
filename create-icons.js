const fs = require('fs');
const path = require('path');

// Simple PNG icon generator using Canvas API (if available) or base64 data
function createSimpleIcon(size) {
    // Create a simple PNG with base64 encoding
    // This creates a basic colored square icon
    const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#f4a261;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#e76f51;stop-opacity:1" />
            </linearGradient>
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="url(#grad)" stroke="#fff" stroke-width="1"/>
        <text x="${size/2}" y="${size/2 + size*0.1}" font-family="Arial, sans-serif" font-size="${size*0.4}" font-weight="bold" text-anchor="middle" fill="white">M</text>
    </svg>`;
    
    return canvas;
}

// Create base64 encoded PNG data (simplified - creates colored squares)
function createBase64Icon(size, color1 = '#f4a261', color2 = '#e76f51') {
    // This is a very basic approach - creates a simple colored square
    // For a production app, you'd want to use a proper image library
    
    const width = size;
    const height = size;
    
    // Create a minimal PNG header and data
    // This is a simplified approach for demonstration
    const svgString = createSimpleIcon(size);
    return Buffer.from(svgString).toString('base64');
}

// Create icon files
async function createIcons() {
    const iconDir = path.join(__dirname, 'extension', 'icons');
    
    // Ensure icons directory exists
    if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
    }
    
    const sizes = [16, 32, 48, 128];
    
    console.log('Creating icon files...');
    
    for (const size of sizes) {
        const svgContent = createSimpleIcon(size);
        const filename = `icon-${size}.svg`;
        const filepath = path.join(iconDir, filename);
        
        fs.writeFileSync(filepath, svgContent);
        console.log(`Created ${filename}`);
    }
    
    // Create a simple HTML file to convert SVG to PNG
    const converterHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Icon Converter</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon-container { margin: 20px 0; }
        canvas { border: 1px solid #ccc; margin: 10px; }
        button { margin: 5px; padding: 10px; }
    </style>
</head>
<body>
    <h1>BearMark Icon Converter</h1>
    <p>This page converts SVG icons to PNG format for the Chrome extension.</p>
    
    <div class="icon-container">
        <h3>Generated Icons:</h3>
        <canvas id="canvas16" width="16" height="16"></canvas>
        <canvas id="canvas32" width="32" height="32"></canvas>
        <canvas id="canvas48" width="48" height="48"></canvas>
        <canvas id="canvas128" width="128" height="128"></canvas>
    </div>
    
    <div>
        <button onclick="downloadAll()">Download All Icons</button>
        <button onclick="createBasicPNGs()">Create Basic PNG Icons</button>
    </div>
    
    <script>
        function drawIcon(canvas, size) {
            const ctx = canvas.getContext('2d');
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#f4a261');
            gradient.addColorStop(1, '#e76f51');
            
            // Draw background circle
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw text
            ctx.fillStyle = 'white';
            ctx.font = \`bold \${size * 0.4}px Arial\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('M', size/2, size/2);
        }
        
        function downloadIcon(canvasId, filename) {
            const canvas = document.getElementById(canvasId);
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        function downloadAll() {
            downloadIcon('canvas16', 'icon-16.png');
            downloadIcon('canvas32', 'icon-32.png');
            downloadIcon('canvas48', 'icon-48.png');
            downloadIcon('canvas128', 'icon-128.png');
        }
        
        function createBasicPNGs() {
            // This creates very basic PNG data using canvas
            const sizes = [16, 32, 48, 128];
            
            sizes.forEach(size => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Simple colored square with M
                ctx.fillStyle = '#f4a261';
                ctx.fillRect(0, 0, size, size);
                
                ctx.fillStyle = 'white';
                ctx.font = \`bold \${size * 0.5}px Arial\`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('M', size/2, size/2);
                
                // Download
                const link = document.createElement('a');
                link.download = \`icon-\${size}.png\`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
        
        // Initialize
        drawIcon(document.getElementById('canvas16'), 16);
        drawIcon(document.getElementById('canvas32'), 32);
        drawIcon(document.getElementById('canvas48'), 48);
        drawIcon(document.getElementById('canvas128'), 128);
    </script>
</body>
</html>`;
    
    const converterPath = path.join(iconDir, 'converter.html');
    fs.writeFileSync(converterPath, converterHtml);
    console.log('Created converter.html');
    
    console.log('\\n✅ Icon generation complete!');
    console.log('\\n📋 Next steps:');
    console.log('1. Open extension/icons/converter.html in your browser');
    console.log('2. Click "Download All Icons" to get PNG files');
    console.log('3. Save the PNG files in the extension/icons/ directory');
    console.log('4. Try loading the extension again in Chrome');
    
    return true;
}

// Run the icon creation
createIcons().catch(console.error);

