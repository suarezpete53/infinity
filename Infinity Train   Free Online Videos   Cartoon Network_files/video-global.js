/*
 *******************************  DOCUMENT READY  ***********************************
 */

$(function(){
	
	// global nav init
	_GN = new GlobalNav();
	_GN.initGlobalNav();

	_LH = new LoginWindow();

	// initialize the authentication object from video-auth.js
	_authInstance = new CartoonAuth();	

	// TVE Auth click events
	$('#login-button').click(function(event){	
		event.preventDefault();		
		// different states based on if the user is logged in or not	
		if($('#login-button').hasClass("logOut")){
			_authInstance.logout();
		} else {
			_LH.showLoginWindow();
		}
	});

	/* global resize listener*/
	resizeListener();
	
});

/*
 ***********************  TVE AUTHENTICATED/AUTHORIZED  *************************
 */ 

// function that fires when user is TVE Authorized
// controls things like the log-in button, and video link URLs
function tveAuthorized(){

	// video home page
	if (typeof videoHomeReplaceClipLinks == 'function') {
		videoHomeReplaceClipLinks(true);
	}
	// Video Property template
	if (typeof videoPropertyAuthCheckComplete == 'function') {
		videoPropertyAuthCheckComplete('authorized');
	}
}

// function that fires when user is not authorized
// controls things like the log-in button, and video link URLs
function tveNotAuthorized(){

	// update log-in button
	$('#login-button').html('LOG IN').removeClass('loading');
	
	// video home page
	if (typeof videoHomeReplaceClipLinks == 'function') {
		videoHomeReplaceClipLinks(false);
	}
	// Video Property template
	if (typeof videoPropertyAuthCheckComplete == 'function') {
		videoPropertyAuthCheckComplete('unauthorized');
	}
}


/*
 *******************************  LOGIN WINDOW  ***********************************
 */ 

function LoginWindow() {

	var _self = this;

	// show the login window when they click the "log in" button
	this.showLoginWindow = function() {
		$("#auth-login-wrapper").addClass("active");
		$("#auth-close").click(_self.closeLoginWindow);
		$("#auth-button").click(_self.startAuthProcess);
	}

	// hide the login window when they click the "X" button
	this.closeLoginWindow = function() {
		$("#auth-login-wrapper").removeClass("active");
	} 

	// the user clicked the "get started" button, so call the login call in the auth code
	this.startAuthProcess = function() {
		_authInstance.loginClick();

		// we now close our login window because the Adobe one will take over
		_self.closeLoginWindow();
		
		// Analytics tracking
		if (typeof sendEvent === "function") { 
			var data = {
				mvpd: "no mvpd set",
				adobe_hash_id: "no mvpd set",
				pagename: "tve:picker:home",
				interaction: "tve:picker:get started",
				success: false
			}
	        sendEvent("picker-click", data);
	    }
	} 

}


/*
 *******************************  VIDEO NAV  ***********************************
 */ 

function GlobalNav() {
	this.showPicker;
	this.shows;
	this.itemsPerSlide;
	this.columns;
	this.resultsArray = new Array();
	this.searchCopy; 
	var self = this;

	/* store some references for quicker DOM traversals */
	this.globalNav = $("#global-nav");
	this.showsButton = $("#shows-button");
	this.showsTray = $("#shows-tray");
	this.menuButton = $("#menu-button");
	this.menuTray = $("#menu-tray");
	this.showsDividers = $("#global-nav .shows-divider");
	this.showPickerDiv = $("#show-picker");
	this.showPickerWrapper = $("#show-picker-wrapper");
	this.statusBar = $("#status-bar");
	this.nextButton = $("#next-arrow");
	this.prevButton = $("#prev-arrow");
	this.searchResults = $("#search-results");
	this.searchField = $("#search-input");
	this.searchIcon = $("#search-icon");

	
	/* 
	 * this function is called when the page is ready 
	 */
	this.initGlobalNav = function() {
		self.showsButton.click(self.toggleShowTray);
		self.menuButton.click(self.toggleMenu);
		self.searchField.click(self.searchFieldClick);
		self.searchCopy = self.searchField.val();		/* store the text from the input field */
		
		if (typeof _cnglobal.shows !== "undefined") {			/* error checking */
			self.shows = _cnglobal.shows;
			self.createSlides(null);		/* create the slides, but pass 'null' so that it doesn't initialize the swipe code */
		}
		
		/* if on a supported mobile device */
		if(_cnglobal.device.deviceName != "DesktopOthers"){
			/* swap out the Games link in the Universal Nav to jump to the Apps page */
			$("#hat #games-link").attr("href", "/mobile/?atclk_gn=gn_mobile_apps");
		}
	}


	/* 
	 * show button click handler 
	 */
	this.toggleShowTray = function() {
		self.showsTray.toggle();
		self.showsButton.toggleClass("menu-active");
		self.showsDividers.toggleClass("hidden");

		/* close the other tray if it's open */
		if (self.menuButton.hasClass("menu-active")) {
			self.menuTray.toggle();
			self.menuButton.toggleClass("menu-active");
		}
		if(self.showsButton.hasClass("menu-active")) { 	/* if opening the shows tray */
			if(!self.showPicker) {		/* if the show picker has NOT been initialized */
				if (self.showPickerDiv.width() != self.calculateSlideWidth()) {		/* if the page has been resized before the shows tray has been opened */
					self.createSlides(self.initSwipe);		/* recreate the slides */
				} else {
					self.initSwipe();			/* initialize the show picker and SwipeJS */
				}
			} else {
				self.createSlides(self.initSwipe);			/* otherwise re-create the slides */
			}
			try {
				trackMetrics({
					type: "cnt-allshow",
					data: {
						attribution: "vn_games_open" //current prop14
					}
				});
			} catch(e){log('shows open tracking error');}
		} else {
			self.clearSearch(false);			/* clear the search results if they close the shows tray */
		}
	}


	/* 
	 * menu button click handler 
	 */
	this.toggleMenu = function() {
		self.menuTray.toggle();
		self.menuButton.toggleClass("menu-active");
		self.showsDividers.toggleClass("hidden");

		/* close the other tray if it's open */
		if (self.showsButton.hasClass("menu-active")) {
			self.showsTray.toggle();
			self.showsButton.toggleClass("menu-active");
		}
	}


	/*  
	 *  called on document ready and page resize.  
	 *  this divides up the empty li tags into slides and loads the first slide's images. 
	 */
	this.createSlides = function(callback) {
		self.itemsPerSlide = self.getItemsPerSlide();
		
		// if the itemsPerSlide is less than or equal to the number of shows, 
		// then we need to cap it so it doesn't throw an error

		if (typeof self.shows !== 'undefined'){
			if (self.itemsPerSlide >= self.shows.length) {
				self.itemsPerSlide = self.shows.length;
			}

			var showsHTML = '<ul class="slide" data-loaded="true">';

			/* for loop for first slide */
			for(var i = 0; i < self.itemsPerSlide; i++) {

				// create the click tracking string
				var trackingShowAlt = "";
				if ( self.shows[i].displaytitle != null ) {
					trackingShowAlt  =  self.shows[i].displaytitle.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
				}

				/* add li WITH img tag */
				showsHTML += '<li class="showLink" itemscope itemtype="https://schema.org/SiteNavigationElement">'
					+ '<a itemprop="url" href="' + self.shows[i].url + '?atclk_vn=nav_' + trackingShowAlt	/* add each show to the string */
					+ '"><img itemprop="image" src="'+ self.shows[i].ch72url 
					+ '" alt="' + self.shows[i].ch72alt + '" /></a>'
					+ '<meta itemprop="name" content="' + self.shows[i].title + '" /></li>';
			}


			/* for loop for all other slides */
			for(var i = self.itemsPerSlide; i < self.shows.length; i++) {

				// create the click tracking string
				var trackingShowAlt = "";
				if ( self.shows[i].displaytitle != null ) {
					trackingShowAlt  =  self.shows[i].displaytitle.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
				}

				if(i % self.itemsPerSlide == 0) { 		/* break the shows into multiple slides */
					showsHTML += '</ul><ul class="slide" data-loaded="false">'; 	/* add the <ul> tag to start a new slide */
				}
				/* add li WITHOUT img tag */
				showsHTML += '<li class="showLink" itemscope itemtype="https://schema.org/SiteNavigationElement">'
					+ '<a itemprop="url" href="' + self.shows[i].url + '?atclk_vn=nav_' + trackingShowAlt 	/* add each show to the string */
					+ '"></a>'
					+ '<meta itemprop="name" content="' + self.shows[i].displaytitle + '" /></li>';
			}
			showsHTML += '</ul>';		/* close the last slide */
			self.showPickerDiv.find("#swipe-wrap").html(showsHTML);		/* write the HTML to the document */
			
			/* execute the callback function, which is most likely initswipe() */
			if(callback) {
				callback();
			}
		}
	}


	/* 
	 * initialize the slider and set up other show-picker components.
	 * called when the shows tray is opened or the page is resized 
	 */
	this.initSwipe = function() {

		/* if an instance of the swipe JS already exists, remove it first */
		if(self.showPicker) { 
			self.showPicker.kill(); 
			self.prevButton.unbind("click");
			self.nextButton.unbind("click");
		}

		/* initialize SwipeJS */
		self.showPicker = Swipe(document.getElementById("show-picker"), {continuous: false, callback: self.slideChange});
		self.prevButton.click(self.showPicker.prev);
		self.nextButton.click(self.showPicker.next);
		self.loadSlide(1); 		/* preload the second slide */
		self.createStatusBar();
		self.updateSliderControls();
	}


	/* 
	 * load the images for one individual slide (given the index) 
	 * called in initSwipe() and slideChange() 
	 */
	this.loadSlide = function(index) {
		var thisSlide = self.showPickerDiv.find(".slide").eq(index);
		var trackingShowAlt;

		/* if the slide has already been loaded, do nothing */
		if (thisSlide.attr("data-loaded") == "true") {
			return;
		}
		var start = index * self.itemsPerSlide;
		var end = start + self.itemsPerSlide;

		/* make sure end is never higher than total number of shows */
		if (end > self.shows.length) {		
			end = self.shows.length;
		}

		/* loop through and add shows to create the slide */
		var slideHTML = "";
		for(var i = start; i < end; i++) {
			if ( self.shows[i].displaytitle != null ) {
				trackingShowAlt  =  self.shows[i].displaytitle.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
			} else {
				trackingShowAlt = "";
			}

			slideHTML += '<li class="showLink" itemscope itemtype="https://schema.org/SiteNavigationElement">' 
				+ '<a itemprop="url" href="' + self.shows[i].url + '?atclk_vn=nav_' + trackingShowAlt 	/* add each show to the string */
				+ '"><img itemprop="image" src="' + self.shows[i].ch72url
				+ '" alt="' + self.shows[i].displaytitle + '" /></a>'
				+ '<meta itemprop="name" content="' + self.shows[i].displaytitle + '" /></li>';
		}
		thisSlide.html(slideHTML).attr("data-loaded", true);	/* write the HTML to the document */
		/* don't add tool tip if it's on a mobile device or below the 768 breakpoint */
		/* NOTE: we can't use the global device.mqPhone because this call needs to update if the screen size changes */
		if (!_cnglobal.device.isMobile && Modernizr.mq("only screen and (min-width : 769px)") || !Modernizr.mq("")) {			
			self.addTooltip();
		}
	}


	/* 
	 * callback function for any time the show picker slides  
	 */
	this.slideChange = function() {
		var slideIndex = self.showPicker.getPos();
		var totalSlides = self.showPicker.getNumSlides();

		/* if we're switching to a slide that hasn't already been loaded, then load it */
		if(self.showPickerDiv.find(".slide").eq(slideIndex).attr("data-loaded") == "false") {
			self.loadSlide(slideIndex);
		}
		self.updateSliderControls();

		/* pre load the next and previous slides so it's ready to slide in */
		var prevSlide = parseInt(slideIndex)-1;
		var nextSlide = parseInt(slideIndex)+1;
		if (nextSlide < totalSlides) {		/* if it's not the last slide */
			self.loadSlide(nextSlide);
		}
		if (prevSlide >= 0) {
			self.loadSlide(prevSlide);
		}
	}


	/* 
	 * decide how many show images to put in each slide, based on the size of the shows tray 
	 * called in createSlides()
	 */
	this.getItemsPerSlide = function() {
		var slideWidth = self.calculateSlideWidth();		/* get the width of the slide */
		self.showPickerDiv.css("width", slideWidth+"px");	/* set the show picker's width */
		return self.columns * 3;		/* return the columns times three to get the total number of icons per slide */
	}

	
	/* 
	 * decide the width of each slide, based on the width of the shows tray 
	 * called in getItemsPerSlide and toggleShowTray
	 */
	this.calculateSlideWidth = function() {
		var sideMarginWidth = 40;	/* width of each side/gutter margin */
		var iconWidth = self.showPickerDiv.find(".showLink").outerWidth(true);	/* width of each show icon plus margins */
		var trayWidth = self.showsTray.width();	/* width of the show tray */

		self.columns = Math.round((trayWidth - sideMarginWidth*2) / iconWidth);		/* decide number of columns based on the space in the show tray */
		if (self.columns>9) self.columns = 9;		/* keep a maxium of 9 columns */

		var slideWidth = self.columns * iconWidth;  /* get the width of the slide */
		return slideWidth;		
	}


	/* 
	 * add the status bar / slide indicator below the show picker 
	 * called in initSwipe()
	 */
	this.createStatusBar = function() {
		var htmlString = "";
		for (var i = 0; i < self.showPicker.getNumSlides(); i++) {		/* create a div for each slide's indicator */
			if(i==0) htmlString += "<div class='indicator active'></div>";		/* start the first one active */
			else htmlString += "<div class='indicator'></div>";
		}
		self.statusBar.html(htmlString);

		/* add click functionality for jumping to slides */
		self.statusBar.find(".indicator").click(function() {
			self.showPicker.slide($(this).index(), 400);
		});
	}


	/* 
	 * update the status bar and next/prev arrows 
	 * called in initSwipe() and slideChange()
	 */
	this.updateSliderControls = function() {
		var slideIndex = self.showPicker.getPos();
		var totalSlides = self.showPicker.getNumSlides();

		/* update the status bar indicators */
		self.statusBar.find(".active").removeClass("active");		
		self.statusBar.find(".indicator").eq(slideIndex).addClass("active");

		/* manage states of the arrow buttons based on the current slide */
		if (slideIndex === 0) {		
			self.prevButton.addClass("inactive");
		} else if (slideIndex > 0) {
			self.prevButton.removeClass("inactive");
		}
		if (slideIndex == totalSlides-1) {
			self.nextButton.addClass("inactive");
		} else if (slideIndex < totalSlides-1) {
			self.nextButton.removeClass("inactive");
		}
	}

	/* 
	 * add the tooltip functionality to the show picker icons 
	 * called in loadSlide(), each time a slide is loaded
	 */
	this.addTooltip = function() {
		var tooltip = jQuery("#tooltip");
		var leftOffset;
		var iconBottom;
		var iconLeft;
		var parentOffset = $("#show-picker-wrapper").offset().left; /* need offset of the parent element for correct positioning */
		var heightOffset = 23;  /* hard-coded values for ease of editing */
		var delayDuration = 100;
		var fadeDuration = 200;

		self.showPickerDiv.find("a").mouseenter(function(e){
			iconBottom = jQuery(this).position().top;         /* get the page coordinates of the icon */
			tooltip.css("top", (iconBottom + heightOffset)+"px");   /* set the tooltip to be below the icon */
			jQuery("#tooltip span").html(jQuery("img", this).attr("alt"));  /* change the tooltip's text */
			tooltip.stop(true, true).delay(delayDuration).fadeIn(fadeDuration);     /* fade it in with a delay */
			leftOffset = tooltip.outerWidth()/2;	/* this is to center the tooltip */
		}).mousemove(function(e){	    
				tooltip.css("left", (e.pageX - parentOffset - leftOffset)+"px");       /* follow the mouse, position the tooltip */
		}).mouseleave(function(e){
				tooltip.stop(true, true).fadeOut(fadeDuration);
		});
	}


	/* 
	 * this function fires when the search field is clicked 
	 */
	this.searchFieldClick = function() {

		/* on first click, clear out the text field */
		if($(this).val() == self.searchCopy) {
			$(this).val("");
			self.searchIcon.addClass("active");
			self.searchIcon.click(self.clearSearch);
		}

		/* listen for keys pressed and update the search filter */
		self.searchField.keyup(self.searchShows);

		/* slightly different behavior on the phone because of limited vertical space */
		if(_cnglobal.device.isMobile) {
			self.showPickerWrapper.hide();
			self.searchResults.show();
			self.searchResults.find("#search-CTA").show();
			self.searchResults.find("#results-list").hide();
			self.searchResults.find("#no-results").hide();
			scrollToElement(self.searchResults);	/* jump to the top of the search results to show the keyboard */
		}
	}


	/* 
	 * filter the shows based on the search word 
	 * this is called on each keypress while typing in the search field 
	 */
	this.searchShows = function() {
		self.resultsArray = [];
		var searchString = self.searchField.val().toLowerCase();		/* grab the search terms */

		/* if the user backspaces until it's blank, then show the search CTA */
		if (searchString == "") {
			self.searchResults.find("#search-CTA").show();
			self.searchResults.find("#results-list").hide();
			self.searchResults.find("#no-results").hide();
			self.displayResults();
			return;
		} else {
			self.searchResults.find("#search-CTA").hide();
			self.searchResults.find("#results-list").show();
			self.searchResults.find("#no-results").hide();
		}

		/* do the actual filtering */
		for(var i = 0; i < self.shows.length; i++) {
			/* compare the search string to the show titles and ignore a blank search */
			if (self.shows[i].displaytitle.toLowerCase().indexOf(searchString) >= 0 && !/^\s*$/.test(searchString)) {
				self.resultsArray.push(self.shows[i]);
			}
		}

		/* if there are no results */
		if(self.resultsArray.length == 0) {
			self.searchResults.find("#no-results").show();
			self.searchResults.find("#results-list").hide();
			self.searchResults.find("#search-CTA").hide();
			return;
		}
		self.displayResults();
	}


	/* 
	 * display the search results
	 * this is called at the end of the searchShows function 
	 */
	this.displayResults = function() {
		var trackingShowAlt;

		/* hide or show the necessary divs */
		self.searchResults.find("#no-results").hide();
		self.showPickerWrapper.hide();
		self.searchResults.show();
		self.searchResults.find("#results-list").show();

		var resultsHTML = "";
		var maxResults = Math.min(4, self.resultsArray.length);  /* either 4 or the number of results, whichever is lower */
		
		/* go through each of the result items and add it to the page */
		for(var i = 0; i < maxResults; i++) {
			if ( self.shows[i].displaytitle != null ) {
				trackingShowAlt  =  self.resultsArray[i].displaytitle.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
			} else {
				trackingShowAlt = "";
			}

			resultsHTML += '<li class="result-item" itemscope itemtype="https://schema.org/SiteNavigationElement"';

			/* if it's the last element in the array AND it's an odd number, then change its display so it's left-aligned */
			if(i==(maxResults-1) && (i+1)%2) {
				resultsHTML += 'style="display: table"';
			}

			resultsHTML += '><a itemprop="url" href="' + self.resultsArray[i].url + '?atclk_vn=nav_search_' + trackingShowAlt
				+ '"><img class="result-item-image" itemprop="image" src="' + self.resultsArray[i].ch72url + '" alt="' + self.resultsArray[i].title + '" />'
				+ '<span class="result-item-title" itemprop="name">' + self.resultsArray[i].displaytitle + '</span></a></li>';
		}
		self.searchResults.find("#results-list").html(resultsHTML);	/* write the HTML to the document */
	}


	/* 
	 * clear the search results
	 * takes in the boolean "recreate" for when we want to clear the results but not make a new swipe instance (when we close the shows tray) 
	 */
	this.clearSearch = function(recreate) {
		self.searchIcon.removeClass("active");		/* change the magnifying class icon */
		self.searchField.val(self.searchCopy);		/* replace the search copy text with the default */
		self.showPickerWrapper.show();				/* show the show picker again */
		self.searchResults.hide();					/* hide the search results */
		if(recreate) { self.createSlides(self.initSwipe); }		/* reset the slider, if desired */
	}

}

/*
 *	end of global nav functionality
 */
