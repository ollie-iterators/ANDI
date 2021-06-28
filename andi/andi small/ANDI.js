//=============================================//
//ANDI: Accessible Name & Description Inspector//
//Created By Social Security Administration    //
//=============================================//
//This is a temporary space for removing alerts and code that are not used in andi.js
// NOTE: Text Alternative Computation is in ANDI Accessible Name.js
// NOTE getAddOnProps is in ANDI getAddOnProps.js
// NOTE: jqueryPreferredVersion: 3.6.0
// NOTE: jqueryMinimumVersion: 1.9.1
var andiVersionNumber = "27.4.0";

//==============//
// ANDI CONFIG: //
//==============//
//URLs
var host_url = "https://ollie-iterators.github.io/ANDI/andi/";
var help_url = "https://ollie-iterators.github.io/ANDI/andi/help/";
var icons_url = "https://ollie-iterators.github.io/ANDI/andi/icons/";

//Load andi.css file immediately to minimize page flash
(function () {
	var head = document.getElementsByTagName("head")[0];
	var andiCss = document.createElement("link");
	andiCss.href = "https://ollie-iterators.github.io/ANDI/andi/andi.css";
	andiCss.type = "text/css";
	andiCss.rel = "stylesheet";
	andiCss.id = "ANDI508-css";
	var prevCss = document.getElementById("ANDI508-css");
	if (prevCss) { //remove already inserted CSS to improve performance on consequtive favelet launches
		head.removeChild(prevCss);
	}
	head.appendChild(andiCss);
})();

//===============//
// ANDI OBJECTS: //
//===============//
var testPageData;                          //Test Page Data Storage/Analysis, instantiated within module launch
var andiData;                              //Element Data Storage/Analysis, instatiated within module's analysis logic

//Define the overlay and find icons (not using background-image because of ie7 issues with sizing)
var overlayIcon = "<img src='" + icons_url + "overlay-off.png' class='ANDI508-overlayIcon' aria-label='overLay' />";
var findIcon = "<img src='" + icons_url + "find-off.png' class='ANDI508-findIcon' aria-label='find' />";
var listIcon = "<img src='" + icons_url + "list-off.png' class='ANDI508-listIcon' alt='' />";

// ANDI Alerts about aria-hidden on the page
//Check <html> and <body> elements for aria-hidden=true
if ($("html").first().attr("aria-hidden") === "true" || $("body").first().attr("aria-hidden") === "true") {
	var ariaHiddenMessage = "ANDI has detected aria-hidden=true on the <html> or <body> elements which would render this page invisible to a screen reader.";
	ariaHiddenMessage += " Press OK to remove the aria-hidden=true from the <html> and <body> elements to continue."
	if (confirm(ariaHiddenMessage)) {
		$("html").removeAttr("aria-hidden");
		$("body").removeAttr("aria-hidden");
	} else {
		alert("ANDI will not continue while aria-hidden=true is on <html> or <body> elements.");
		return; //Stops ANDI
	}
}

// NOTE: Work on frameset code. ANDI does not work on framesets

//Global Checks (To see the code, look in AndiCheck.js)
// andiCheck.isThereExactlyOnePageTitle();
// andiCheck.areThereMoreExclusiveChildrenThanParents();

//==================//
// ANDI INITIALIZE: //
//==================//
//This is called when jQuery is ready.
function launchAndi() {
	//Get ANDI ready to launch the first module
	andiReady();
}

//================//
// ALERT MESSAGES //
//================//
//This defines the class Alert
function Alert(level, group, message, info, alertButton) {
	this.level = level; 		//danger, warning, or caution
	this.group = group; 	//belongs to this alert group id
	this.message = message;	//message text
	this.info = info; 		//the id corresponding to the help page documentation
	this.alertButton = alertButton; //(optional) an alert button object
}
//Define Alerts used by all modules
var alert_0077 = new Alert("danger", "7", "Tabindex value \"%%%\" is not a number.", "tabindex_not_number");
var alert_0121 = new Alert("caution", "12", "Focusable element is not in keyboard tab order; should it be tabbable?", "not_in_tab_order");
var alert_0122 = new Alert("caution", "12", "Focusable element is not in keyboard tab order and has no accessible name; should it be tabbable?", "not_in_tab_order_no_name");
var alert_0123 = new Alert("warning", "12", "Iframe contents are not in keyboard tab order because iframe has negative tabindex.", "iframe_contents_not_in_tab_order");

//==================//
// DISPLAY HANDLING //
//==================//
//This private function will get ANDI ready
//Will add dependencies, insert the ANDI bar, add legacy css, define the controls
function andiReady() {
	dependencies();

	//This function sets up several dependencies for running ANDI on the test page.
	function dependencies() {
		//Define :focusable and :tabbable pseudo classes. Code from jQuery UI
		$.extend($.expr[':'], {
			data: $.expr.createPseudo ? $.expr.createPseudo(function (dataName) {
				return function (elem) {
					return !!$.data(elem, dataName);
				};
			}) : function (elem, i, match) {
				return !!$.data(elem, match[3]);
			},
			focusable: function (element) {
				return focusable(element, !isNaN($.attr(element, 'tabindex')));
			},
			tabbable: function (element) {
				var tabIndex = $.attr(element, 'tabindex'), isTabIndexNaN = isNaN(tabIndex);
				return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
			}
		});

		//Define :shown
		//Similar to :visible but doesn't include elements with visibility:hidden,
		$.extend(jQuery.expr[':'], {
			shown: function (elem) {
				return $(elem).css("visibility") !== "hidden" && $(elem).is(":visible");
			}
		});

		//Define isSemantically, Based on jquery .is method
		//Parameters: should be css selector strings
		//	roles:	semantic roles to check against. Example: "[role=link]"
		//	tags:	semantic tags to check against. Example: "a"
		//If the role is a trimmed empty string, gets semantics from the tagName
		$.fn.extend({
			isSemantically: function (roles, tags) {
				//If this has one of the roles or (is one of the tags and doesn't have another role that isn't empty)
				if ($.trim($(this).attr("role"))) {
					return $(this).is(roles);
				} else {
					return $(this).is(tags);
				}
			}
		});

		//Define focusable function: Determines if something is focusable and its ancestors are visible.
		//Code based on jQuery UI, modifications: disabled links, svg[focusable=true], tabindex=""
		function focusable(element) {
			var nodeName = element.nodeName.toLowerCase();
			var tabindex = $.attr(element, "tabindex"); //intentionally using jquery
			var isTabIndexNotNaN = !isNaN(tabindex) && tabindex !== "";
			if (nodeName === "area") {
				var map = element.parentNode; var mapName = map.name;
				if (!element.href || !mapName || map.nodeName.toLowerCase() !== "map") {
					return false;
				}
				var img = $("img[usemap=\\#" + mapName + "]")[0]; return !!img && visibleParents(img);
			}
			// TODO: Work on expanding the code in this return statement to understand it better
			var returnValue = "";
			if (/^(input|select|textarea|button|iframe|summary)$/.test(nodeName)) {
				returnValue = !element.disabled;
			} else {
				if (nodeName === "a") {
					returnValue = (element.href && !element.disabled) || isTabIndexNotNaN;
				} else {
					returnValue = isTabIndexNotNaN ||
								  //check for focusable svg
								  (nodeName === "svg" && $.attr(element, "focusable") === "true") ||
								  //check for contenteditable="true" or contenteditable=""
								  ($.attr(element, "contenteditable") === "true" || $.attr(element, "contenteditable") === "");
				}
			}
		    return (returnValue && visibleParents(element));
			function visibleParents(element) {
				return !$(element).parents().addBack().filter(function () {
					return $.css(this, "visibility") === "hidden";
				}).length;
			}
		}

		//Define .includes() to make indexOf more readable.
		if (!String.prototype.includes) {
			String.prototype.includes = function (search, start) {
				'use strict';
				if (typeof start !== "number") {
					start = 0;
				}
				if (start + search.length > this.length) {
					return false;
				} else {
					return this.indexOf(search, start) !== -1;
				}
			};
		}

		//Define isContainerElement: This support function will return true if an element can contain text (is not a void element)
		(function ($) {
			var visibleVoidElements = ['area', 'br', 'embed', 'hr', 'img', 'input', 'menuitem', 'track', 'wbr'];
			$.fn.isContainerElement = function () {
				return ($.inArray($(this).prop("tagName").toLowerCase(), visibleVoidElements) == -1);
			};
		}(jQuery));

	}
}

//==================//
// ELEMENT ANALYSIS //
//==================//
//This object grabs the accessible components and attaches the components and alerts to the element
//Should be re-instantiated for each element to be inspected
//If a child is passed in, it will grab the accessibility components from the child instead.
function AndiData(element, skipTAC) {
	testPageData.andiElementIndex++;

	AndiData.data = {
		andiElementIndex: testPageData.andiElementIndex,
		components: {} //will store the accessible components as they are gathered
	};
	var tagNameText = $(element).prop("tagName").toLowerCase();
	if (tagNameText === "input") {
		tagNameText += "[type=" + $(element).prop("type").toLowerCase() + "]"; //add the type within brackets
	}
	AndiData.data.tagNameText = tagNameText;
	var role = $.trim($(element).attr("role")).toLowerCase();
	if (role) {
		AndiData.data.role = role;
	}

	if (!skipTAC) { //do the text alternative computation
		AndiData.textAlternativeComputation(element);
		AndiData.grab_coreProperties(element);
	}

	return AndiData.data;
}

AndiData.grab_coreProperties = function (element) {
	AndiData.data.isTabbable = true; //assume true (prove to be false)
	var tabindex = $.trim($(element).attr("tabindex"));
	var nativelyTabbableElements = "a[href],button,input,select,textarea,iframe,area,[contenteditable=true],[contenteditable='']";
	if (tabindex) {
		if (tabindex < 0) {
			AndiData.data.isTabbable = false;
			if ($(element).is("iframe")) {
				//check if iframe has focusable contents
				if ($(element).contents().find(":focusable").length) {
					alerts = [alert_0123];
				}
			} else if (!$(element).parent().is(":tabbable")) {
				//element and parent are not tabbable
				if (AndiData.data.accName) {
					alerts = [alert_0121];
				} else {
					alerts = [alert_0122];
				}
			}
		} else if (isNaN(tabindex)) {//tabindex is not a number
			alerts = [alert_0077, [tabindex]];
			if (!$(element).is(nativelyTabbableElements))
				AndiData.data.isTabbable = false;
		}
		//element is tabbable
		AndiData.data.tabindex = tabindex;
	} else if (!$(element).is(nativelyTabbableElements)) {
		AndiData.data.isTabbable = false;
	}

	var accesskey = $(element).attr("accesskey");
	if (accesskey && accesskey !== " ") { //accesskey is not the space character
		accesskey = $.trim(accesskey.toUpperCase());
		AndiData.data.accesskey = accesskey;
	}

	var imageSrc;
	if ($(element).is("area")) {
		var map = $(element).closest("map");
		if (map) {
			imageSrc = $("#ANDI508-testPage img[usemap=\\#" + $(map).attr("name") + "]").first().attr("src");
		}
	} else if ($(element).is("img,input[type=image]")) {
		imageSrc = $(element).attr("src");
	} else if ($(element).is("svg")) {
		imageSrc = ($(element).find("image").first().attr("src"));
	}
	if (imageSrc) {
		imageSrc = imageSrc.split("/").pop(); //get the filename and extension only
		AndiData.data.src = imageSrc;
	}
};

TestPageData.allElements = undefined;
//This class is used to store temporary variables for the test page
function TestPageData() {
	TestPageData.allElements = $("#ANDI508-testPage *");

	//Keeps track of the number of focusable elements ANDI has found, used to assign unique indexes.
	//the first element's index will start at 1.
	//When ANDI is done analyzing the page, this number will equal the total number of elements found.
	this.andiElementIndex = 0;
}

launchAndi(); //initialize ANDI