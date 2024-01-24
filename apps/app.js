const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTMX page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.htmx'));
});

app.get('/api', (req, res) => {
    res("hello this is API route response")
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
