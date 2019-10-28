/*
 *******************************  GLOBAL FUNCTIONS  ********************************
 */	

function log() { 
	try {
		console.log.apply(console, arguments);	
	}
	catch(e) {	 
		try { 
			opera.postError.apply(opera, arguments);	
		}
		catch(e){ 
			/*alert(Array.prototype.join.call( arguments, " "));*/	
		}
	}
}

/* 
 * jump to a particular point in the page
 * this is used for mobile devices for things like jumping to a text field or to the top of the page 
 */
function scrollToElement(element) {
	$('html, body').animate({
        scrollTop: element.offset().top
    }, 200);
} 


/*
 *******************************  GLOBAL VARIABLES  *********************************
 */	

var _cnglobal = {}; 	/* global object to contain global variables */
	/* assign property master value to .propertyMaster */
	_cnglobal.propertyMaster = (typeof getPropertyMaster === 'function')?getPropertyMaster():false;	

/************************* setting device properties. *************************/
deviceProperties();
function deviceProperties(){
	var device = {};
	device.userAgent = navigator.userAgent;
	device.deviceName = deviceName();
	device.deviceOS = deviceOS();
	device.isMobile = isMobile();
	device.maxWidth = maxWidth();
	device.touchEnable = Modernizr.touch;
	device.mqPhone = deviceWidth('phone');
	device.mqTablet = deviceWidth('tablet');
	device.mqDesktop = deviceWidth('desktop');
	device.viewportWidth = window.screen.width;
	device.viewportHeight = window.screen.height;
	
	_cnglobal.device = device;
	
	/*Return iPad/iPhon/IPod, Kindle, Android and Desktop-Other*/
	function deviceName(){
		if (device.userAgent.indexOf('iPad') > -1){
			return 'iPad';
		} else if(device.userAgent.indexOf('iPad') > -1|| device.userAgent.indexOf('Macintosh') > -1 && 'ontouchend' in document) {
			return 'iPad';
		}
		else if (device.userAgent.indexOf('iPhone') > -1){
			return 'iPhone';
		} else if (device.userAgent.indexOf('iPod') > -1){
			return 'iPod';
		} else if (device.userAgent.indexOf('Silk') > -1){
			return 'Kindle';
		} else if (device.userAgent.indexOf('Android') > -1){
			return 'Android';
		} else {
			return 'DesktopOthers';
		}
	}
	/*Return device OS*/
	function deviceOS(){
		if (device.userAgent.indexOf('iPad') > -1){
			return 'iOS';
		} else if(device.userAgent.indexOf('iPad') > -1|| device.userAgent.indexOf('Macintosh') > -1 && 'ontouchend' in document) {
			return 'iOS';
		}
		else if (device.userAgent.indexOf('iPhone') > -1){
			return 'iOS';
		} else if (device.userAgent.indexOf('iPod') > -1){
			return 'iOS';
		} else if (device.userAgent.indexOf('Silk') > -1){
			return 'Kindle';
		} else if (device.userAgent.indexOf('Android') > -1){
			return 'Android';
		} else {
			return 'DesktopOthers';
		}
	}
	/*Look for word Mobile in user angent*/
	function isMobile(){
		if (device.userAgent.indexOf('Mobile') > -1){
			return true;
		} else {
			return false;
		}
	}
	/*
	Max device width
	Compare heigh and width and pick the larger value
	*/
	function maxWidth(){
		if (window.screen.availHeight > window.screen.availWidth){
			return window.screen.availHeight;
		} else if (window.screen.availHeight < window.screen.availWidth){
			return window.screen.availWidth;
		} else {
			return window.screen.availWidth;
		}
	}
	/*
	Return bool value on mqPhone, mqTablet, mqDesktop
	base on media query width
	*/
	function deviceWidth(type){
		switch (type){
			case 'phone':
				if (Modernizr.mq('only screen and (max-width : 767px)')){
					return true;
				} else {
					return false;
				};
				break;
			case 'tablet':
				if (Modernizr.mq('only screen and (min-width : 768px) and (max-width : 1024px)')){
					return true;
				} else {
					return false;
				};
				break;
			case 'desktop':
				if (Modernizr.mq('only screen and (min-width : 1025px)')){
					return true;
				} else {
					return false;
				};
				break;
		}
	}
}
/************************* setting device properties. *************************/


/*
 ***********************  Global Resize Listener  *************************
 */

function resizeListener(){
	/* add resize listener with a timeout so that it doesn't fire constantly */
	$(window).resize(function(e) {
	    if(this.resizeDone) {
	    	clearTimeout(this.resizeDone);
	    }
		this.resizeDone = setTimeout(resizeHelper,200);		
	});

	/* check to see if object/function exists before using it */
	function resizeHelper(){
		/* Global Nav rebuild the slides */
		if(typeof _GN != 'undefined'){
			_GN.createSlides(_GN.initSwipe); 
		}		
		/* Episode Guide - episode-guide.js */
		if(typeof _EG != 'undefined'){
			_EG.resizeEG(); 
		}
		/* coming soon module swipe - video-home.js */
		if (typeof _csmS != 'undefined') {
			_csmS.resizeSwipe();
		}
		/* homepage navgation bar - /static/homepage/js/nav-bar.js */
		if (typeof _hpNav != 'undefined'){
			_hpNav.checkSize();
		}
		/* Apps card and other mobile cards */
		if (typeof _cnglobal.homepage != 'undefined'){
			_cnglobal.homepage.checkSize();
		}
		/* Apps card */
		if (typeof gameCardDisplay != 'undefined'){
			gameCardDisplay();
		}	
		/* campaign video card */
		if (typeof homepageCampaignVideo != 'undefined'){
			if ($('#overlay').hasClass('active') === true){
				homepageCampaignVideo.centerVideo();
			}
		}
		/* multi use card */
		if (typeof _multiCard != 'undefined'){
			_multiCard.checkSize();
		} 
		/* video home page's unlocked module */
		if (typeof _UM != 'undefined'){
			_UM.resetSlider();
		}
	}
}
/*
 ***********************  Global Resize Listener  *************************
 */

function termsOfService() {

	/*  Other files TOS touches */
	/*  global.css, and tos-sprite.png */
	/*  nav-bar.js ln 273 & 662 */
	/*	universal-nav.js ln 378 */
	
    if ( Cookies.get('cn_tos') == null ) {

     	_cnglobal.tos = true;

     	$('#nav-bar').prepend('<div id="tos-bar"><div id="tos-wrap"><div id="tos-text"><p>By using this site, you agree to Cartoon Network\'s <a href="/legal/termsofuse.html">Terms of Use</a> and <a href="/legal/privacy.html">Privacy Policy</a>.</p></div><div id="tos-close"><p><span>Close</span></p></div></div></div>');

		$('#tos-close').click(function() {
					$('#tos-close').off("click");						
					Cookies.set('cn_tos', true, {expires : 1825, path : '/'});
					$('#tos-bar').remove();
		});

    } else {
     	_cnglobal.tos = false;
    }

}

// Takes in apis broken array of nonvalid object and returns a array of valid objects
function apiObjArrayToValidObjArray (item) {
	item.forEach(function(item){
		return JSON.parse(JSON.stringify(item)
	)});
	return item;
}
