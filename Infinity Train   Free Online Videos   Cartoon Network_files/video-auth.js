/**********************************
		Auth code
**********************************/

function CartoonAuth() {

	var auth = CVP.AuthManager;
	var _self = this;
	_self.userLoggedIn = false;

	auth.init({
		site: 'cn',
		requestorId: 'CartoonNetwork',
		logLevel: 'info',
		refreshlessLogin: false,
		refreshlessLogout: false
	});

	auth.on('initReady', function() {
		// check authentication status
		auth.checkAuthentication();
	});

	// tracking data for analytics
	auth.on('trackingData', function(data) {
		var trackingData = data.trackingData;

		if (data.eventType === 'authenticationDetection') {
			if (Array.isArray(trackingData) && trackingData.length > 3) {
				// store some MVPD data for VHL
				video_metadata.mvpd = trackingData[1];
				video_metadata.adobe_hashid = trackingData[2];
				turner_metadata.mvpd = trackingData[1];
				turner_metadata.adobe_hashid = trackingData[2];

				/* 
				 *	tracking for successful login event
				 *	
				 *	notes from ME team:
				 *	   trackingData[3] is a boolean that will tell you if the token was cached or not.  
				 *	   If not cached, then the authentication was during actual login.  
				 *	   If cached, then the authentication token was stored from previous authentication
				 */
				if (trackingData[3] === false) {
					// the token was not cached, so fire the Analytics call
					if (typeof sendEvent === "function") { 
						var data = {
							mvpd: video_metadata.mvpd,
							adobe_hash_id: video_metadata.adobe_hashid,
							pagename: "tve:successfull login",
							interaction: "tve:successfull login",
							success: true
						}
						sendEvent("picker-click", data);
					}
				}
			}
		}
	});

	// event handler for when the user selected an MVPD provider
	auth.on('pickerMvpdSelected', function(data) {
		if (typeof sendEvent === "function") { 
			var data = {
				mvpd: data.mvpdId,
				adobe_hash_id: "no mvpd set",
				pagename: "tve:picker:" + data.mvpdId,
				interaction: "tve:picker:" + data.mvpdId,
				success: false
			}
			sendEvent("picker-click", data);
		}
	});

	// event handler for authentication passed
	auth.on('authNPass', function(data) { 
		log("onAuthenticationPassed");

		var mvpdConfig = data.mvpdConfig;
			
		// update log-in button
		$('#login-button').html('LOG OUT').removeClass('loading').addClass("logOut");
		
		// add the partner logo
		if (typeof mvpdConfig.cobrand[0].url != 'undefined'){
			var logo =  mvpdConfig.cobrand[0].url;
			$('#livestream-partner').css('background-image', 'url(' + logo + ')').addClass('active');
		}

	});

	// event handler for authentication failed
	auth.on('authNFail', function() { 
		log("onAuthenticationFailed");

		// call global function dependent on Authentication Failing in video-global.js
		tveNotAuthorized();
		_self.userLoggedIn = false;
	});

	// event handler for authorization passed
	auth.on('authZPass', function(data) { 
		log("onAuthorizationPassed");

		// call global function dependent on Authentication/Authorization in video-global.js
		tveAuthorized();
		_self.userLoggedIn = true;
	});

	// show the help window when the help button is clicked
	auth.on("pickerHelpClicked", function() {
		var helpWindow = $('#auth-help-overlay');
		helpWindow.appendTo("#mvpdpicker").addClass('active');

		$('.auth-help-close-button').click(function(event){
			helpWindow.removeClass('active');
		});
	});

	// get the adobe token for authenticated videos
	this.getAdobeToken = function(resourceId) {
		return auth.ready
				.then(function(value) { return auth.requestAuthN();           })
				.then(function(value) { return auth.requestAuthZ(resourceId); })
				.then(function(value) { return auth.getAccessToken();         })
	};

	// click handler for the "log in" button
	this.loginClick = function(){ 
		// handle click state different based on if user is already logged in or not
		if(_self.userLoggedIn === false){
			auth.getAuthentication();
		} else {
			auth.logout()
		}       
	}

	// wrapper for logout function (to expose it to other functions)
	this.logout = function() {
		auth.logout();
	}

}
