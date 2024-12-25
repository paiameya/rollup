import html from 'rollup-plugin-html';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/assets/mason.html', // Input HTML file
    output: {
        dir: 'build', // Output directory
        // format: 'iife', // Self-invoking script format for the browser
    },
    plugins: [
        html({
            include: 'src/assets/mason.html',
            htmlMinifierOptions: {
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
            },
        }),
        resolve(),
        terser(), // Minify JavaScript
    ],
};
