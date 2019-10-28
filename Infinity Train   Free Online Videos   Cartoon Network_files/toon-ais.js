//Toon AdFuel Modules
//Deployed: 2018-11-26 14:35:43

////////////////////////////////////////////
//In View Refresh
////////////////////////////////////////////

/*!
 InViewRefresh AdFuel Module - Version 1.0
 - Initial Implementatino
 !*/
 (function createInViewRefreshModule() {

    /* For In View Refresh functionality */
    var _refreshableInViewSlots = {};
    var _inViewListenersStarted = false;
    var _focused = true;
    var TARGET_DISPLAY_MILLISECONDS = 35 * 1000;    // 35 seconds
    var TARGET_DISPLAY_PERCENT = .5;    // 50% in view

    var objectProto = Object.prototype;
    var toString = objectProto.toString;




    function addEvent(element, event, fn) {
        if (element.addEventListener) {
            element.addEventListener(event, fn, true);
        } else if (element.attachEvent) {
            element.attachEvent('on' + event, fn);
        }
    }

    function isFunction(object) {
        return toString.call(object) === '[object Function]';
    }

    function isObject(object) {
        var type = typeof object;
        return type === 'function' || type === 'object' && !!object;
    }

    function getURLParam(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        if (document.location.search) {
            var results = regex.exec(document.location.search);
            if (results) {
                return results[1];
            } else {
                return "";
            }
        } else {
            return "";
        }
    }

    function _debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    var log = function() {}; //noop

    if (isObject(window.console) && isFunction(window.console.log) && getURLParam("debug") == "true") {
        log = function(/* arguments */) {
            var args = ['[AdFuelModule - In View Refresh]'];
            args.push.apply(args, arguments);
            window.console.log.apply(window.console, args);
        };
    }

    function _startInViewListeners() {
        if (!_inViewListenersStarted) {
            addEvent(window, 'scroll', _efficientDetect);
            addEvent(window, 'blur', function () {
                //_focused = false;
                _efficientDetect();
            });
            addEvent(window, 'resize', _efficientDetect);
            addEvent(window, 'focus', function () {
                //_focused = true;
                _efficientDetect();
            });
            addEvent(document, 'GPTRenderComplete', _startElementListeners);
            addEvent(document, "visibilitychange", _visibilityChanged);
            _inViewListenersStarted = true;
            log("Listeners Started!");
        }
    }

    function _visibilityChanged(event){
        if (document.hidden){
            _focused = false;
        }else{
            _focused = true;
        }
    }

    var _efficientDetect = _debounce(_detectInView, 300);

    function _isInsideBounds(clientX1, clientX2, clientY1, clientY2, elX1, elX2, elY1, elY2, el) {

        var a = Math.max(clientY1, elY1);   //287
        var b = Math.min(clientY2, elY2);   //377
        var c = Math.max(clientX1, elX1);   //587.5
        var d = Math.min(clientX2, elX2);   //1315.5

        var viewableArea = 0;

        var aCheck = a >= clientY1 && a <= clientY2;
        var bCheck = b >= clientY1 && b <= clientY2;
        var cCheck = c >= clientX1 && c <= clientX2;
        var dCheck = d >= clientX1 && d <= clientX2;

        if (aCheck && bCheck && cCheck && dCheck) {
            viewableArea = (b - a) * (d - c);
        }

        var elArea = (elX2 - elX1) * (elY2 - elY1);

        var ratioArea = 0;
        if (elArea > 0) {
            ratioArea = viewableArea / elArea;
        }
        return ratioArea;
    }

    function _getPercentInView(el) {
        var client_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var client_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var client_x1 = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft;
        var client_y1 = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

        client_width = parseInt(client_width);
        client_height = parseInt(client_height);
        client_x1 = parseInt(client_x1);
        client_y1 = parseInt(client_y1);

        var el_width = parseInt(el.clientWidth);
        var el_height = parseInt(el.clientHeight);

        var el_xy = el.getBoundingClientRect();

        var el_x1 = el_xy.left + document.body.scrollLeft;
        var el_y1 = el_xy.top + document.body.scrollTop;
        var el_x2 = el_x1 + el_width;
        var el_y2 = el_y1 + el_height;

        var client_x2 = client_x1 + client_width;
        var client_y2 = client_y1 + client_height;

        var viewable_percent = _isInsideBounds(client_x1, client_x2, client_y1, client_y2, el_x1, el_x2, el_y1, el_y2, el);

        return viewable_percent;
    }

    function _startElementListeners(event) {
        var divId = event.detail.divId;
        var el = document.getElementById(divId);
        if (!event.detail.empty) {
            log("Slot Rendered: " + divId);
            if (_refreshableInViewSlots[divId] && !_refreshableInViewSlots[divId].listenersSet) {
                log("Slot is registered with InView Refresh");
                _refreshableInViewSlots[divId].inView = false;
                _refreshableInViewSlots[divId].el = el;
                _refreshableInViewSlots[divId].mouseover = addEvent(el, 'mouseover', _mouseoverFunction);
                _refreshableInViewSlots[divId].mouseout = addEvent(el, 'mouseout', _mouseoutFunction);
                _refreshableInViewSlots[divId].refreshCount = 0;
                _refreshableInViewSlots[divId].listenersSet = true;
                var maxRefreshCount = parseInt(_refreshableInViewSlots[divId].inViewRefreshCount) || 5;
                _efficientDetect();
            }
        } else {
            try {
                delete _refreshableInViewSlots[divId];
            } catch (err) {
            }
        }
    }

    function _mouseoverFunction() {
        var divId = this.id;
        log("Moused over: ", divId);



        if (_refreshableInViewSlots[divId].timer) {
            window.clearInterval(_refreshableInViewSlots[divId].timer);
            _refreshableInViewSlots[divId].inView = false;
            _refreshableInViewSlots[divId].timer = null;
        }
    }

    function _mouseoutFunction() {
        var divId = this.id;
        log("Moused out from " + divId + ". Restarting listener");
        _efficientDetect(_refreshableInViewSlots[divId]);
    }

    function _detectInView(renderedSlot) {
        log("Refreshable In-View Slots: ", _refreshableInViewSlots);
        if (renderedSlot){
            log("Detecting if ", renderedSlot, " is in view.");
        }else{
            log("Detecting In View Slots.");
        }
        var refreshSlot = function (divId) {
            var slot = _refreshableInViewSlots[divId];

            slot.timer = window.setInterval(function () {
                var el = slot.el;
                var focused = document.hidden;
                var viewTest = false;
                if (el){
                    viewTest = el && _focused && _getPercentInView(el) >= TARGET_DISPLAY_PERCENT && parseInt(slot.inViewRefreshCount) > 0;
                }
                if (viewTest) {
                    log("Slot [" + slot.el.id + "] is in view, is being refreshed, and has " + slot.inViewRefreshCount + " refreshes remaining.");
                    slot.inViewRefreshCounter = _refreshableInViewSlots[divId].inViewRefreshCounter || 0;
                    slot.inViewRefreshCount--;
                    slot.inViewRefreshCounter++;
                    window.AdFuel.removeSlotLevelTarget(divId, 'rfv');
                    window.AdFuel.addSlotLevelTarget(divId, 'rfv', _refreshableInViewSlots[divId].inViewRefreshCounter);

                    window.AdFuel.refresh([divId]);
                    log("Slot [" + slot.el.id + "] is in view, was just refreshed, and still has " + slot.inViewRefreshCount + " refreshes remaining.");
                } else {
                    log("Clearing interval for slot: " + slot.el.id);
                    window.clearInterval(slot.timer);
                    this.inView = false;
                    this.timer = null;
                }
            }, TARGET_DISPLAY_MILLISECONDS);
        };
        if (_refreshableInViewSlots.length < 1){
            log("No registered slots have been rendered yet.");
        }
        for (var divId in _refreshableInViewSlots) {
            log("Testing: ", divId);
            if (!renderedSlot || !renderedSlot.rktr_slot_id ||  (_refreshableInViewSlots.hasOwnProperty(divId) && _refreshableInViewSlots[divId] == renderedSlot)) {
                var slot = _refreshableInViewSlots[divId];
                var el = slot.el;
                var viewTest = false;
                if (el){
                    viewTest = el && _focused && _getPercentInView(el) >= TARGET_DISPLAY_PERCENT && parseInt(_refreshableInViewSlots[divId].inViewRefreshCount) > 0;
                    log ("_detectInView A: Testing " + divId + ":", {viewTest: viewTest, el: el, percentInView: _getPercentInView(el), refreshCount:  parseInt(_refreshableInViewSlots[divId].inViewRefreshCount), inView: this.inView, focused: _focused});
                }
                log ("_detectInView A: Viewtest: " + viewTest);
                if (viewTest != slot.inView) {
                    slot.inView = viewTest;
                    if (viewTest) {


                        log("Test is true. Start timer for slot:", divId);
                        refreshSlot(divId);
                    } else {

                        log("Test is false. Clear timer for slot:", divId);
                        window.clearInterval(slot.timer);
                        slot.timer = null;
                        slot.inView = false;
                    }
                }
            } else {
                var slot = _refreshableInViewSlots[divId];
                var el = slot.el;
                var viewTest = false;
                if (el){
                    viewTest = el && _focused && _getPercentInView(el) >= TARGET_DISPLAY_PERCENT && parseInt(_refreshableInViewSlots[divId].inViewRefreshCount) > 0;
                    log("_detectInView B: Testing " + divId + ":", {viewTest: viewTest, el: el, percentInView: _getPercentInView(el), refreshCount:  parseInt(_refreshableInViewSlots[divId].inViewRefreshCount), inView: this.inView, focused: _focused});
                }
                log ("_detectInView B: Viewtest: " + viewTest);
                if (viewTest != slot.inView) {
                    slot.inView = viewTest;
                    if (viewTest) {
                        log("Test is true. Refresh slot:", divId);
                        refreshSlot(divId);
                    }else {
                        log("Test is false. Clear timer for slot:", divId);
                        window.clearInterval(slot.timer);
                        slot.timer = null;
                        slot.inView = false;
                    }
                }
            }
        }
    }

    function preQueueCallback(asset, callback){

        var startListeners = false;
        var registeredSlots = [];
        for (var x = 1; x < asset.length; x++) {
            var slot = asset[x];
            slot.hasInViewRefresh = asset[0].hasInViewRefresh ? asset[0].hasInViewRefresh : (slot.hasInViewRefresh || "false");
            if (slot.hasInViewRefresh == "true"){
                slot.inViewRefreshCounter = 0;
                startListeners = true;
                registeredSlots.push(slot.rktr_slot_id);

            }
        }



        if (startListeners){
            _startInViewListeners();
        }
        if (callback){
            callback();
        }
        return null;
    }

    function preDispatchCallback(queue, callback){
        for (var qId = 0; qId < queue.length; qId++) {
            var rocketeerSlot = queue[qId];
            if (rocketeerSlot.hasInViewRefresh == "true") {
                log("Slot is configured for in view refresh.  Creating _refreshableInViewSlots[" + rocketeerSlot.rktr_slot_id + "]...");
                _refreshableInViewSlots[rocketeerSlot.rktr_slot_id] = rocketeerSlot;
            } else {
                log("Slot is not configured for in view refresh. [" + rocketeerSlot.rktr_slot_id + "]");
            }
        }












        
        callback();
    }

    function registerModuleWithAdFuel(){
        window.AdFuel.registerModule('In View Refresh', {preQueueCallback: preQueueCallback, preDispatchCallback: preDispatchCallback});
    }

    function init(){
        if (window.AdFuel) {
            //AdFuel loaded first
            registerModuleWithAdFuel();
        } else {
            //wait for AdFuel to load
            addEvent(window, 'AdFuelCreated', registerModuleWithAdFuel);
        }
    }

    init();

    return {
        startInViewListeners: _startInViewListeners
    };

})();


////////////////////////////////////////////
//Moat Yield Intelligence 1.0
////////////////////////////////////////////

(function createMYIModule() {

  var MODULE_NAME = 'Moat Yield Intelligence';
  var MODULE_VERSION = 'v1.0.1';

  var noop = function() { }

  var isFunction = function _isFunction(object) {
    return toString.call(object) === '[object Function]';
  };

  var isObject = function _isObject(object) {
    var type = typeof object;
    return type === 'function' || type === 'object' && !!object;
  };

  var getURLParam = function _getURLParam(name) {
    var nameParam = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regexS = '[\\?&]' + nameParam + '=([^&#]*)';
    var regex = new RegExp(regexS);
    if (document.location.search) {
      var results = regex.exec(document.location.search);
      if (results) {
        return results[1];
      }
      return '';
    }
    return '';
  };

  var getLogger = function _getLogger(moduleName, moduleVersion, logKey, style) {
    var log = noop;
    var info = noop;
    var warn = noop;
    var time = noop;
    var timeEnd = noop;
    var group = noop;
    var groupEnd = noop;
    var error = noop;
    var inGroup = false;
    var args;
    var styleFinal = style || '';
    var logKeyFinal = logKey || moduleName.toLowerCase();
    var debug = getURLParam('debug').split(',');
    var debugTest = isObject(window.console) && isFunction(window.console.log) && (debug[0] === "true"|| debug.indexOf(logKeyFinal.toLowerCase()) >= 0);

    if (debugTest) {
      log = function _logFunc(/* arguments */) {
        if (!inGroup) {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.log.apply(window.console, args);
        } else {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.log.apply(window.console, args);
        }
      };

      info = function _infoFunc(/* arguments */) {
        if (!inGroup) {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.info.apply(window.console, args);
        } else {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.info.apply(window.console, args);
        }
      };

      warn = function _warnFunc(/* arguments */) {
        if (!inGroup) {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.warn.apply(window.console, args);
        } else {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.warn.apply(window.console, args);
        }
      };

      error = function _errorFunc(/* arguments */) {
        if (!inGroup) {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.error.apply(window.console, args);
        } else {
          args = ['%c[' + moduleName + ' ' + moduleVersion + '] ', styleFinal]
          args.push.apply(args, arguments);
          window.console.error.apply(window.console, args);
        }

      };

      group = function _groupFunc(groupName) {
        if (!inGroup){
          var args = ['%c[' + moduleName + ' ' + moduleVersion + ']', styleFinal, groupName];
          inGroup = true;
          window.console.groupCollapsed.apply(window.console, args);
        }
      };

      groupEnd = function _groupEndFunc(groupName) {
        var args = ['%c[' + moduleName + ' ' + moduleVersion + ']', styleFinal, groupName];
        inGroup = false;
        try{ window.console.groupEnd.apply(window.console, args); }
        catch(err) {
          // Do Nothing
        }
      };

      time = function _timeFunc(timeTag) {
        var timeKey = '[' + moduleName + ' ' + moduleVersion + '] - ' + timeTag;
        group(timeTag);
        window.console.time(timeKey);
      };

      timeEnd = function _timeEndFunc(timeTag) {
        var timeKey = '[' + moduleName + ' ' + moduleVersion + '] - ' + timeTag;
        groupEnd(timeTag);
        window.console.timeEnd(timeKey);
      };

    }

    var logger = {
      log: log,
      info: info,
      warn: warn,
      error: error,
      time: time,
      timeEnd: timeEnd,
      group: group,
      groupEnd: groupEnd
    };
    return logger;
  };

  function addEvent(element, event, fn) {
    if (element.addEventListener) {
      element.addEventListener(event, fn, true);
    } else if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    }
  };

  var logger = getLogger(MODULE_NAME, MODULE_VERSION, 'myi', 'color: #d2b000; padding: 2px');

  var myiActive = false;

  function isMoatReady(){
    return window.moatPrebidApi
      && typeof window.moatPrebidApi.enableLogging === 'function'
      && window.moatPrebidApi.enableLogging()
      && typeof window.moatPrebidApi.pageDataAvailable === 'function'
      && window.moatPrebidApi.pageDataAvailable()
      && typeof window.moatPrebidApi.slotDataAvailable === 'function'
      && window.moatPrebidApi.slotDataAvailable()
      && typeof window.moatPrebidApi.safetyDataAvailable === 'function'
      && window.moatPrebidApi.safetyDataAvailable()
  }

  function setMoatPrebidData () {
    if (isMoatReady()){
      // Sets available targeting data on all existing GPT slot objects
      return window.moatPrebidApi.setMoatTargetingForAllSlots();
    } else {
      // Moat tag hasn’t rendered yet.
      // Optional: add handler to try again after a set timeout return false;
    }
  }

  function preDispatchCallback(asset, done) {
    if (myiActive){
      setTimeout(function preDispatchTimeoutFunc() {
        logger.log('Adding MYI Targeting to slots...');
        try {
          setMoatPrebidData()
        } catch (err) {
          logger.warn('Could not set MYI targeting: ', err);
        }
        done();
      }, 900);
    }else{
      done();
    }
  }

  function registerModuleWithAdFuel() {
    logger.log('Registering module with AdFuel');
    window.AdFuel.setOptions({
      queueCallbackTimeoutInMilliseconds: 1000,
      dispatchCallbackTimeoutInMilliseconds: 1000,
    });
    window.AdFuel.registerModule(MODULE_NAME, {
      preDispatchCallback: preDispatchCallback,
    });
  }

  function addMYIJavascript() {
    logger.log('Adding MYI script to head...');
    var myiTag = document.createElement('script');
    myiTag.async = true;
    myiTag.src = '//z.moatads.com/turnerprebidheader855272349771/yi.js';
    var targetNode = document.getElementsByTagName('head')[0];
    targetNode.insertBefore(myiTag, targetNode.firstChild);
    myiActive = true;
  }

  function init() {
    logger.log('Initializing Module...');
    addMYIJavascript();
    if (window.AdFuel && window.AdFuel.cmd) {
      //AdFuel loaded first
      window.AdFuel.cmd.push(registerModuleWithAdFuel);
    } else if (window.AdFuel) {
      registerModuleWithAdFuel();
    } else {
      addEvent(document, 'AdFuelCreated', registerModuleWithAdFuel);
    }
  }

  init();
})();


////////////////////////////////////////////
//PII Filter
////////////////////////////////////////////

/*!
    PII Filter AdFuel Module - Version 1.0
    - Compatible with AdFuel 1.x and AdFuel 2.x
    - Initial Implementation
!*/
(function createAdFuelModule() {

    var MODULE_NAME = "PII Filter";
    var re = /(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})/i;

    function piiIsPresentInQueryString() {
        var regex = new RegExp(re);
        if (document.location.search) {
            var dirtyResults = document.location.search.search(re) + 1;
            var cleanResults;
            try{
                cleanResults = decodeURIComponent(document.location.search).search(re) + 1;
            }catch(err){
                cleanResults = dirtyResults;
            }
            var results = { dirty: dirtyResults, clean: cleanResults };
            return dirtyResults || cleanResults;
        } else {
            return false;
        }
    }

    function piiIsPresentInHash() {
        var regex = new RegExp(re);
        if (document.location.hash) {
            var dirtyResults = document.location.hash.search(re) + 1;
            var cleanResults;
            try{
                cleanResults = decodeURIComponent(document.location.hash).search(re) + 1;
            }catch(err){
                cleanResults = dirtyResults;
            }
            var results = { dirty: dirtyResults, clean: cleanResults };
            return dirtyResults || cleanResults;
        } else {
            return false;
        }
    }

    function piiIsPresentInReferrer() {
        var regex = new RegExp(re);
        if (document.referrer){
            var dirtyResults = document.referrer.search(re) + 1;
            var cleanResults;
            try{
                cleanResults = decodeURIComponent(document.location.referrer).search(re) + 1;
            }catch(err){
                cleanResults = dirtyResults;
            }
            var results = { dirty: dirtyResults, clean: cleanResults };
            return dirtyResults || cleanResults;
        } else {
            return false;
        }
    }

    function filterDFPRequest(){
        if (piiIsPresentInQueryString() || piiIsPresentInHash() || piiIsPresentInReferrer()){
            console.log("[AdFuelModule - PII Filter] Filtering DFP Request due to PII in query string.");
            var AdFuelMethods = Object.getOwnPropertyNames(window.AdFuel);
            for (var x = 0; x < AdFuelMethods.length; x++){
                window.AdFuel[AdFuelMethods[x]] = function(){};
            }
            window.googletag = null;
        }
    }

    function init() {
        if (window.AdFuel) {
            //AdFuel loaded first
            filterDFPRequest();
        } else {
            //wait for AdFuel to load
            if (document.addEventListener) {
                document.addEventListener("AdFuelCreated", filterDFPRequest, true);
            } else if (document.attachEvent) {
                document.attachEvent('onAdFuelCreated', filterDFPRequest);
            }
        }
    }

    init();

})();


////////////////////////////////////////////
//Transaction ID 2.0
////////////////////////////////////////////

/*!
 TransactionID AdFuel Module - Version 2.0
 - Implementation of MetricAPI returned from AdFuel when registering module
 !*/
(function createTransactionIDModule() {
    var noop = function(){return false;};
    var metricApi = { addMetric: noop, getMetricById: noop, getMetricsByType: noop, getMetricTypes: noop };

    window.cnnad_transactionID = null;

    //referenced by registries
    window.cnnad_getTransactionID = function () {
        if (!window.cnnad_transactionID) {
            window.cnnad_transactionID = Math.round((new Date()).getTime() / 1000) + '' + Math.floor(Math.random() * 9007199254740992);
        }
        return window.cnnad_transactionID;
    };

    window.turner_getTransactionId = window.cnnad_getTransactionID;

    window.turner_getTransactionId();


    function init() {

        var objectProto = Object.prototype;
        var toString = objectProto.toString;

        function isFunction(object) {
            return toString.call(object) === '[object Function]';
        }

        function isObject(object) {
            var type = typeof object;
            return type === 'function' || type === 'object' && !!object;
        }

        function getURLParam(name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            if (document.location.search) {
                var results = regex.exec(document.location.search);
                if (results) {
                    return results[1];
                } else {
                    return "";
                }
            } else {
                return "";
            }
        }

        var log = function () {
        }; //noop

        if (isObject(window.console) && isFunction(window.console.log) && getURLParam("debug") == "true") {
            log = function (/* arguments */) {
                var args = ['[AdFuelModule - TransactionId]'];
                args.push.apply(args, arguments);
                window.console.log.apply(window.console, args);
            };
        }

        function registerModuleWithAdfuel() {
            var transId = window.turner_getTransactionId();
            metricApi = AdFuel.registerModule('Transaction Id', {});
            metricApi.addMetric({type: 'modules', id: 'Transaction Id', data: { targeting: { transId: transId } } } );
            window.AdFuel.addPageLevelTarget('transId', transId);
        }

        if (window.AdFuel) {
            //AdFuel loaded first
            registerModuleWithAdfuel();
        } else {
            //wait for AdFuel to load
            if (document.addEventListener) {
                document.addEventListener('AdFuelCreated', registerModuleWithAdfuel, true);
            } else if (document.attachEvent) {
                document.attachEvent('onAdFuelCreated', registerModuleWithAdfuel);
            }
        }
    }

    init();
})();

