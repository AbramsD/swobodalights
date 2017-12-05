var access_token = "";
function statusChangeCallback(response){
  	if (response.status === 'connected'){
      console.log('logged in.');
      buildLaunchBoard(response);
    }
    else {
    	console.log('response status: ' + response.status);
    	console.log ('not logged in');
      document.getElementById("main-content").innerHTML = "";
    }
}

function buildLaunchBoard(response){
    access_token = response.authResponse.accessToken;
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200){
        document.getElementById("main-content").innerHTML = this.responseText;
      }
    };
    xhttp.open("Get", "/launchBoard", true);
    xhttp.setRequestHeader("access_token", response.authResponse.accessToken);
    xhttp.send();

}

function signAndCall(method, url, readyStatehandler){
	xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = readyStatehandler;
	xhttp.open(method, url, true);
	xhttp.setRequestHeader("access_token", access_token);
	xhttp.send();
}

function onLaunch(showId){
	signAndCall("Get", "/startShow?showId=" + showId, function(){
		console.log("ready state: " +this.readyState);
    console.log("status: " + this.status);
    if (this.readyState == 4 && this.status == 200){
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
        	document.getElementById("main-content").innerHTML = this.responseText;
        }
	});
}