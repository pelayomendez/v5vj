/*
 * v5vj.js
 * Diciembre 2012
 * 
 * v 0.0.5
 * welovecode.net
 * 
 */

/*** CONFIG **************************************************/

var debugging = true;
var stageWidth = 854;
var stageHeight = 480;

var appName = "v5vj";
var appVersion = "0.0.5";

/*** HTML5CVVJ **************************************************/

var v5vj = (function(){
	
	var canvas, context;
	var canvaslive, contextlive;
	
	var liveWindow;
	var dataURL;
	
	var videOnStage;
	var listVideos = new Array();
	var activeVideo = -1;
	
	var socket;
	var socketOnline = false;
	
	var init = function(targetDIV,userWidth,userHeight,videoList){
		
		startRender();
		setupCanvas(targetDIV,videoList);
		//liveWindow();
	
	};
	
	var startRender = function(){
	
		// requestAnim shim layer by Paul Irish
		window.requestAnimFrame = (function(){
  		return (
		    window.requestAnimationFrame       || 
		    window.webkitRequestAnimationFrame || 
		    window.mozRequestAnimationFrame    || 
		    window.oRequestAnimationFrame      || 
		    window.msRequestAnimationFrame
		);
		})();
	
		var lastTime = 0;
		if(!window.requestAnimFrame){
			window.requestAnimFrame = function(callback, element){
		    	var currTime = new Date().getTime();
		    	var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		    	var id = window.setTimeout(function() { callback(currTime + timeToCall); },
		        timeToCall);
		        lastTime = currTime + timeToCall;
		        return id;
		   };
		}
		
		function animate() {
			var fps = 60;
    		setTimeout(function() {
        		requestAnimFrame( animate );
        		// Drawing code goes here
        		v5vj.drawStage();
    		}, 1000 / fps);
		}
	
		animate();
		
	};
	

	var setupCanvas = function(targetDIV,videoList){
	
		canvas = document.createElement( 'canvas' );
    	canvas.width = stageWidth;
    	canvas.height = stageHeight;
    	context = canvas.getContext( '2d' );
   		document.getElementById(targetDIV).appendChild( canvas );

   		for (i=0;i<videoList.length;i++) {
   			listVideos[i] = new v5vj_video(videoList[i],i);
   		}
		
		//activeVideo = 0;
		//videOnStage = listVideos[activeVideo].video;

	};
	
	var drawStage = function(){
		
		if(activeVideo > -1) {
		if (videOnStage.currentTime > 0.1 && !videOnStage.paused && !videOnStage.ended) {
			context.drawImage(videOnStage, 0, 0,stageWidth,stageHeight);
			if(socketOnline) {
				//contextlive.drawImage(videOnStage, 0, 0,stageWidth,stageHeight);
				dataURL = canvas.toDataURL('image/jpeg',0.2);
				socket.emit('newFrame',dataURL);
			}
		}
		}
	};
	
	var changeVideo = function(videoNumber)
	{
		if(activeVideo == -1) {
			activeVideo = videoNumber;
			videOnStage = listVideos[videoNumber].video;
			videOnStage.play();	
		} else {
			videOnStage.pause();	
			videOnStage = listVideos[videoNumber].video;
			activeVideo = videoNumber;
			videOnStage.play();	
		}
		
	};
	
	var getVideoInfo = function(videoNumber)
	{
		return listVideos[videoNumber].getPercentLoaded();
	};
	
	var liveWindow = function()
    {
    	
    	if(winPop && !winPop.closed){  //checks to see if window is open  
    		winPop.focus();  
  		}  else{  
    	
        liveWindow = pop_up("","liveWindow",stageWidth,stageHeight);
        var destWinDoc = liveWindow.document;
        var destWinHTML = "<!DOCTYPE html><html><head><title>.: live window :.</title><body style='margin:0px;'></body></html>";
        destWinDoc.write(destWinHTML);
        
        canvaslive = destWinDoc.createElement( 'canvas' );
    	canvaslive.width = stageWidth;
    	canvaslive.height = stageHeight;
    	contextlive = canvaslive.getContext( '2d' );
   		destWinDoc.body.appendChild( canvaslive );
   		
   		e = document.getElementById("fullscreen");

		canvaslive.onclick = function() {
				doFullScreen();
		}
   		
   		}  
                      
    };
    
    var doFullScreen = function() 
    {

    	if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) {
			RunPrefixMethod(document, "CancelFullScreen");
		}
		else {
			RunPrefixMethod(canvaslive, "RequestFullScreen");
		}
    	
    };

    var connectToServer = function()
    {
    	
    	var headID = document.getElementsByTagName("head")[0];         
		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.src = 'http://localhost:8080/socket.io/socket.io.js';
		headID.appendChild(newScript);
		
		// Bug: Aqui habria que saber cuando se completa el appendchild
		// Lo que hago es epserar un segundo de momento.
		
		socketOnline = "waiting...";
		setTimeout(function() {
    	if(window.io) {
    		
    		
    		
	    	socket = io.connect('http://localhost:8080/');
	  		socket.on('connect', function () {
		    	socketOnline = "true";
		    	socket.on('message', function (msg) {
		    	});
	  		});
  		} else {
  			socketOnline = "false";
  		}
  		}, 1000);
  		
    };
    
    var getServerInfo = function()
	{
		return appName + " | " + appVersion + " | server online: " + socketOnline;
	};

	return{
		
		startRender: startRender,
		init : init,
		setupCanvas : setupCanvas,
		drawStage : drawStage,
		changeVideo: changeVideo,
		getVideoInfo: getVideoInfo,
		liveWindow : liveWindow,
		doFullScreen : doFullScreen,
		connectToServer: connectToServer,
		getServerInfo: getServerInfo
	
	};

})();




/*** VIDEO OBJECT ***********************************************/

function v5vj_video(videoURL,videoID) {

	var percentLoaded = 0;

	this.video = null;
	this.url = videoURL;
	this.id = videoID;
	
	this.init = function(){

		this.video = document.createElement('video');
		
		this.video.controls = false;
		this.video.autoplay = false;
		//this.video.autobuffer = true;
		//this.video.loop = true;
		//this.video.seeking = true;
		this.video.muted = true;

   		if (this.video.canPlayType) {
		    // Check for MPEG-4 support
		    mpeg4 = "" !== this.video.canPlayType( 'video/mp4; codecs="mp4v.20.8"' );
		    // Check for Webm support
		    webm = "" !== this.video.canPlayType( 'video/webm; codecs="vp8, vorbis"' );
		}
		if(webm) {
			this.video.src = this.url+'.webm';
		} else {
			this.video.src = this.url+'.mp4';
		}
		
	  	this.video.addEventListener('ended', function () {
	  		this.pause();
	    	this.currentTime = 0;
	    	this.play();
	  	}, false);
		
		this.video.addEventListener('progress',function (e) {
			//alert(this.buffered.length);
			if(this.buffered.length > 0){
	  			percentLoaded = parseInt(((this.buffered.end(0) / this.duration) * 100));
	  		}
	  	}, false);
		
		this.video.addEventListener('canplaythrough',function (e) {
	  		//this.play();
			//this.pause();
	  	}, false);
		
		this.video.play();
		this.video.pause();
		
	};
	
	
	this.getPercentLoaded = function(){
		return percentLoaded;
	};
	
	this.init();
	
};


/*** UTILS *****************************************************/

var trace = function( str )
{
	if(debugging){
		console.log( str );
	}
}

var winPop;

var pop_up = function(hyperlink, window_name,ww,wh)
{
		
	if (!window.focus)
		return true;
		
	var href;
	if (typeof(hyperlink) == 'string')
		href=hyperlink;
	else
		href=hyperlink.href;
	
	winPop = window.open(
			href,
			window_name,
			'width='+(ww)+',height='+(wh)+',toolbar=no, scrollbars=no'
	);
	return winPop;
	
}

var pfx = ["webkit", "moz", "ms", "o", ""];
function RunPrefixMethod(obj, method) {
	
	var p = 0, m, t;
	while (p < pfx.length && !obj[m]) {
		m = method;
		if (pfx[p] == "") {
			m = m.substr(0,1).toLowerCase() + m.substr(1);
		}
		m = pfx[p] + m;
		t = typeof obj[m];
		if (t != "undefined") {
			pfx = [pfx[p]];
			return (t == "function" ? obj[m]() : obj[m]);
		}
		p++;
	}

}




