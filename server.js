const express=require('express');const cors=require('cors');const multer=require('multer');const fs=require('fs');const ffmpeg=require('fluent-ffmpeg');const ffmpegPath=require('ffmpeg-static');ffmpeg.setFfmpegPath(ffmpegPath);
const app=express();app.use(cors());app.use(express.json({limit:'100mb'}));
const upload=multer({dest:'uploads/'});['uploads','outputs'].forEach(d=>{if(!fs.existsSync(d))fs.mkdirSync(d);});
app.get('/',(r,s)=>s.send('EDITOFY AUTO 15 + MANUAL 7 Running'));
const clean=p=>setTimeout(()=>{try{if(fs.existsSync(p))fs.unlinkSync(p)}catch{}},180000);

app.post('/auto-edit',upload.single('video'),(req,res)=>{
  if(!req.file) return res.status(400).send('video missing');
  const inp=req.file.path; const out=`outputs/AUTO_${Date.now()}.mp4`;
  let vf=[], af=[];
  af.push('silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-60dB:window=0.5');
  af.push('afftdn,highpass=f=80,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=11');
  vf.push('deshake');
  vf.push('crop=ih*9/16:ih:(iw-ow)/2:0,scale=1080:1920:flags=lanczos');
  vf.push('eq=saturation=1.4:contrast=1.1:brightness=0.05');
  vf.push('setpts=0.833*PTS'); af.push('atempo=1.2');
  vf.push('hqdn3d=4:4:6:6,unsharp=5:5:1.0:5:5:0.0');
  const m=req.body.manual?JSON.parse(req.body.manual):{};
  if(m.slowMo){vf.push('setpts=2*PTS'); af.push('atempo=0.5');}
  if(m.motionBlur) vf.push('tmix=frames=3');
  if(m.blurBg) vf.push('gblur=sigma=15');
  if(m.captions) vf.push(`drawtext=text='VIRAL HOOK':fontcolor=white:fontsize=80:box=1:boxcolor=black@0.6:x=(w-text_w)/2:y=100`);
  vf.push(`drawtext=text='${(m.ctaText||'Follow for More!').replace(/:/g,'\\:') }':fontcolor=yellow:fontsize=70:box=1:boxcolor=black@0.8:x=(w-text_w)/2:y=h-th-200:enable='gte(t\\,duration-3)'`);
  ffmpeg(inp).videoFilters(vf.join(',')).audioFilters(af.join(',')).videoBitrate('4500k').audioBitrate('320k').outputOptions(['-preset','ultrafast','-r','30']).output(out)
  .on('end',()=>res.download(out,()=>{clean(out);clean(inp);})).on('error',e=>{console.log(e.message);res.status(500).send(e.message);clean(inp);}).run();
});
app.listen(process.env.PORT||3000,()=>console.log('AUTO 15+7 Live'));
