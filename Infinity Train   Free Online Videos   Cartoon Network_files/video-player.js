
/**************************************************
	required JS for all pages with a video player 
 **************************************************/
	
$(function(){
	
	/* 
	 * show the next group of episodes when the user clicks "show more"
	 */
	$('#show-more').click(function() {
		var videosPerPage = getVideosPerPage();
		var clipList = $(".cn-videopage-relatedinfo-entry-wrapper-collectionview .cn-videopage-relatedinfo-entry-collectionview");
		var hiddenClips = $(".cn-videopage-relatedinfo-entry-wrapper-collectionview .cn-videopage-relatedinfo-entry-collectionview.hidden-clip");

		/* loop through the episodes that aren't currently displayed */
		for (var i = 0; i < videosPerPage; i++) {
			var index = hiddenClips.eq(i).index();
			var imageElement = clipList.eq(index).find(".cn-videopage-relatedinfo-thumb-img-collectionview");
			var imageURL = imageElement.attr("data-src");

			/* set the image URL to the one stored in the element and then display the episode */
			imageElement.attr("src", imageURL);
			hiddenClips.eq(i).removeClass("hidden-clip");

			/* on the last element, hide the show more button */
			if (index == clipList.length-1) {
				$("#show-more-container").hide();
				break;
			}
		}
	});

	/* enable description in single column view */
	var singleColDescState = false;

	$('#cn-videopage-ep-description-btn a').click(function() {
		if (!(singleColDescState)) {
			singleColDescState = true;
			$('#cn-videopage-ep-description-btn a').addClass('active');
			$('#cn-videopage-ep-description-copy').css('display','block');
		} else {
			singleColDescState = false;
			$('#cn-videopage-ep-description-btn a').removeClass('active');
			$('#cn-videopage-ep-description-copy').css('display','none');
		}
	});

}); 

/**********************************
			TOP code
 **********************************/

function CartoonTOP() {

	var _self = this;
	var player;
	var adLabel = $('#ad-video-label');
	var playerOptions = {};

	// initialize the TOP code
	this.init = function() {

		// if on mobile device and it's NOT a clip, show the mobile slate 
		if (_cnglobal.device.deviceName !== 'DesktopOthers' && _cnglobal.currentVideo.videoType !== "clip") {
			_self.showMobileSlate();
			return;
		}

		// if we don't have a freewheel ID set, then use the generic one
		if (typeof _cnglobal.freewheelID === "undefined" || _cnglobal.freewheelID === "") {
			_cnglobal.freewheelID = "cn.com_videopage";
		}

		// create a config object to hold the settings for the TOP player
		var playerConfig = {
			ads : {
				serverBaseUrl : "//bea4.v.fwmrm.net/ad/g/1",
				networkId     : 48804,
				assetId       : "${content.id}",
				section       : _cnglobal.freewheelID,
				profile       : "turner_html5_pem2",
				kvps: {
					_fw_coppa: "1"
				}
			},
			plugins : [
				{
					kind : 'top.plugins.conviva',
					metadata : {
						customerKey    : _cnglobal.conviva.customerKey,
						applicationName: 'Cartoon - Desktop',
						touchstoneUrl  : _cnglobal.conviva.touchstoneUrl
					}
				}
			],
			auth : [
				{
					type       : TOP.auth.AuthTokenType.Spe,
					serviceUrl : _cnglobal.top.tokenServiceURL
				}
			],
			metadata : {
				appId : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6ImNuLXR2ZS13ZWItdmdyOW5wIiwicHJvZHVjdCI6InR2ZSIsIm5ldHdvcmsiOiJjbiIsInBsYXRmb3JtIjoid2ViIiwiaWF0IjoxNTI5MzYwODU3fQ.mPs2iI35riz6C5RefVyWHmOd4ezF_m3hedWMDMOaVuY"
			}
		};

		// if we are on a video player that isn't supposed to display ads, then remove the ads section from the config
		if (_cnglobal.template === "stopBullying") {
			playerConfig.ads = {};
		}

		// initialize the TOP player
		player = TOP.createAndInitPlayer({
			element: document.getElementById('cnTopPlayer'),
			config: playerConfig,
			events: {
				playerReady : _self.playerReady,
				mediaStarted : _self.videoStarted,
				mediaPaused : _self.videoPaused,
				mediaResumed : _self.videoResumed,
				contentCompleted : _self.playNextVideo,
				mediaSeekingFinished : _self.seekingComplete,
				adStarted : _self.adStarted,
				adPaused : _self.adPaused,
				adResumed : _self.adResumed,
				adTimeChanged : _self.updateAdTimer,
				adFinished : _self.adComplete,
				mediaBufferingStarted : _self.bufferStart,
				mediaBufferingFinished : _self.bufferComplete
			}
		});

		// construct the assetName for Conviva
		// example format: Steven Universe-S5:E16-Letters to Lars
		var assetName = "";
		assetName += _cnglobal.currentVideo.propertyName;
		// only add the episode and season numbers if we have them
		if (_cnglobal.currentVideo.seasonNumber.length > 0 && _cnglobal.currentVideo.episodeNumber.length > 0) {
			assetName += "-" + "S" + _cnglobal.currentVideo.seasonNumber + ":E" + _cnglobal.currentVideo.episodeNumber;
		}
		assetName += "-" + _cnglobal.currentVideo.episodeTitle;

		// add the initial player options
		playerOptions = {
			convivaMetadata : {
				assetName : assetName
			}
		};

	}

	// if the user is on a mobile device, we need to show them a slate driving to the CN Video app
	this.showMobileSlate = function() {

		// overwrite the player div with the mobile slate
		$('#playerarea').html("<img id='app-slate-hero' src='/static/images/video-player/fullepisode_apppushslate_980x571.jpg' width='100%' height='100%' alt='Watch CN!'/>");
		$("#player_wrapper").css("padding-bottom", "0").css("height", "auto");

		// add click functionality to the mobile slate
		$('#app-slate-hero').click(function() {

			// CN Video deep link using the following format: cartoonnetwork://shows/{seriesTitleId}/videos/{video id}
			if (typeof _cnglobal.currentVideo.seriesId !== 'undefined' && typeof _cnglobal.currentVideo.mediaId !== 'undefined' ){
				var universalLink = 'cartoonnetwork://shows/' + _cnglobal.currentVideo.seriesId + '/videos/' + _cnglobal.currentVideo.mediaId;
			}

			// this is a hack to get around limitations of deep linking
			// first, try to open up the universal link to go directly to the app (using an iFrame)
			$('#app-slate-hero').append('<iframe style="display:none" height=0 width=0 src="' + universalLink + '"></iframe>');
			
			// if the user doesn't have the app, this will fire off and send them to the mobile landing page
			var redirectURL = "/apps/cartoon-network/cartoon-network/index.html";
			setInterval(function () {
				window.location = redirectURL;
			}, 2000);
		});

	}

	// video player ready funtion
	this.playerReady = function() {

		// VHL tracking
		try { trackVideoMetrics({type: "Player_Ready", data: video_metadata}); } catch(e) {}

		// check video type and start video
		_self.checkVideoType();

	}

	// check the video type to decide what to do next
	this.checkVideoType = function() {
		
		// for any unauth video (clips, minisodes, and unlocked episodes) OR we're in an unlocked event
		if (_cnglobal.currentVideo.authType === "unauth" || _cnglobal.top.unlockedEventEnabled) {
			
			// play the video asset
			player.playByMediaJson({
				mediaId: _cnglobal.currentVideo.mediaId
			}, playerOptions);
			
		} else {
			// it's a full authenticated episode, so check if the user is authenticated or not
			_self.getTokenAndPlay();
		}
	}

	// get the auth token before we play the content
	this.getTokenAndPlay = function() {

		_authInstance.getAdobeToken('CartoonNetwork')

			// if the user is authenticated, play full asset
			.then(_self.playAuthContent)

			// if the user is NOT authenticated, play preview
			.catch(function(error) {

				// adjust the tracking analytics to track the teaser instead of full episode
				video_metadata.content_type = "preview";
				video_metadata.content_type_level2 = "video:vod:tve:episode:episode:content";
				video_metadata.content_duration = 120;

				player.playByMediaJson({
					mediaId: _cnglobal.currentVideo.mediaId,
					mediaTypes : ["preview", "unprotected"]
				}, playerOptions);

				// add the preview label above the video player
				$('#cn-videopage-property-prewiew').css("display", "block");
			});
	}

	// add necessary attributes for playing authenticated content
	this.playAuthContent = function(token) {

		// the user is logged in, so update our boolean
		_authInstance.userLoggedIn = true;

		// add token info to the player options
		playerOptions.accessTokenType = token.accessTokenType;
		playerOptions.accessToken = token.accessToken;
		playerOptions.mvpd = token.mvpd;

		player.playByMediaJson({
			mediaId: _cnglobal.currentVideo.mediaId
		}, playerOptions);
	}

	// fires when the video has started
	this.videoStarted = function() {
		// change the metadata for the Ensighten object
		turner_metadata.content_type = "adbp:video start";
		// VHL tracking
		// change the word "ad" at the end of the tracking string to be "content", now that the ad is complete
		video_metadata.content_type_level2 = video_metadata.content_type_level2.replace(":ad", ":content");
		// send tracking event
		try { trackVideoMetrics({type: "Media_Started", data: video_metadata}); } catch(e) {}
	}

	// when this video is over, go to the next video's page
	this.playNextVideo = function() {
		// VHL tracking
		try { trackVideoMetrics({type: "Media_Finished", data: video_metadata}); } catch(e) {}

		// if this is a 2-min preview, then show the end slate prompting the user to log in
		if (_cnglobal.currentVideo.authType === "auth" && _cnglobal.currentVideo.videoType === "fullepisode" && !_authInstance.userLoggedIn) {
			$("#slate-content-wrapper").show();
			_self.addEndSlateClickListener();
			_self.endSlateCounter();
		} else {
			// otherwise, skip the end slate and jump straight to the next video
			window.location.href = _cnglobal.nextVideo.url;
		}
	}

	// when the user has finished seeking
	this.seekingComplete = function(data) {
		// VHL tracking
		video_metadata.scrub_playhead = Math.floor(data.time);
		try { trackVideoMetrics({type: "Video_Scrub", data: video_metadata}); } catch(e) {}
	}

	// end slate counter (go to next video after 10 seconds)
	this.endSlateCounter = function(){
		if(typeof _self.timer === 'undefined'){
			_self.timer = 9;
		}
		clearTimeout(_cnglobal.endSlateTimeout);
		_cnglobal.endSlateTimeout = setTimeout(countdown, 1000);       
		function countdown() {
			if (_self.timer > 0){
				$('#slate-next-video-timer').html(_self.timer);
				_self.timer--;
				_self.endSlateCounter();
			} else {
				window.location.href = _cnglobal.nextVideo.url;  
			}               
		}
	}

	// pause the counter 
	this.pauseCounter = function(){
		clearTimeout(_cnglobal.endSlateTimeout);
	}

	// resume the counter 
	this.resumeCounter = function(){
		_self.endSlateCounter();
	}

	// click listener for the "LOG IN" button on the end slate
	this.addEndSlateClickListener = function() {
		$("#slate-hero").click(function(){
			// simulate a click of the main "LOG IN" button
			$('#login-button').click();
			_self.pauseCounter();
		});
	}

	// function for when the ad has started
	this.adStarted = function(data) {
		// VHL tracking
		video_metadata.ad_duration = player.model().adDuration();
		video_metadata.ad_type = player.model().adType()[0];
		// change the word "content" at the end of the tracking string to be "ad"
		video_metadata.content_type_level2 = video_metadata.content_type_level2.replace(":content", ":ad");
		// send tracking event
		try { trackVideoMetrics({type: "Ad_Started", data: video_metadata}); } catch(e) {}

		// add the ad label
		adLabel.addClass("active");
		adLabel.html('<span class="ad-video-label-title">Advertisement</span> - Your video will begin after the advertisement.');
	}

	// update the displayed number of seconds remaining in the ad
	this.updateAdTimer = function(data) {
		var secondsRemaining = Math.floor(data.duration - data.time);
		adLabel.html('<span class="ad-video-label-title">Advertisement</span> - Your video will load in ' + secondsRemaining + ' seconds.');
	}

	// when the ad is complete
	this.adComplete = function() {
		// remove the ad label once the ad is complete
		adLabel.removeClass("active");

		// VHL tracking
		try { trackVideoMetrics({type: "Ad_Finished", data: video_metadata}); } catch(e) {}
	}

	// when the ad has been paused
	this.adPaused = function() {
		// VHL tracking
		try { trackVideoMetrics({type: "Ad_Paused", data: video_metadata}); } catch(e) {}
	}

	// when the ad has been resumed
	this.adResumed = function() {
		// VHL tracking
		try { trackVideoMetrics({type: "Ad_Resumed", data: video_metadata}); } catch(e) {}
	}

	// when the video has been paused
	this.videoPaused = function() {
		// VHL tracking
		try { trackVideoMetrics({type: "Media_Paused", data: video_metadata}); } catch(e) {}
	}

	// when the video has been resumed
	this.videoResumed = function() {
		// VHL tracking
		try { trackVideoMetrics({type: "Media_Resumed", data: video_metadata}); } catch(e) {}
	}

	// when the video buffer has started
	this.bufferStart = function() {
		// VHL tracking
		try { trackVideoMetrics({type: "Media_Buffering_Started", data: video_metadata}); } catch(e) {}
	}

	// when the video buffer has ended
	this.bufferComplete = function() {
		// VHL tracking
		try { trackVideoMetrics({type: "Media_Buffering_Finished", data: video_metadata}); } catch(e) {}
	}

}
