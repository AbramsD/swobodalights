var access_token = "";
function statusChangeCallback(response){
  	if (response.status === 'connected'){
      console.log('logged in.');
      buildLaunchBoard(response);
    }
    else {
    	console.log('response status: ' + response.status);
    	console.log ('not logged in');
      document.getElementById("main-content").innerHTML = "Please Log in with Facebook";
    }
}

function buildLaunchBoard(){
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200){
        document.getElementById("main-content").innerHTML = this.responseText;
      }
    };
    xhttp.open("Get", "/launchBoard", true);
    xhttp.send();

}

function signAndCall(method, url, readyStatehandler){
	xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = readyStatehandler;
	xhttp.open(method, url, true);
	xhttp.send();
}

function onLaunch(showId){
	var x = document.querySelectorAll(".button");
  var i;
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }

  var gif = document.getElementById("loadingGif");
  gif.style.visibility = "visible";

  signAndCall("Get", "/startShow?showId=" + showId, function(){
    if (this.readyState == 4 && this.status == 200){
          history.pushState({}, null, "");
        	document.getElementById("main-content").innerHTML = this.responseText;
    }
    else if(this.readyState == 4 && this.status != 200){
      setSorry();
    }
	});
}


function setSorry(){
	signAndCall("Get", "/sorry", function(){
		if (this.readyState == 4 && this.status == 200){
          history.pushState({}, null, "");
        	document.getElementById("main-content").innerHTML = this.responseText;
        }
	});
}