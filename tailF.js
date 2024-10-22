const fs = require('fs');
const readline = require('readline');

function tailF(filePath, numLines = 10) {
    const lines = [];
    
    // Read the last 'numLines' lines from the file
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    });

    rl.on('line', (line) => {
        lines.push(line);
        if (lines.length > numLines) lines.shift();
    });

    rl.on('close', () => {
        console.log(lines.join('\n'));
        watchFile(filePath, lines);
    });
}

function watchFile(filePath, lines) {
    let lastSize = 0;

    // Monitor the file for changes
    fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting file stats: ${err.message}`);
                    return;
                }
                if (stats.size > lastSize) {
                    const stream = fs.createReadStream(filePath, {
                        encoding: 'utf8',
                        start: lastSize,
                        end: stats.size
                    });
                    lastSize = stats.size;

                    stream.on('data', (newData) => {
                        process.stdout.write(newData);
                    });
                }
            });
        }
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\nFile watcher stopped.');
        process.exit(0);
    });
}

// Usage
const filePath = './myText.txt';
tailF(filePath, 10);
