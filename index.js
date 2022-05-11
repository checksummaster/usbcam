import camerahelper from "./camerahelper.js"

async function main()
{
       
    var video = document.querySelector("#video");
    video.autoplay = true;
 
    


    var camh = new camerahelper(video,(ready,status,cam) =>{
        if (ready) {
            video.style.width=`${status.width}px`;
            video.style.height=`${status.height}px`; 
            video.width = status.width;
            video.height = status.height;
        }

    });
    await camh.askpermission();
    camh.makemenu(document.querySelector("#cameraselect"),document.querySelector("#resolutionselect"),false,document.querySelector("#codec"));

    document.querySelector('#rescan').onclick = ()=>{
        camh.makemenu(document.querySelector("#cameraselect"),document.querySelector("#resolutionselect"),true);
    }
}

main();

