const fs = require('fs');
const readline = require('readline');

function tailF(filePath, numLines = 10) {
    // Open the file in read mode
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', flags: 'r' });

    // Create an interface to read lines from the file
    const rl = readline.createInterface({
        input: stream,
        output: process.stdout,
        terminal: false
    });

    // Store the last few lines in an array
    const lines = [];

    // Read the file line by line
    rl.on('line', (line) => {
        lines.push(line);
        if (lines.length > numLines) {
            lines.shift(); // Keep only the last 'numLines' lines
        }
    });

    rl.on('close', () => {
        // Output the last 'numLines' lines
        console.log(lines.join('\n'));

        // Watch for new changes in the file
        watchFile(filePath);
    });
}

function watchFile(filePath) {
    // Watch for file changes using fs.watch
    let fileDescriptor;
    fs.open(filePath, 'r', (err, fd) => {
        if (err) {
            console.error(`Error opening file: ${err.message}`);
            return;
        }
        fileDescriptor = fd;
    });

    fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            // Read new data when file is modified
            const buffer = Buffer.alloc(1024);
            fs.read(fileDescriptor, buffer, 0, buffer.length, null, (err, bytesRead) => {
                if (err) {
                    console.error(`Error reading file: ${err.message}`);
                    return;
                }
                if (bytesRead > 0) {
                    const newContent = buffer.toString('utf8', 0, bytesRead);
                    process.stdout.write(newContent);
                }
            });
        }
    });

    // Handle process termination to close the file descriptor
    process.on('SIGINT', () => {
        if (fileDescriptor) {
            fs.close(fileDescriptor, () => {
                console.log('\nFile watcher stopped.');
                process.exit(0);
            });
        }
    });
}

// Usage: Provide the path to the file you want to tail
const filePath = './myText.txt';
tailF(filePath, 10);
