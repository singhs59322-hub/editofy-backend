const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

// folders banao
['uploads','edited','public'].forEach(d => {
  if(!fs.existsSync(d)) fs.mkdirSync(d)
});

ffmpeg.setFfmpegPath(ffmpegPath);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/edited', express.static(path.join(__dirname, 'edited'))));

// health check
app.get('/', (req,res) => res.send('Editofy Backend Running - Upload API ready'));

// MAIN API
app.post('/api/edit', upload.single('video'), (req, res) => {
  console.log('Video received:', req.file);
  if(!req.file) return res.status(400).json({success:false, error: 'No video'});

  const outFile = `edited_${Date.now()}.mp4`;
  const outPath = path.join(__dirname, 'edited', outFile);

  ffmpeg(req.file.path)
    .videoFilters('eq=brightness=0.06', 'deshake')
    .on('end', () => {
      try{ fs.unlinkSync(req.file.path); }catch(e){}
      console.log('Edited:', outFile);
      res.json({ success: true, url: `/edited/${outFile}`, fullUrl: `https://${req.get('host')}/edited/${outFile}` });
    })
    .on('error', (err) => {
      console.log(err);
      res.json({ success: false, error: err.message });
    })
    .save(outPath);
});

app.listen(PORT, () => console.log('Running on', PORT));
