

export default function camerahelper(videodom,readyfunction)
{
    var global_resolutions = [
        {name:"QQVGA", width:160, height:120},
        {name:"QCIF", width:176, height:144},
        {name:"QCIF", width:192, height:144},
        {name:"HQVGA", width:240, height:160},
        {name:"QVGA", width:320, height:240},
        {name:"Video CD NTSC", width:352, height:240},
        {name:"Video CD PAL", width:352, height:288},
        {name:"xCIF", width:384, height:288},
        {name:"360p", width:480, height:360},
        {name:"nHD", width:640, height:360},
        {name:"VGA", width:640, height:480},
        {name:"SD", width:704, height:480},
        {name:"DVD NTSC", width:720, height:480},
        {name:"WGA", width:800, height:480},
        {name:"SVGA", width:800, height:600},
        {name:"DVCPRO HD", width:960, height:720},
        {name:"XGA", width:1024, height:768},
        {name:"HD", width:1280, height:720},
        {name:"WXGA", width:1280, height:800},
        {name:"SXGA−", width:1280, height:960},
        {name:"SXGA", width:1280, height:1024},
        {name:"UXGA", width:1600, height:1200},
        {name:"FHD", width:1920, height:1080},
        {name:"QXGA", width:2048, height:1536},
        {name:"QSXGA", width:2560, height:2048},
        {name:"QUXGA", width:3200, height:2400},
        {name:"DCI 4K", width:4096, height:2160},
        {name:"HXGA", width:4096, height:3072},
        {name:"UW5K", width:5120, height:2160},
        {name:"5K", width:5120, height:2880},
        {name:"WHXGA", width:5120, height:3200},
        {name:"HSXGA", width:5120, height:4096},
        {name:"WHSXGA", width:6400, height:4096},
        {name:"HUXGA", width:6400, height:4800},
        {name:"8K UHD", width:7680, height:4320},
        {name:"WHUXGA", width:7680, height:4800},
        {name:"UW10K", width:10240, height:4320} 
    ];
    this.status = {}
    this.message = "";

    this.activatevideo = false;

    
    videodom.onloadedmetadata = () => {
        if (this.activatevideo ) {
            this.activatevideo = false;            
            this.webcamactive = false;
            this.status.width = videodom.videoWidth;
            this.status.height = videodom.videoHeight;
        }
        readyfunction(true,this.status,this.webcamactive);
    }
    
    this.askpermission = ()=>navigator.mediaDevices.getUserMedia({video: true});

    this.devices=()=>{
        return new Promise((resolve,reject)=>{
            navigator.mediaDevices.enumerateDevices().then(v=>{
                resolve(v.filter((v)=>v.kind==='videoinput'))
            }).catch(e=>{
                reject(e);
            })
        })
    }
    this.start=(deviceId, width, height,sup)=>{
        this.webcamactive = true;
        videodom.loop = false;
        videodom.controls = false;
        
        return new Promise((resolve,reject)=>{
            var conf = { video: {} };
            if (deviceId) conf.video.deviceId = {exact:deviceId};
            if (width) conf.video.width = {exact:width};
            if (height) conf.video.height =  {exact:height};
            if (sup) conf.video = {...conf.video, ...sup}

            console.log('try',conf);
            navigator.mediaDevices.getUserMedia(conf).then( (stream) =>{
                this.stream = stream;
                this.status = this.stream.getVideoTracks()[0].getSettings();
                videodom.srcObject = this.stream;
                resolve(this.stream)
            })
            .catch(e=>{
                reject(e);
            });
        });
    }
    
    this.stop=(stream)=>{
        this.status = {}
        if (readyfunction) readyfunction(false,this.status)
        if (this.stream) {
            var tracks = this.stream.getTracks();
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                track.stop();
            }
            this.stream = undefined;            
        }
    }

    this.webcamactive = false;
    this.waitframe= async ()=>{
        if (videodom.readyState < 2) {
            await new Promise(resolve => {
                if (this.webcamactive) {
                    videodom.onloadeddata = () => {
                        resolve(video);
                    };
                }
                else {
                    resolve(video);
                }
            });            
        }
    }
/*
    this.ready= async()=>{
        await new Promise(resolve => {
           // videodom.onloadedmetadata = () => {
              resolve(video);
           // };
        });
    }
*/
    this.findresolution = false;

    this.resolutions=async (deviceId,customresolution,reset)=>{

        return new Promise(async (resolve,reject)=>{
            var ret = localStorage.getItem(deviceId); // Since this function take a lot of time, let save the result since it will probably never change
            if (ret) {
                ret = JSON.parse(ret);
            }

            if (/*ret === null || */reset) {
                this.findresolution = true;

                ret = [];
                var list = global_resolutions;
                if (customresolution) {
                    list = global_resolutions.concat(customresolution);
                }
                for (var i of list ) {
                    try {
                        this.message = `try ${JSON.stringify(i)}`
                        console.log(`try ${JSON.stringify(i)}`);
                        this.stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                                deviceId :{exact:deviceId}, 
                                width:{ideal:i.width},
                                height:{ideal:i.height}
                            }
                        });
                        let stream_settings = this.stream.getVideoTracks()[0].getSettings();
                        if (stream_settings.width === i.width && stream_settings.height === i.height) {
                            i.data = stream_settings;
                            ret.push({name:`${i.name} ${i.width}x${i.height}`,data:stream_settings});
                        }
                        var tracks = this.stream.getTracks();
                        for (var i = 0; i < tracks.length; i++) {
                            
                            var track = tracks[i];
                            track.stop();
                        }
                        this.stream = undefined;
                    }
                    catch(e) {
                        break;
                    }
                }
                this.message = "";
                if (ret.length > 0) {
                    localStorage.setItem(deviceId, JSON.stringify(ret));
                }
                this.findresolution = false;
            }
            resolve(ret);
        })
    }



    this.makemenu=async (cameraselect,resolutionselect,reset,codecPreferences)=>{
        if (!reset) reset = false;
        var devices = await this.devices();    
    
        console.log(devices);
    
        var defaultcam = localStorage.getItem('defaultcam');
        makechoices(devices,'label','deviceId',undefined,async v=>{
            if (this.stream) {
                this.stop(this.stream); 
            }
            var res = await this.resolutions(v,[
                {name:"stereo960",width:2*1280,height:960},
                {name:"stereo1080",width:2*1280,height:1080}
            ],reset);
            reset = false;

            this.stream = await this.start(v);
            let stream_settings = this.stream.getVideoTracks()[0].getSettings();
            localStorage.setItem('defaultcam',v);

            if (res) {
                var defaultres = res.filter(v=>v.data.width === stream_settings.width && v.data.height === stream_settings.height  )[0];
                makechoices(res,'name','name',defaultres?defaultres.name:"",async v=>{
                    if (this.stream) {
                        this.stop(this.stream); 
                    }
                    var conf = res.filter(v2=>v2.name===v)[0];
                    this.stream = await this.start(conf.data.deviceId,conf.data.width,conf.data.height);
                },resolutionselect)  
            } else {
                resolutionselect.innerHTML = "";
            }
        },cameraselect);
        cameraselect.value = defaultcam?defaultcam:devices[0].deviceId;
        if (cameraselect.value !== "") cameraselect.onchange(cameraselect.value)

        
        if (codecPreferences) {

            this.codecPreferences = codecPreferences;
            codecPreferences.innerHTML = "";
            this.getSupportedMimeTypes().forEach(mimeType => {
                const option = document.createElement('option');
                option.value = mimeType;
                option.innerText = option.value;
                codecPreferences.appendChild(option);
            });
        }
    }

    this.getSupportedMimeTypes = ()=> {
        const possibleTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=h264,opus',
          'video/webm;codecs=avc1,opus',
          'video/mp4;codecs=avc1,aac',
          'video/mp4;codecs=h264,aac',
          'video/x-matroska;codecs=avc1,opus'
        ];
        return possibleTypes.filter(mimeType => {
          return MediaRecorder.isTypeSupported(mimeType);
        });
    }

    this.record = {
        onerror : null,
        onpause : null,
        onresume : null,
        onstart : null,
        onstop : null,
        onwarning : null
    }

    this.makeallvideo;

    this.startrecord = (stream,allvideo)=>{

        this.makeallvideo = false;
        if (this.webcamactive === false && allvideo) {
            this.makeallvideo = true;
            videodom.loop = false;
            videodom.controls = false;
            videodom.pause();
            videodom.currentTime = 0;
            videodom.onended = ()=>{
                this.stoprecord(true);
                videodom.loop = true;
                videodom.controls = true;
                videodom.play();
            }
        }

        this.recordedBlobs = [];
        const mimeType = this.codecPreferences.options[this.codecPreferences.selectedIndex].value;
        const options = {mimeType};
        if (stream === undefined) {
            stream = this.stream;
        }      
        this.mediaRecorder = new MediaRecorder(stream, options);

        this.mediaRecorder.onerror = e => {
            if (this.record.onerror) this.record.onerror();
        };
        this.mediaRecorder.onpause = e => {
            if (this.record.onpause) this.record.onpause();
        };
        this.mediaRecorder.onresume = e => {
            if (this.record.onresume) this.record.onresume();
        };
        this.mediaRecorder.onstart = e => {
            if (this.makeallvideo) {
                video.play();
            }
            if (this.record.onstart) this.record.onstart();
        };
        this.mediaRecorder.onstop = e => {
            if (this.makeallvideo) {
                video.play();
            }
            if (this.record.onstop) this.record.onstop();
        };
        this.mediaRecorder.onwarning = e => {
            if (this.record.onwarning) this.record.onwarning();
        };
        
        
        this.mediaRecorder.ondataavailable = (event)=> {            
            if (event.data && event.data.size > 0) {
              this.recordedBlobs.push(event.data);
            }
        };
        this.mediaRecorder.start();

    }

    

    this.stoprecord = (force)=> {

        this.mediaRecorder.stop();
        this.mediaRecorder = undefined
        videodom.onended = null;
        if (this.makeallvideo) {
            videodom.loop = true;
            videodom.controls = true;
            videodom.play();
        }
        
    }

    this.isrecording = ()=>{
        return this.mediaRecorder !== undefined
    }



    this.getblob = ()=> {
        const mimeType = this.codecPreferences.options[this.codecPreferences.selectedIndex].value.split(';');
        return new Blob(this.recordedBlobs, {type: mimeType});
    }
    this.getmime = ()=> {
        var val = this.codecPreferences.options[this.codecPreferences.selectedIndex].value;
        return val;
    }

    this.getextention = ()=> {
        var val = this.codecPreferences.options[this.codecPreferences.selectedIndex].value.split(';')[0].split('/')[1];
        if (val === 'x-matroska' ) val = 'mkv';
        return val;
    }


    this.playvideo = (l,name)=> {
        this.stop();
        
        videodom.loop = true;
        videodom.controls = true;
        
        videodom.srcObject = undefined
        videodom.src = l

        this.activatevideo = true;

        this.status = {
            video:name
        } 
    }
}


function makechoices(obj,label,value,def,f,select)
{
    if (select === undefined) {
        select = document.createElement('SELECT');
    }
    select.innerHTML = "";
    for (var i of obj) {
        var option = document.createElement('option');
        option.text = i[label];
        option.value = i[value];
        if (i[label] === def) option.selected = true;
        select.add(option);
    }

    select.onchange = v=>{
        f(select.value)
    }
    return select;
}

