const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// uploads folder banao agar nahi hai
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

app.get('/', (req, res) => {
  res.send('EDITOFY AUTO 15 + MANUAL 7 Running - Ready!');
});

// YE RAHA TERA UPLOAD ROUTE - YAHI MISSING THA
app.post('/upload', upload.single('videoFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `https://${req.get('host')}/uploads/${req.file.filename}`;
  // Railway pe https force karo
  const finalUrl = fileUrl.replace('http://', 'https://');
  res.json({ url: finalUrl, filename: req.file.filename });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});
