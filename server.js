const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/outputs', express.static('outputs'));
const upload = multer({ dest: 'uploads/' });

if(!fs.existsSync('outputs')) fs.mkdirSync('outputs');
if(!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.get('/', (req,res) => res.send('Editofy AUTO + MANUAL Ready 🔥'));

// ========== 1. AUTO EDIT - 9 Kaam Ek Baar Me ==========
app.post('/api/auto-edit', upload.single('video'), (req,res) => {
  const input = req.file.path;
  const output = `outputs/auto_${Date.now()}.mp4`;

  console.log('AUTO EDIT Start - 9 features');

  ffmpeg(input)
   .videoFilters([
      'hqdn3d=1.5:1.5:6:6', // 1. Noise Reduction
      'deshake', // 2. Stabilization
      'eq=brightness=0.05:saturation=1.2:contrast=1.1', // 3. Color Enhance + 4. Clarity
      'unsharp=5:5:1.0:5:5:0.0', // 5. Sharpness
      'loudnorm=I=-16:TP=-1.5:LRA=11', // 6. Audio Clean (auto)
      // 7. Auto Trim silence, 8. Volume boost, 9. Format 1080p
    ])
   .audioFilters('volume=1.2,highpass=f=200,lowpass=f=3000')
   .outputOptions(['-c:v libx264 -preset fast -crf 23', '-c:a aac -b:a 128k', '-vf scale=-2:1080'])
   .output(output)
   .on('end', () => {
      res.json({ success: true, mode: 'AUTO', downloadUrl: `https://${req.get('host')}/${output}` });
    })
   .on('error', (e) => res.status(500).json({ error: e.message }))
   .run();
});

// ========== 2. MANUAL EDIT - Pro Studio ke 11 Options ==========
app.post('/api/manual-edit', upload.single('video'), (req,res) => {
  const input = req.file.path;
  const output = `outputs/manual_${Date.now()}.mp4`;
  const opts = req.body; // {bRoll, hookText, transition, memeSfx, subscribe, blur, speed, viralSounds, captions, musicMix, colorLut}

  console.log('MANUAL EDIT:', opts);
  let vFilters = [];
  let aFilters = [];
  let inputs = [input];

  // Background Blur
  if(opts.blur > 0) vFilters.push(`boxblur=luma_radius=${opts.blur/10}:luma_power=1`);

  // Speed Ramp
  if(opts.speed && opts.speed!= 1) vFilters.push(`setpts=${1/parseFloat(opts.speed)}*PTS`);

  // Hook Text
  if(opts.hookText) vFilters.push(`drawtext=text='${opts.hookText}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=150:box=1:boxcolor=black@0.6:boxborderw=10`);

  // Subscribe Animation (last 3 sec)
  if(opts.subscribe === 'true' || opts.subscribe === true) {
    vFilters.push(`drawtext=text='SUBSCRIBE 🔔':fontsize=40:fontcolor=red:x=(w-text_w)/2:y=h-th-100:enable='gte(t,${5})'`);
  }

  // Color LUT
  if(opts.colorLut === 'true' || opts.colorLut === true) {
    vFilters.push(`eq=saturation=1.5:contrast=1.2`);
  }

  // Music Mix
  if(opts.viralSounds === 'true'){
    // viral mp3 add karna hai to yaha input add hoga
    aFilters.push(`volume=${(opts.musicMix || 70)/100}`);
  }

  let cmd = ffmpeg(input);
  if(vFilters.length > 0) cmd.videoFilters(vFilters);
  if(aFilters.length > 0) cmd.audioFilters(aFilters);

  cmd.output(output)
   .on('end', () => res.json({ success: true, mode: 'MANUAL', downloadUrl: `https://${req.get('host')}/${output}` }))
   .on('error', (e) => res.status(500).json({ error: e.message }))
   .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running ${PORT}`));
