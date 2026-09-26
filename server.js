const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

app.get('/', (req, res) => {
  res.send('Editofy Video Server Running! ffmpeg: ' + ffmpegPath);
});

// Video Edit API - Trim, Compress, Convert
app.post('/edit', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No video uploaded');

  const inputPath = req.file.path;
  const outputFileName = `edited_${Date.now()}.mp4`;
  const outputPath = path.join('outputs', outputFileName);

  const start = req.body.start || 0;
  const duration = req.body.duration; // optional
  const quality = req.body.quality || 'medium';

  let command = ffmpeg(inputPath);
  
  if (start || duration) {
    if (duration) command = command.setStartTime(start).setDuration(duration);
    else command = command.setStartTime(start);
  }

  // quality settings
  if (quality === 'low') command = command.videoBitrate('500k');
  if (quality === 'high') command = command.videoBitrate('2500k');

  command
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
        // keep output for some time, delete after download
        setTimeout(() => { if(fs.existsSync(outputPath)) fs.unlinkSync(outputPath); }, 60000);
      });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).send('Error processing video: ' + err.message);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    })
    .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on', PORT));
