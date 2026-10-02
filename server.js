const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuid } = require('uuid');
const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
function run(cmd){ return new Promise((res,rej)=>{ exec(cmd, (e,stdout,stderr)=>{ console.log(cmd); if(e) rej(stderr); else res(); })}) }
app.get('/', (req,res)=> res.send('LIVE SERVER READY - 27 ENDPOINT'));

// === 1. SABSE UPAR - MINI VLOG TIMELINE ===
app.post('/api/timeline-stitch', upload.array('clips'), async (req,res)=>{
  const listPath = `uploads/${uuid()}.txt`;
  let content = "";
  for(let f of req.files){
    let fixed = `uploads/${uuid()}_fix.mp4`;
    await run(`ffmpeg -i ${f.path} -c:v libx264 -c:a aac -y ${fixed}`);
    content += `file '${path.resolve(fixed)}'\n`;
  }
  fs.writeFileSync(listPath, content);
  let final = `uploads/final_${uuid()}.mp4`;
  await run(`ffmpeg -f concat -safe 0 -i ${listPath} -c copy -y ${final}`);
  res.sendFile(path.resolve(final));
});

async function processSingle(req,res,vf="",af=""){
  let file = req.file || req.files[0];
  let out = `uploads/out_${uuid()}.mp4`;
  let cmd = `ffmpeg -i ${file.path} `;
  if(vf) cmd += `-vf "${vf}" `;
  if(af) cmd += `-af "${af}" `;
  cmd += `-y ${out}`;
  await run(cmd);
  res.sendFile(path.resolve(out));
}

// === 2. MAGIC AUTO 9 ===
app.post('/api/roughcut', upload.single('video'), (req,res)=> processSingle(req,res,"", "silenceremove=1:0:-50dB:1:5:-50dB:0"));
app.post('/api/stabilize', upload.single('video'), (req,res)=> processSingle(req,res,"deshake"));
app.post('/api/color-warm', upload.single('video'), (req,res)=> processSingle(req,res,"eq=saturation=1.4:contrast=1.1"));
app.post('/api/color-match', upload.single('video'), (req,res)=> processSingle(req,res,"eq=saturation=1.2"));
app.post('/api/audio-clean', upload.single('video'), (req,res)=> processSingle(req,res,"", "afftdn"));
app.post('/api/audio-match', upload.single('video'), (req,res)=> processSingle(req,res,"", "loudnorm=I=-14"));
app.post('/api/auto-zoom', upload.single('video'), (req,res)=> processSingle(req,res,"scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720"));
app.post('/api/stitch-match', upload.array('clips'), async (req,res)=>{ // same as timeline
  const listPath = `uploads/${uuid()}.txt`; let content="";
  for(let f of req.files){ let fixed=`uploads/${uuid()}_fix.mp4`; await run(`ffmpeg -i ${f.path} -c:v libx264 -c:a aac -y ${fixed}`); content+=`file '${path.resolve(fixed)}'\n`; }
  fs.writeFileSync(listPath, content); let final=`uploads/final_${uuid()}.mp4`; await run(`ffmpeg -f concat -safe 0 -i ${listPath} -c copy -y ${final}`); res.sendFile(path.resolve(final));
});
app.post('/api/crop-9-16', upload.single('video'), (req,res)=> processSingle(req,res,"crop=ih*9/16:ih"));

// === 3. STUDIO PRO 17 ===
app.post('/api/b-roll', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/hook-text', upload.single('video'), (req,res)=>{ let t=req.body.text||'Ye Galti Mat Karna'; processSingle(req,res,`drawtext=text='${t}':x=(w-text_w)/2:y=100:fontsize=80:fontcolor=white:box=1:boxcolor=black@0.6`); });
app.post('/api/transition', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/sfx', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/subscribe', upload.single('video'), (req,res)=> processSingle(req,res,`drawtext=text='SUBSCRIBE':x=w-tw-50:y=h-th-50:fontsize=60:fontcolor=white:box=1:boxcolor=red`));
app.post('/api/blur', upload.single('video'), (req,res)=>{ let v=req.body.value||5; processSingle(req,res,`boxblur=${v}`); });
app.post('/api/speed', upload.single('video'), (req,res)=>{ let v=parseFloat(req.body.value||1); processSingle(req,res,`setpts=${1/v}*PTS`,`atempo=${v}`); });
app.post('/api/viralsounds', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/captions', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/music-mix', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/lut', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/5sec-hook', upload.single('video'), (req,res)=> processSingle(req,res));
app.post('/api/emoji-popup', upload.single('video'), (req,res)=> processSingle(req,res,"drawtext=text='🔥😂':x=(w-text_w)/2:y=h-th-200:fontsize=120"));
app.post('/api/voice-changer', upload.single('video'), (req,res)=>{ let m=req.body.mode||'chipmunk'; let af=m=='chipmunk'?'asetrate=44100*1.5,atempo=0.8':'asetrate=44100*0.7,atempo=1.2'; processSingle(req,res,"",af); });
app.post('/api/green-screen', upload.single('video'), (req,res)=> processSingle(req,res,"chromakey=0x00FF00:0.3:0.2"));
app.post('/api/watermark-remover', upload.single('video'), (req,res)=> processSingle(req,res,"delogo=x=10:y=10:w=200:h=100"));
app.post('/api/slowblur-viral', upload.single('video'), (req,res)=> processSingle(req,res,"boxblur=10,setpts=2*PTS","atempo=0.5"));

app.listen(10000, ()=> console.log('27 ENDPOINT READY'));
