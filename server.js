const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });
app.get('/', (req, res) => { res.send('Editofy API LIVE hai!'); });
app.get('/health', (req, res) => res.send('OK'));
app.post('/api/edit', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Video nahi mila' });
  res.json({ success: true, message: 'Video mil gaya' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running'));
