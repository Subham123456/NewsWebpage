import express from "express"
import fetch from "node-fetch";
import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from multiple directories
app.use(express.static('public'));
app.use(express.static('images'));
app.use(express.static('lead-management-system'));
app.use(express.static('.'));

// Serve newsdata.json
app.get('/newsdata.json', (req, res) => {
    const filePath = path.join(__dirname, 'newsdata.json');
    console.log('Serving newsdata.json from:', filePath);
    res.sendFile(filePath);
});

// Serve index.html
app.get("/", (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    console.log('Serving index.html from:', filePath);
    res.sendFile(filePath);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log("=========================================");
    console.log(`Server started at http://localhost:${PORT}`);
    console.log("=========================================");
    console.log(`Working directory: ${__dirname}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close the application using it or change the port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});