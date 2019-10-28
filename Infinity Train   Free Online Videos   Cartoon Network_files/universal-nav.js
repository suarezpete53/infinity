var _hpNav = {};
$(function(e) {	

	resizeListener();

   
	_hpNav = new initHomePageNav;
	_hpNav.checkSize();	

	$('#nav-bar-icon-searchBox').keyup(function () { _hpNav.typeAhead(); });

    
    $('body').click(function(event) {

    	if( $(event.target).is('.searchContainer') || $(event.target).is('.searchContainerGames') || $(event.target).is('.searchContainerVideo') || $(event.target).is('.allSearchButton') || $(event.target).is('#nav-bar-icon-searchBox') || $(event.target).is('#nav-bar-icon-search-icon') ) {

    	} else {
    		$('#nav-bar-icon-searchBox').val('SEARCH');
			_hpNav.dropdownCleanup();
    	}


    });

    $('#nav-bar-icon-searchBox').click(function(){
		if ($(this).val() == 'SEARCH'){
			$(this).val('');
		};
	});


    $('#nav-bar-icon-search').submit(function( event ) {
    	// temporary - do nothing when the user hits enter in the search bar
    	event.preventDefault();
    	/*if (  $('#nav-bar-icon-searchBox').val().toLowerCase() != 'search' ) {
    		window.location.href = '/search/index.html?keywords=' + $('#nav-bar-icon-searchBox').val().toLowerCase();
    	}
    	return false;*/
    });


});


function initHomePageNav(){
	var self = this;
	var isDesktop = (_cnglobal.device.deviceOS == "DesktopOthers");
	
	/*
	adding desktop class to two menu button
	css media query logic
	nav-bar.css @media only screen and (min-width : 768px) and (max-width : 1024px) {
	*/
	if (isDesktop){
		$('#nav-bar-button-games').addClass('desktop');
	};
	
	/*method called by the resizeListener() in cn-global.js*/
	this.checkSize =  function(){
		/* if this is 1024 and up AND on a desktop */
		if ((Modernizr.mq('only screen and (min-width : 1024px)') || !Modernizr.mq('only all')) && isDesktop){
			this.menuHoverEvent(true);
			$('#nav-bar').removeClass("mobile640");
			$('#nav-bar').removeClass("mobile1024");
			/* show the "GAMES" button */
			$('#nav-bar-button-games').addClass('desktop').show();
		} else if (Modernizr.mq('only screen and (max-width : 640px)') && (_cnglobal.page != "games") ) {
			$('#nav-bar').addClass("mobile640");		
		} else {
			this.menuHoverEvent(false);
			$('#nav-bar').removeClass("mobile640");
			$('#nav-bar').addClass("mobile1024");
			/* hide the "GAMES" button */
			$('#nav-bar-button-games').removeClass('desktop').hide();
		};
	};


	this.typeAhead = function(){

		// if search data is undefined, then do nothing;
		if (typeof _cnglobal.searchData === "undefined") {
			return;
		}

		var searchText
		$('#searchDropdown').removeClass().addClass('hidden'); //hide the drop down

		// get the list of properties from the globalNav

		if ( $('#nav-bar-icon-searchBox').val().length > 0 ) {

				searchText = $('#nav-bar-icon-searchBox').val().toLowerCase();

				searchText = searchText.replace("è", "e"); // pokemon
				searchText = searchText.replace("é", "e"); // pokemon
				searchText = searchText.replace(/\s/g, "%20"); // replace space with %20 for search

				_hpNav.searchDropdown();

				/*$.ajax({
						type: "GET",
						url: "/cn-search/gamesQuery.jsp?text=" + searchText + "&type=nav&start=1&npp=50&output=jsonp",
						dataType: "json",
						success: function(data){

			 				searchResults = data;
			 				_hpNav.searchDropdown(data);

						}
				}); */

		} else {
			this.dropdownCleanup();
		}

	}

	this.searchDropdown = function() {

			//var data = {"criteria":[{"target":"nav","startAt":1,"maxResults":50,"sortBy":"","order":"desc","sites":[],"queries":["adventure"]}],"metaResults":{"nav":4},"results":{"nav":[{"contentType":"nav","title":"Adventure Time","property_type":"show","short_title":"Adventure Time","header_icon":"Images/i79/at_finn_180x180.png","sub_property":"Adventure Time|/tv_shows/adventuretime/index.html|home $ Adventure Time Video|/tv_shows/adventuretime/video/index.html|video $ Adventure Time Games|/tv_shows/adventuretime/games/index.html|games $ Adventure Time Characters|/tv_shows/adventuretime/characters/index.html|characters $ Adventure Time|https://www.cartoonnetwork.com/forums/forum.jspa?forumID=18| $ Adventure Time Pictures|/tv_shows/adventuretime/pictures/index.html|pictures $"},{"contentType":"nav","title":"Adventure Time Battle Party","property_type":"Game","short_title":"Adventure Time Battle Party","header_icon":"","sub_property":"Battle Party News|| $ About Battle Party|/games/adventuretime/adventure-time-battle-party/about/index.html| $ Adventure Time Battle Party Game Guide|games/adventuretime/adventure-time-battle-party/game-guide/index.html| $ Champions|/games/adventuretime/adventure-time-battle-party/champions/index.html| $ Tournament|/games/adventuretime/adventure-time-battle-party/tournament/index.html| $ Profile|/games/adventuretime/adventure-time-battle-party/profile/index.html| $ Adventure Time Battle Party|/games/adventuretime/adventure-time-battle-party/index.html| $"},{"contentType":"nav","title":"Adventure Time: Game Creator","property_type":"","short_title":"Adventure Time: Game Creator","header_icon":"","sub_property":""},{"contentType":"nav","title":"The Grim Adventures of Billy & Mandy","property_type":"show","short_title":"Billy & Mandy","header_icon":"","sub_property":"The Grim Adventures of Billy & Mandy|/tv_shows/billymandy/index.html|show $ The Grim Adventures of Billy & Mandy Games|/tv_shows/billymandy/games/index.html|games $ The Grim Adventures of Billy & Mandy Videos|/tv_shows/billymandy/video/index.html|video $ The Grim Adventures of Billy & Mandy Characters|/tv_shows/billymandy/characters/index.html|characters $"}]},"didYouMean":{"prompt":"","correctedResults":[]}};
			var searchData = _cnglobal.searchData;
			var paginateCount = 0;
			var searchText;

			searchText = $('#nav-bar-icon-searchBox').val().toLowerCase();
			//searchText = searchText.replace(/\s/g, "+"); // replace space with + for search


			this.dropdownCleanup();

			$('#searchDropdown').append('<div id="searchDropdownArrow"></div>');


		$.each(searchData, function(i, searchItem) {
			var paginateThumb;
			var paginateButtons;
			var gameButton = "";
			var videoButton = "";
			var paginateString = "";
			var paginateOutbound = "";
			var paginateBold = "";

			
			if (paginateCount < 3) {

				// compare the search string to the show titles
				// if this is NOT a match, then skip it
				if (searchItem.display_title.toLowerCase().indexOf(searchText) < 0) {
					return;
				}

				paginateString="";
				
				paginateString += '<div class="searchContainer clearfix">';
					if ( searchItem.search_thumbnail == null || searchItem.search_thumbnail == "" ) {
						paginateThumb = "/static/images/search/generic_180x180.png";
					} else {
						paginateThumb = searchItem.search_thumbnail;
					}

					paginateBold = searchItem.display_title.toLowerCase();

					if (paginateBold.indexOf( $('#nav-bar-icon-searchBox').val().toLowerCase() ) >= 0){
						paginateBold = paginateBold.replace( $('#nav-bar-icon-searchBox').val().toLowerCase() , '<span>'+ $('#nav-bar-icon-searchBox').val() +'</span>' );
					}

				paginateString += '<img src="' + paginateThumb + '"><p>' + paginateBold + '</p><div class="searchContainerButtons clearfix">'
                
	      			if(searchItem.gameIndexCanonicalUrl) {
   	      				if (gameButton == "") {
   	      					gameButton += '<a href="' + searchItem.gameIndexCanonicalUrl +'" class="searchContainerGames"><p>games</p></a>';
   	      				}
   	      			}
   	      			if(searchItem.videoIndexCanonicalUrl) {
   	      				if (videoButton == "") {
   	      					videoButton += '<a href="' + searchItem.videoIndexCanonicalUrl +'" class="searchContainerVideo"><p>video</p></a>';
   	      				}
   	      			}

					if (gameButton == "") {
						gameButton += '<div class="searchContainerGames searchInactive"><p>games</p></div>'
					}
					if (videoButton == "") {
						videoButton += '<div class="searchContainerVideo searchInactive"><p>video</p></div>'
					}

                paginateString += gameButton + videoButton + '</div></div>';
			
                $('#searchDropdown').append(paginateString);
						  	
				paginateCount ++;

			}

			

		});

			
			//$('#searchDropdown').append('<a class="allSearchButton" href="/search/index.html?keywords=' + searchText + '">see all results</a>');
			
			if (paginateCount > 0) {
			$('#searchDropdown').removeClass('hidden');	
			
			var paginateIframeHeight =document.getElementById('searchDropdown').clientHeight;
			$('<iframe frameborder="0" id="searchDropdownShim" style="background-color: white; width: 296px; height: '+ paginateIframeHeight +'px; display:block; position: absolute; top: 35px; left: -50px; z-index: 80; filter: none; opacity: 0; background-position: initial initial; background-repeat: initial initial; "></iframe>').insertBefore($('#searchDropdown'));
			}

			$('#searchDropdown .searchContainer:first').hover(function() {
				$('#searchDropdownArrow').toggleClass('arrowActive');
			});


	}

	this.dropdownCleanup = function(){

			$('#searchDropdown').addClass('hidden');	

			$('.searchContainer').each(function() {
							$(this).off("click");
							$(this).unbind("mouseenter mouseleave");
						});
			
			$('#searchDropdownShim').remove();
			$('#searchDropdown').empty();

	}
	
	/*
	method called by checkSize()
	enable/disable hover event
	*/
	this.menuHoverEvent = function(active){
		if (active){
			$('#nav-bar-button-games').hover(
				function(){nav_bar_flyout_animation($('#nav-bar-button-games'), 'open')},
				function(){nav_bar_flyout_animation($('#nav-bar-button-games'), 'close')}
			);
			$('#nav-bar-button-video').hover(
				function(){nav_bar_flyout_animation($('#nav-bar-button-video'), 'open')},
				function(){nav_bar_flyout_animation($('#nav-bar-button-video'), 'close')}
			);
			$('.character-heads').hover(
				function(){
					var characterHead = $('.character-heads-property-image', this);
					if (!characterHead.hasClass('animating')){
						characterHead.toggleClass(characterHead, 'animating');
						TweenMax.to(
							characterHead, 
							0.1,
							{
								y:'-40',
								ease:Power2.easeOut,
								onComplete:function(){
									TweenMax.to(
										characterHead,
										0.5,
										{
											y:'0',
											ease:Bounce.easeOut,
											onComplete: function(){
												characterHead.toggleClass(characterHead, 'animating');
											}/*onComplete: function(){*/
										}
									);/*TweenMax.to(*/
								}/*onComplete:function(){*/
							}
						);/*TweenMax.to(*/
					};/*if (!characterHead.hasClass('animating')){*/
				},/*function(){*/
				function(){return false}
			);
		} else {
			/*remove hover event and make sure flyouts are close*/
			nav_bar_flyout_animation($('#nav-bar-button-games'), 'close');
			nav_bar_flyout_animation($('#nav-bar-button-video'), 'close');
			$('#nav-bar-button-games').off('mouseenter mouseleave');
			$('#nav-bar-button-video').off('mouseenter mouseleave');
			$('.character-heads').off('mouseenter mouseleave');
		}
	};

	/*nav_bar_flyout_animation function*/
	/*selectedElement: jquery element e.g. $('#nav-bar-button-games')*/
	/*animationType: string value. 'open' || 'close'*/
	function nav_bar_flyout_animation(selectedElement, animationType){
		var selectedIndex = $('._nav-bar-buttons').index(selectedElement);
		var selectedFlyout;
		var otherFlyout;
		
		/*
		game is @ index 0
		video is @ index 1
		*/
		if (selectedIndex == 0){
			otherFlyout = $('#nav-bar-flyout-video');
			selectedFlyout = $('#nav-bar-flyout-games');
		} else if (selectedIndex == 1) {
			otherFlyout = $('#nav-bar-flyout-games');
			selectedFlyout = $('#nav-bar-flyout-video');
		};

		if (animationType == 'open'){
			if ($('._nav-bar-flyout').is(':visible')){
				selectedFlyout.show().css('top', '100%');
				
				/*stop all animation in other flyout*/
				otherFlyout.stop(true, true, true).hide();
			} else {
				/*stop all animation in other flyout*/
				otherFlyout.stop(true, true, true).hide();
				$('#shadow-container').removeClass('shadow').addClass('over-flyout-shadow');
				/*selectedFlyout.stop(true, true, true).slideDown(100);*/
				/*selectedFlyout.show();*/ 
				TweenMax.fromTo(
					selectedFlyout,
					0.1,
					{
						display: 'none',
						top: '-412%'
					},
					{
						top: '100%',
						display: 'block',
						ease:Power2.easeOut
					}
				);
			};
			TweenMax.killTweensOf(selectedFlyout.find('.character-heads'));
			selectedFlyout
				.find('.character-heads')
				.stop(true, true, true)
				.css({
					'top': '-180px',
					'opacity':0
				})
				.each(
					function(index){
						TweenMax.to(
							$(this), 
							0.75,
							{
								autoAlpha:1,
								ease:Power2.easeOut
							}
						);
						TweenMax.to(
							$(this), 
							0.75,
							{
								delay:(0.05*index),
								top:'0',
								ease:Bounce.easeOut
							}
						);
					}
				);
			TweenMax.fromTo(
				selectedFlyout.find('._nav-bar-flyout-cta'),
				0.5,
				{
					opacity:0
				},
				{
					delay: 0.2,
					autoAlpha:1
				}
			);
		} else if (animationType == 'close') {
			TweenMax.to(
				selectedFlyout,
				0.1,
				{
					delay:0.05,
					top:'-412%',
					onComplete:function(){
						selectedFlyout.hide();
						if (!$('._nav-bar-flyout').is(':visible')){
							$('#shadow-container').removeClass('over-flyout-shadow').addClass('shadow');
						};
					}
				}
			);

		};
	};
	/*end of nav_bar_flyout_animation function*/	

	termsOfService(); /* trigger the terms of service function in cn-global.js */

};// JavaScript Document
