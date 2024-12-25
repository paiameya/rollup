import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import * as terser from 'terser';
import { fileURLToPath } from 'url';

// Ensure input/output directories are defined
const INPUT_DIR = './src/internal_browser'; // Input directory containing source files
const OUTPUT_DIR = './dist'; // Output build directory

/**
 * Ensure the directory exists, and create it if necessary.
 */
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Minify the content of a .jsx file to .min.js and save to destination.
 */
async function minifyJS(srcPath, destPath) {
    const jsxContent = fs.readFileSync(srcPath, 'utf-8');
    const minified = await terser.minify(jsxContent);
    if (minified.error) {
        console.error(`Error minifying file ${srcPath}:`, minified.error);
        return;
    }
    // Save minified content to the destination path
    ensureDirSync(path.dirname(destPath));
    fs.writeFileSync(destPath, minified.code, 'utf-8');
    console.log(`Minified and copied: ${srcPath} -> ${destPath}`);
}

/**
 * Convert 'file://' URL to file system path, used when the script is run via URL.
 */
function getPathFromUrl(url) {
    const filePath = fileURLToPath(url);
    return path.resolve(filePath);
}

/**
 * Copy the referenced file from source to the destination, preserving relative path structure.
 * If it's a .jsx file, minify it first.
 */
async function copyFileIfNeeded(srcPath, destDir) {
    if (!fs.existsSync(srcPath)) {
        console.warn(`File not found: ${srcPath}`);
        return;
    }

    const ext = path.extname(srcPath);
    let destPath = path.join(destDir, path.relative(INPUT_DIR, srcPath));

    if (ext === '.jsx') {
        // If it’s a .jsx file, minify it to .min.js
        destPath = destPath.replace('.jsx', '.min.js');
        await minifyJS(srcPath, destPath);
    } else {
        // For other files, just copy them
        ensureDirSync(path.dirname(destPath));
        if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${srcPath} -> ${destPath}`);
        }
    }
}

/**
 * Process an HTML file, copying its dependent assets and updating paths.
 */
async function processHtmlFile(htmlFilePath) {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    // Process link elements (for stylesheets)
    $('link[rel="stylesheet"]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href && href.startsWith('/')) {
            const srcPath = path.resolve(INPUT_DIR, href.substring(1)); // Removing leading slash
            copyFileIfNeeded(srcPath, OUTPUT_DIR);

            // Update the link href to point to the build directory
            const relativePath = path.relative(path.dirname(htmlFilePath), srcPath);
            $(elem).attr('href', path.join('build', relativePath));
        }
    });

    // Process script elements (for JavaScript files)
    $('script[src]').each((_, elem) => {
        const src = $(elem).attr('src');
        if (src && src.startsWith('/')) {
            const srcPath = path.resolve(INPUT_DIR, src.substring(1)); // Removing leading slash
            copyFileIfNeeded(srcPath, OUTPUT_DIR);

            // If it's a JSX file, change the extension to .min.js in the HTML
            const updatedSrc = src.replace('.jsx', '.min.js');
            const relativePath = path.relative(path.dirname(htmlFilePath), srcPath);
            $(elem).attr('src', path.join('build', relativePath).replace(/\.jsx$/, '.min.js'));
        }
    });

    // Write the updated HTML to the build directory
    const relativeHtmlPath = path.relative(INPUT_DIR, htmlFilePath);
    const outputHtmlPath = path.join(OUTPUT_DIR, relativeHtmlPath);
    ensureDirSync(path.dirname(outputHtmlPath));
    fs.writeFileSync(outputHtmlPath, $.html(), 'utf-8'); // Save the updated HTML content
    console.log(`Updated HTML: ${htmlFilePath} -> ${outputHtmlPath}`);
}

/**
 * Main function to process all the HTML files and their dependencies.
 */
async function build() {
    ensureDirSync(OUTPUT_DIR);

    // Traverse the input directory and process all HTML files
    const traverseDir = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                traverseDir(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                processHtmlFile(fullPath);
            }
        }
    };

    traverseDir(INPUT_DIR);

    console.log('Build process completed!');
}

// Run the build function
build();
