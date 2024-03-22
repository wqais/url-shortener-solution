const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

const urlMap = {};

app.use(bodyParser.json());

// short code function (using hashing)
function generateShortCode(longUrl) {
  const hash = crypto.createHash('sha256').update(longUrl).digest('base64');
  return hash.substring(0, 6); // Use the first 6 characters of the hash as the short code
}

// create a short URL
app.post('/api/shorten', (req, res) => {
  const longUrl = req.body.longUrl;
  // Validate long URL
  if (!isValidUrl(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Generate short code
  const shortCode = generateShortCode(longUrl);

  // Store the mapping between short code and long URL
  urlMap[shortCode] = { longUrl, createdAt: Date.now() };

  // Return the short URL
  const shortUrl = `http://localhost:${PORT}/${shortCode}`;
  res.json({ shortUrl });
});

// Route to redirect from short URL to original long URL
app.get('/:shortCode', (req, res) => {
  const shortCode = req.params.shortCode;
  const urlEntry = urlMap[shortCode];

  if (!urlEntry) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  // Check for expiry (optional)
  const { longUrl, createdAt } = urlEntry;
  const expiryTime = 30 * 1000; // 30 seconds in milliseconds
  if (Date.now() - createdAt > expiryTime) {
    delete urlMap[shortCode]; // Remove expired entry
    return res.status(404).json({ error: 'Short URL has expired' });
  }

  res.redirect(longUrl);
});

// Function to validate URL format
function isValidUrl(url) {
  // Basic URL format validation (you can use a library for more robust validation)
  const urlPattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
  return urlPattern.test(url);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
