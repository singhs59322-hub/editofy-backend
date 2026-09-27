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

app.get('/', (req,res)=>{ 
  res.send('EDITOFY AUTO 15 + MANUAL 7 Running - Ready!') 
});

app.post('/auto-edit', upload.single('video'), (req,res)=>{
  const input = req.file.path;
  const output = `outputs/AUTO_${Date.now()}.mp4`;
  try{
    let manual={}; 
    if(req.body.manual) manual=JSON.parse(req.body.manual);
    const cta = (manual.ctaText||'Follow for More').replace(/:/g,'');
    
    // Railway ke liye simple filter - crash nahi hoga
    const vf = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=saturation=1.2`;
    const af = `loudnorm=I=-16:TP=-1.5:LRA=11`;

    ffmpeg(input).videoFilters(vf).audioFilters(af).videoBitrate('2500k').outputOptions(['-preset','ultrafast'])
      .output(output)
      .on('end',()=> res.download(output,()=>{ try{fs.unlinkSync(output);fs.unlinkSync(input);}catch{}}))
      .on('error',e=>{ console.log(e); res.status(500).send(e.message); })
      .run();
  }catch(e){ res.status(500).send(e.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log('Running on '+PORT));
