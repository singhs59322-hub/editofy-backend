const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
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
  res.send('EDITOFY AUTO 15 + MANUAL 7 Running - Ready!');
});

app.post('/auto-edit', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('video missing');
  const input = req.file.path;
  const output = `outputs/AUTO_${Date.now()}.mp4`;
  
  let vf = ['deshake','crop=ih*9/16:ih:(iw-ow)/2:0,scale=1080:1920','eq=saturation=1.4:contrast=1.1','setpts=0.833*PTS','hqdn3d'];
  let af = ['silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-60dB','loudnorm=I=-16:TP=-1.5:LRA=11','atempo=1.2'];
  
  try {
    let manual = {};
    if (req.body.manual) manual = JSON.parse(req.body.manual);
    const cta = (manual.ctaText || 'Follow for More!').replace(/:/g, '\\:');
    vf.push(`drawtext=text='${cta}':fontcolor=yellow:fontsize=60:box=1:boxcolor=black@0.8:x=(w-text_w)/2:y=h-th-150:enable='gte(t\\,duration-3)'`);

    ffmpeg(input).videoFilters(vf.join(',')).audioFilters(af.join(',')).videoBitrate('4000k').outputOptions(['-preset','ultrafast']).output(output)
      .on('end',()=>res.download(output,()=>{try{fs.unlinkSync(output);fs.unlinkSync(input);}catch{}}))
      .on('error',e=>{res.status(500).send(e.message);try{fs.unlinkSync(input);}catch{}})
      .run();
  } catch(e){res.status(500).send(e.message);}
});

app.listen(process.env.PORT||3000,()=>console.log('Running'));
