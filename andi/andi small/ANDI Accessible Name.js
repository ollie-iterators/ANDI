//=============================================//
//ANDI: Accessible Name & Description Inspector//
//Created By Social Security Administration    //
//=============================================//
// NOTE: This is the code that is for creating the accessible name
// If you need to look up a function or variable, look in andi.js
var andiVersionNumber = "27.4.0";
//===============//
// ANDI OBJECTS: //
//===============//
var andiCheck = new AndiCheck();     //Alert Testing
var andiAlerter = new AndiAlerter(); //Alert Throwing
var andiUtility = new AndiUtility(); //String Manipulation
var testPageData;                    //Test Page Data Storage/Analysis, instantiated within module launch
var andiData;                        //Element Data Storage/Analysis, instatiated within module's analysis logic

//Define the overlay and find icons (not using background-image because of ie7 issues with sizing)
var overlayIcon = "<img src='https://ollie-iterators.github.io/ANDI/andi/icons/overlay-off.png' class='ANDI508-overlayIcon' aria-label='overLay' />";
var findIcon = "<img src='https://ollie-iterators.github.io/ANDI/andi/icons/find-off.png' class='ANDI508-findIcon' aria-label='find' />";
var listIcon = "<img src='https://ollie-iterators.github.io/ANDI/andi/icons/list-off.png' class='ANDI508-listIcon' alt='' />";

//================//
// ALERT MESSAGES //
//================//
//This defines the class Alert
function Alert(level, group, message, info) {
	this.level = level; 		//danger, warning, or caution
	this.group = group; 	//belongs to this alert group id
	this.message = message;	//message text
	this.info = info; 		//the id corresponding to the help page documentation
}
//Define Alerts used by all modules
var alert_0001 = new Alert("danger", "0", " has no accessible name, associated &lt;label&gt;, or [title].", "no_name_form_element");
var alert_0002 = new Alert("danger", "0", " has no accessible name, innerText, or [title].", "no_name_generic");
var alert_0003 = new Alert("danger", "0", " has no accessible name, [alt], or [title].", "no_name_image");
var alert_0004 = new Alert("danger", "0", "Table has no accessible name, &lt;caption&gt;, or [title].", "no_name_table");
var alert_0005 = new Alert("danger", "0", "Figure has no accessible name, &lt;figcaption&gt;, or [title].", "no_name_figure");
var alert_0007 = new Alert("danger", "0", "Iframe has no accessible name or [title].", "no_name_iframe");
var alert_0008 = new Alert("danger", "0", " has no accessible name.", "no_name_generic");
var alert_0009 = new Alert("warning", "0", "Iframe has no accessible name or [title].", "no_name_iframe");

var alert_0011 = new Alert("danger", "1", "%%%; element ids should be unique.", "dup_id");
var alert_0012 = new Alert("danger", "1", "More than one &lt;label[for=%%%]&gt; associates with this element [id=%%%].", "dup_for");

var alert_0021 = new Alert("warning", "2", "[aria-describedby] should be used in combination with a component that provides an accessible name.", "dby_alone");
var alert_0022 = new Alert("danger", "2", "&lt;legend&gt; should be used in combination with a component that provides an accessible name.", "legend_alone");

var alert_0031 = new Alert("danger", "3", "[aria-labeledby] is mispelled, use [aria-labelledby].", "misspell");
var alert_0032 = new Alert("danger", "3", "[aria-role] not a valid attribute, use [role] instead.", "aria_role");

var alert_0041 = new Alert("warning", "4", "Presentation table has data table markup (%%%); Is this a data table?", "pres_table_not_have");
var alert_0043 = new Alert("caution", "4", "Table has more than %%% levels of [scope=%%%].", "too_many_scope_levels");
var alert_0045 = new Alert("danger", "4", "[headers] attribute only valid on &lt;th&gt; or &lt;td&gt;.", "headers_only_for_th_td");
var alert_0046 = new Alert("danger", "4", "Table has no &lt;th&gt; cells.", "table_has_no_th");
var alert_0047 = new Alert("warning", "4", "Scope association needed at intersection of &lt;th&gt;.", "no_scope_at_intersection");
var alert_0048 = new Alert("caution", "4", "Table has no [scope] associations.", "table_has_no_scope");
var alert_0049 = new Alert("danger", "4", "Table using both [scope] and [headers], may cause screen reader issues.", "table_mixing_scope_and_headers");
var alert_004A = new Alert("danger", "4", "Table has no [headers/id] associations.", "table_has_no_headers");
var alert_004B = new Alert("danger", "4", "Table has no [scope] but does have [headers], switch to 'headers/id mode'.", "switch_table_analysis_mode");
var alert_004C = new Alert("danger", "4", "Table has no [headers/id] but does have [scope], switch to 'scope mode'.", "switch_table_analysis_mode");
var alert_004E = new Alert("danger", "4", "Table has no &lt;th&gt; or &lt;td&gt; cells.", "table_has_no_th_or_td");
var alert_004F = new Alert("danger", "4", "ARIA %%% has no %%% cells.", "aria_table_grid_structure");
var alert_004G = new Alert("danger", "4", "ARIA %%% has no [role=columnheader] or [role=rowheader] cells.", "aria_table_grid_structure");
var alert_004H = new Alert("danger", "4", "ARIA %%% has no [role=row] rows.", "aria_table_grid_structure");
var alert_004I = new Alert("warning", "4", "&lt;table&gt; with [role=%%%] is not recognized as a data table.", "table_nontypical_role");
var alert_004J = new Alert("warning", "4", "&lt;table[role=%%%]&gt; has %%% &lt;th&gt; cells missing columnheader or rowheader role.", "header_missing_role");
var alert_004K = new Alert("warning", "4", "&lt;table[role=%%%]&gt; has %%% cells not contained by [role=row].", "cells_not_contained_by_row_role");

var alert_0052 = new Alert("danger", "5", "[accessKey] value \"%%%\" has more than one character.", "accesskey_more_one");
var alert_0054 = new Alert("danger", "5", "Duplicate [accessKey=%%%] found on button.", "accesskey_duplicate");
var alert_0055 = new Alert("caution", "5", "Duplicate [accessKey=%%%] found.", "accesskey_duplicate");
var alert_0056 = new Alert("danger", "5", "Duplicate [accessKey=%%%] found on link.", "accesskey_duplicate");

var alert_0062 = new Alert("danger", "6", "[headers] attribute is referencing an element [id=%%%] external to its own table.", "headers_ref_external");
var alert_0063 = new Alert("warning", "6", "Element referenced by [%%%] with [id=%%%] not found.", "ref_id_not_found");
var alert_0065 = new Alert("danger", "6", "Improper use of [%%%] possible: Referenced ids \"%%%\" not found.", "improper_ref_id_usage");
var alert_0066 = new Alert("danger", "6", "Element referenced by [headers] attribute with [id=%%%] is not a &lt;th&gt;.", "headers_ref_not_th");
var alert_0067 = new Alert("warning", "6", "[headers] attribute is referencing a &lt;td&gt; with [id=%%%].", "headers_ref_is_td");
var alert_0068 = new Alert("warning", "6", "Element\'s [headers] references provide no association text.", "headers_refs_no_text");
var alert_0069 = new Alert("warning", "6", "In-page anchor target with [id=%%%] not found.", "anchor_target_not_found");
var alert_006A = new Alert("danger", "6", "&lt;img&gt; referenced by image map %%% not found.", "image_map_ref_not_found");
var alert_006B = new Alert("warning", "6", "[%%%] is referencing a legend which may cause speech verbosity.", "ref_legend");
var alert_006C = new Alert("warning", "6", "[%%%] reference contains another [%%%] reference which won't be used for this Output.", "ref_has_ref");
var alert_006D = new Alert("warning", "6", "[%%%] is directly referencing [id=%%%] multiple times which may cause speech verbosity.", "ref_is_duplicate");
var alert_006E = new Alert("warning", "6", "[%%%] is directly and indirectly referencing [id=%%%] which may cause speech verbosity.", "ref_is_direct_and_indirect");
var alert_006F = new Alert("warning", "6", "Element nested in &lt;label&gt; but label[for=%%%] does not match element [id=%%%].", "nested_label_for_no_match");

var alert_0071 = new Alert("danger", "7", "Page &lt;title&gt; cannot be empty.", "page_title_empty");
var alert_0072 = new Alert("danger", "7", "Page has no &lt;title&gt;.", "page_title_none");
var alert_0073 = new Alert("warning", "7", "Page has more than one &lt;title&gt; tag.", "page_title_multiple");
var alert_0074 = new Alert("danger", "7", "There are more legends (%%%) than fieldsets (%%%).", "too_many_legends");
var alert_0075 = new Alert("danger", "7", "There are more figcaptions (%%%) than figures (%%%).", "too_many_figcaptions");
var alert_0076 = new Alert("danger", "7", "There are more captions (%%%) than tables (%%%).", "too_many_captions");
var alert_0077 = new Alert("danger", "7", "Tabindex value \"%%%\" is not a number.", "tabindex_not_number");
var alert_0078 = new Alert("warning", "7", "Using HTML5, found deprecated %%%.", "deprecated_html");
var alert_0079 = new Alert("danger", "7", "List item %%% is not contained by a list container %%%.", "li_no_container");
var alert_007A = new Alert("danger", "7", "Description list item is not contained by a description list container &lt;dl&gt;.", "dd_dt_no_container");
var alert_007B = new Alert("caution", "7", "This &lt;a&gt; element has [name=%%%] which is a deprecated way of making an anchor target; use [id].", "deprecated_html_a_name");
var alert_007C = new Alert("warning", "7", "[scope=%%%] value is invalid; acceptable values are col, row, colgroup, or rowgroup.", "scope_value_invalid");

var alert_0081 = new Alert("warning", "8", "[alt] attribute is meant for &lt;img&gt; elements.", "alt_only_for_images");

var alert_0091 = new Alert("warning", "9", "Explicit &lt;label[for]&gt; only works with form elements.", "explicit_label_for_forms");

var alert_0101 = new Alert("warning", "10", "Combining %%% may produce inconsistent screen reader results.", "unreliable_component_combine");

var alert_0112 = new Alert("caution", "11", "JavaScript event %%% may cause keyboard accessibility issues; investigate.", "javascript_event_caution");

var alert_0121 = new Alert("caution", "12", "Focusable element is not in keyboard tab order; should it be tabbable?", "not_in_tab_order");
var alert_0122 = new Alert("caution", "12", "Focusable element is not in keyboard tab order and has no accessible name; should it be tabbable?", "not_in_tab_order_no_name");
var alert_0123 = new Alert("warning", "12", "Iframe contents are not in keyboard tab order because iframe has negative tabindex.", "iframe_contents_not_in_tab_order");
var alert_0124 = new Alert("warning", "12", "If &lt;canvas&gt; element is interactive with mouse, it's not keyboard accessible because there is no focusable fallback content.", "canvas_not_keyboard_accessible");
var alert_0125 = new Alert("warning", "12", "Element with [role=%%%] not in the keyboard tab order.", "role_tab_order");
var alert_0126 = new Alert("danger", "12", "Image defined as decorative is in the keyboard tab order.", "decorative_image_tab_order");
var alert_0127 = new Alert("caution", "12", "&lt;canvas&gt; element has focusable fallback content; Test for keyboard equivalency to mouse functionality.", "canvas_has_focusable_fallback");
var alert_0128 = new Alert("warning", "12", "&lt;a&gt; element has no [href], [id], or [tabindex]; This might be a link that only works with a mouse.", "anchor_purpose_unclear");
var alert_0129 = new Alert("caution", "12", "&lt;a&gt; element has no [href], or [tabindex]; This might be a link that only works with a mouse.", "anchor_purpose_unclear");
var alert_012A = new Alert("caution", "12", "This &lt;a&gt; element is the target of another link; When link is followed, target may not receive visual indication of focus.", "is_anchor_target_no_focus");

var alert_0132 = new Alert("caution", "13", "Empty header cell.", "empty_header_cell");
var alert_0133 = new Alert("caution", "13", "Live region has no innerText content.", "live_region_empty");

var alert_0142 = new Alert("caution", "14", "Image is presentational; its [alt] will not be used in output.", "image_alt_not_used");

var alert_0151 = new Alert("warning", "15", "[%%%] attribute length exceeds " + 250 + " characters; consider condensing.", "character_length");

var alert_0161 = new Alert("warning", "16", "Ambiguous Link: same name/description as another link but different href.", "ambiguous_link");
var alert_0162 = new Alert("caution", "16", "Ambiguous Link: same name/description as another link but different href.", "ambiguous_link");//caution level thrown for internal links
var alert_0163 = new Alert("caution", "16", "Link text is vague and does not identify its purpose.", "vague_link");
var alert_0164 = new Alert("warning", "16", "Link has click event but is not keyboard accessible.", "link_click_no_keyboard_access");
var alert_0168 = new Alert("warning", "16", "&lt;a&gt; without [href] may not be recognized as a link; add [role=link] or [href].", "not_recognized_as_link");

var alert_0171 = new Alert("danger", "17", "&lt;marquee&gt; element found, do not use.", "marquee_found");
var alert_0172 = new Alert("danger", "17", "&lt;blink&gt; element found, do not use.", "blink_found");
var alert_0173 = new Alert("danger", "17", "Server side image maps are not accessible.", "server_side_image_map");
var alert_0174 = new Alert("caution", "17", "Redundant phrase in image [alt] text.", "image_alt_redundant_phrase");
var alert_0175 = new Alert("warning", "17", "Image [alt] text contains file name.", "image_alt_contains_file_name");
var alert_0176 = new Alert("danger", "17", "Image [alt] text is not descriptive.", "image_alt_not_descriptive");
var alert_0177 = new Alert("caution", "17", "Ensure that background images are decorative.", "ensure_bg_images_decorative");
var alert_0178 = new Alert("danger", "17", "&lt;area&gt; not contained in &lt;map&gt;.", "area_not_in_map");
var alert_0179 = new Alert("caution", "17", "Screen reader will not recognize this font icon as an image; Add an appropriate role such as [role=img].", "");
var alert_017A = new Alert("caution", "17", "Font Icon. Is this a meaningful image?", "");

var alert_0180 = new Alert("warning", "18", "[aria-level] is not a greater-than-zero integar; level 2 will be assumed.", "arialevel_not_gt_zero_integar");
var alert_0182 = new Alert("danger", "18", "Live Region contains a form element.", "live_region_form_element");
var alert_0183 = new Alert("danger", "18", "[role=image] is invalid; Use [role=img].", "role_image_invalid");
var alert_0184 = new Alert("danger", "18", "A live region can only be a container element.", "live_region_not_container");
var alert_0185 = new Alert("danger", "18", "List item's container is not recognized as a list because it has [role=%%%].", "non_list_role");

var alert_0190 = new Alert("warning", "19", "Element visually conveys heading meaning but not using semantic heading markup.", "not_semantic_heading");
var alert_0191 = new Alert("warning", "19", "Heading element level &lt;%%%&gt; conflicts with [aria-level=%%%].", "conflicting_heading_level");
var alert_0192 = new Alert("caution", "19", "[role=heading] used without [aria-level]; level 2 will be assumed.", "role_heading_no_arialevel");

var alert_0200 = new Alert("warning", "20", "Non-unique button: same name/description as another button.", "non_unique_button");

var alert_0210 = new Alert("caution", "21", "An associated &lt;label&gt; containing text would increase the clickable area of this %%%.", "label_clickable_area");

var alert_0220 = new Alert("warning", "22", "Content has been injected using CSS pseudo-elements ::before or ::after.", "pseudo_before_after");

var alert_0230 = new Alert("warning", "23", "Element has background-image; Perform manual contrast test.", "manual_contrast_test_bgimage");
var alert_0231 = new Alert("caution", "23", "Page has images; If images contain meaningful text, perform manual contrast test.", "manual_contrast_test_img");
var alert_0232 = new Alert("warning", "23", "Opacity less than 100%; Perform manual contrast test.", "manual_contrast_test_opacity");
var alert_0233 = new Alert("caution", "23", "[role=grid] found; test navigation of design pattern.", "grid_navigation_test");

var alert_0240 = new Alert("danger", "24", "Text does not meet %%%minimum %%% contrast ratio (%%%:1).", "min_contrast");

var alert_0250 = new Alert("warning", "25", "Page has %%% disabled %%%; Disabled elements are not in the keyboard tab order.", "disabled_elements");
var alert_0251 = new Alert("caution", "25", "Page has %%% disabled elements; Disabled elements do not require sufficient contrast.", "disabled_contrast");

var alert_0260 = new Alert("danger", "26", "Element is hidden from screen reader using [aria-hidden=true] resulting in no output.", "ariahidden");
var alert_0261 = new Alert("warning", "26", "Element is hidden from screen reader using [aria-hidden=true] resulting in no output.", "ariahidden");

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
			data: $.expr.createPseudo ? $.expr.createPseudo(function (dataName) { return function (elem) { return !!$.data(elem, dataName); }; }) : function (elem, i, match) { return !!$.data(elem, match[3]); },
			focusable: function (element) { return focusable(element, !isNaN($.attr(element, 'tabindex'))); },
			tabbable: function (element) {
				var tabIndex = $.attr(element, 'tabindex'), isTabIndexNaN = isNaN(tabIndex); return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
			}
		});

		//Define :shown
		//Similar to :visible but doesn't include elements with visibility:hidden,
		$.extend(jQuery.expr[':'], {
			shown: function (elem) { return $(elem).css("visibility") !== "hidden" && $(elem).is(":visible"); }
		});

		//Define isSemantically, Based on jquery .is method
		//Parameters: should be css selector strings
		//	roles:	semantic roles to check against. Example: "[role=link]"
		//	tags:	semantic tags to check against. Example: "a"
		//If the role is a trimmed empty string, gets semantics from the tagName
		$.fn.extend({
			isSemantically: function (roles, tags) {
				//If this has one of the roles or (is one of the tags and doesn't have another role that isn't empty)
				if ($.trim($(this).attr("role")))
					return $(this).is(roles);
				else
					return $(this).is(tags);
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
				if (!element.href || !mapName || map.nodeName.toLowerCase() !== "map") return false;
				var img = $("img[usemap=\\#" + mapName + "]")[0]; return !!img && visibleParents(img);
			}
			return (
				/^(input|select|textarea|button|iframe|summary)$/.test(nodeName) ?
					!element.disabled
					: nodeName === "a" ?
						(element.href && !element.disabled) || isTabIndexNotNaN
						: isTabIndexNotNaN ||
						//check for focusable svg
						(nodeName === "svg" && $.attr(element, "focusable") === "true") ||
						//check for contenteditable="true" or contenteditable=""
						($.attr(element, "contenteditable") === "true" || $.attr(element, "contenteditable") === "")
			) && visibleParents(element);
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
				if (typeof start !== "number") start = 0;
				if (start + search.length > this.length) return false;
				else return this.indexOf(search, start) !== -1;
			};
		}

		//Define isContainerElement: This support function will return true if an element can contain text (is not a void element)
		(function ($) {
			var visibleVoidElements = ['area', 'br', 'embed', 'hr', 'img', 'input', 'menuitem', 'track', 'wbr'];
			$.fn.isContainerElement = function () { return ($.inArray($(this).prop("tagName").toLowerCase(), visibleVoidElements) == -1); };
		}(jQuery));
	}
}

//This class is used to perform common utilities such as regular expressions and string alertations.
function AndiUtility() {
	//cache the regex for performance gains
	this.lessthanthan_regex = /</g;
	this.whitespace_regex = /\s+/g;

	this.condenseWhitespace = function (string) {
		if (string !== undefined)
			return string.replace(this.whitespace_regex, " ");
	};

	this.getVisibleInnerText = function (element, root) {
		var innerText = "";
		var exclusions = ".ANDI508-overlay,script,noscript,iframe";
		var node;
		if (!$(element).is(exclusions) && element.childNodes) {
			//Loop through this element's child nodes
			lookForPseudoContent("before", element);

			for (var z = 0; z < element.childNodes.length; z++) {
				node = element.childNodes[z];
				if (node.nodeType === 1) {//element node
					if ($(node).is(":shown") && !$(node).is("[aria-hidden=true]")) {
						if (root != node && !isEmbeddedControl(node))
							innerText += this.getVisibleInnerText(node, root);

						if (andiUtility.isBlockElement(node))
							innerText += " ";
					}
				}
				else if (node.nodeType === 3) {//text node
					innerText += andiUtility.condenseWhitespace(node.nodeValue);
				}
			}

			lookForPseudoContent("after", element);
		}
		return innerText;

		//This function is essentially StepE of the TAC
		function isEmbeddedControl(node) {
			var component;
			if ($(node).is("input[type=text]")) { //get value
				innerText += $(node).val();
				return true;
			}
			else if ($(node).is("[role=combobox],[role=listbox]")) { //get chosen option
				component = $(node).find("[role=option][aria-selected=true]").first().text();
				if (component && $.trim(component) !== "") {
					innerText += component;
				}
				return true;
			}
			else if ($(node).is("select")) { //get chosen option
				component = $(node).find("option:selected").first().text();
				if (component && $.trim(component) !== "") {
					innerText += component;
				}
				return true;
			}
			else if ($(node).is("[role=progressbar],[role=scrollbar],[role=slider],[role=spinbutton]")) {
				component = $(node).attr("aria-valuetext");
				if (component && $.trim(component) !== "") {
					innerText += component;
				}
				else {
					component = $(node).attr("aria-valuenow");
					if (component && $.trim(component) !== "") {
						innerText += component;
					}
				}
				return true;
			}
			return false;
		}

		//This function checks for pseudo element content and adds to the innerText
		function lookForPseudoContent(pseudo, element, data) {
			var pseudoObject = andiUtility.getPseudoContent(pseudo, element);
			if (pseudoObject) {
				innerText += pseudoObject[0];
			}
		}
	};

	//This function checks for pseudo element content
	//Return: Array [displayText, contentLiteral]
	this.getPseudoContent = function (pseudo, element) {
		if (!oldIE && window.getComputedStyle(element, ":" + pseudo).display !== "none") {
			//pseudo element is not display:none
			var contentLiteral = window.getComputedStyle(element, ":" + pseudo).content;

			if (contentLiteral !== "none" && contentLiteral !== "normal" && contentLiteral !== "counter" && contentLiteral !== "\"\"") {//content is not none or empty string
				var displayText = "";
				if (!!hasReadableCharacters(contentLiteral));
				return [displayText, contentLiteral];
			}
		}
		return undefined;

		function hasReadableCharacters(content) {
			var unicode, c;

			//replaces \a with a space
			content = content.replace(/\\a /, " ");

			content = stripContentKeywords(content);

			for (var i = 0; i < content.length; i++) {
				unicode = content.charCodeAt(i);

				c = content.charAt(i);
				if ( //if unicode is not in a private use range
					(unicode < 57344) ||
					!(
						(unicode >= 57344 && unicode <= 63743) ||
						(unicode >= 983040 && unicode <= 1048573) ||
						(unicode >= 1048576 && unicode <= 1114109)
					)
				) {
					displayText += c;
				}
			}

			//strip double quotes. TODO: do it more "carefully"
			var regex_everydoublequote = /"/g;
			displayText = displayText.replace(regex_everydoublequote, '');

			return displayText;
		}

		//This function removes CSS content keywords for display purposes
		function stripContentKeywords(c) {
			//gets common content keywords and their values between parens and the parens
			var regex_keywords = /(url\()(.*)(\))|(counter\()(.*)(\))|(counters\()(.*)(\))/;

			//removes common content keywords and their values between parens and the parens
			c = c.replace(regex_keywords, '');

			return c;
		}
	};

	this.isBlockElement = function (node) {
		var blockStyles = {
			display: ["block", "grid", "table", "flex", "list-item"],
			position: ["absolute", "fixed"],
			float: ["left", "right", "inline"],
			clear: ["left", "right", "both", "inline"]
		};

		var blockElements = ["address", "article", "aside", "blockquote", "br", "caption", "dd", "div", "dl", "dt", "fieldset",
			"figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "header", "legend",
			"li", "main", "nav", "ol", "output", "p", "pre", "section", "table", "td", "tfoot", "th", "tr", "ul"];

		for (var prop in blockStyles) {
			if (blockStyles.hasOwnProperty(prop)) {
				var values = blockStyles[prop];
				var style = $(node).css(prop);
				for (var i = 0; i < values.length; i++) {
					if (style &&
						((values[i].indexOf("!") === 0 &&
							[values[i].slice(1), "inherit", "initial", "unset"].indexOf(style) === -1) ||
							style.indexOf(values[i]) !== -1)
					) {
						return true;
					}
				}
			}
		}
		if (node.nodeName && blockElements.indexOf(node.nodeName.toLowerCase()) !== -1) {
			return true;
		}
		return false;
	};
}

//================//
// Grab Semantics://
//================//
AndiData.grab_semantics = function (element, data) {
	grab_tagName();
	grab_role();

	function grab_tagName() {
		var tagNameText = $(element).prop("tagName").toLowerCase();
		if (tagNameText === "input")
			tagNameText += "[type=" + $(element).prop("type").toLowerCase() + "]"; //add the type within brackets
		data.tagNameText = tagNameText;
	}

	function grab_role() {
		var role = $.trim($(element).attr("role")).toLowerCase();
		if (role)
			data.role = role;
	}
};

//==============================//
// Text Alternative Computation://
//==============================//
AndiData.textAlternativeComputation = function (root) {
	var isAriaHidden = traverseAriaHidden(root);
	var isNamed = false;
	var isDescribed = false;
	var component;
	var stepF_exclusions = "figure,iframe,select,table,textarea";
	var usedInName = {};
	var isNameFromContent;
	//check against this list to prevent infinite loops
	var nodesTraversed;
	var isCalcAccDesc = false;

	//This function recursively travels up the anscestor tree looking for aria-hidden=true.
	//Stops at #ANDI508-testPage because another check will stop ANDI if aria-hidden=true is on body or html
	//TODO: This is expensive
	function traverseAriaHidden(element) {
		if ($(element).is("#ANDI508-testPage"))
			return false;
		else if ($(element).attr("aria-hidden") === "true")
			return true;
		else
			return traverseAriaHidden($(element).parent());
	}

	function calcAccName(result) {
		if (!isNamed && result) {
			isNamed = true;
			AndiData.data.accName = $.trim(result);
			//determine if components that could also be describers where used in the name
			checkIfUsedInName(["value", "caption", "title"]);
		}

		function checkIfUsedInName(list) {
			for (var u = 0; u < list.length; u++) {
				if (AndiData.data.components[list[u]]) {
					usedInName[list[u]] = true;
					break;
				}
			}
		}
	}
	function calcAccDesc(result) {
		if (!isDescribed && result) {
			isDescribed = true;
			AndiData.data.accDesc = $.trim(result);
		}
	}
	function checkIfGroupFound(result) {
		if (result) {
			AndiData.data.accGroup = $.trim(result);
		}
	}

	if (!isAriaHidden) {
		//Calculate Accessible Name
		nodesTraversed = [];
		calcAccName(stepB(root, AndiData.data.components));
		calcAccName(stepC(root, AndiData.data.components));
		calcAccName(stepD(root, AndiData.data.components));
		if (!$(root).is(stepF_exclusions))
			calcAccName(stepF(root, AndiData.data.components));
		calcAccName(stepI(root, AndiData.data.components));
		calcAccName(stepJ(root, AndiData.data.components));

		//Calculate Accessible Description
		isCalcAccDesc = true;
		nodesTraversed = [];
		calcAccDesc(stepB(root, AndiData.data.components));
		calcAccDesc(stepD(root, AndiData.data.components));
		calcAccDesc(stepI(root, AndiData.data.components));

		//Calculate Element Grouping
		nodesTraversed = [];
		checkIfGroupFound(stepZ(root, AndiData.data));

	}
	else {
		AndiData.data.isAriaHidden = true;
	}

	//stepB: aria-labelledby or aria-describedby
	//Params:	isProcessRefTraversal - keeps track of whether the calculation is already doing a reference traversal to prevent infinite looping
	function stepB(element, data, isProcessRefTraversal) {
		var accumulatedText = "";
		if (!isProcessRefTraversal) {
			var componentType = (isCalcAccDesc) ? "ariaDescribedby" : "ariaLabelledby";
			var attribute = (isCalcAccDesc) ? "aria-describedby" : "aria-labelledby";
			var component = $(element).attr(attribute);

			if (component !== undefined) {
				if (!isEmptyComponent(component, componentType, element)) {
					var idsArray = component.split(" ");
					var refElement;
					var missingReferences = [];
					var firstRefInstances = []; //stores refIds that have been found for the first time
					var duplicateRefInstances = []; //will store any duplicate refIds (prevents alert being thown multiple times for same id)

					for (var x = 0; x < idsArray.length; x++) { //for each id in the array the array
						if (idsArray[x] !== "") {
							if (firstRefInstances.indexOf(idsArray[x]) === -1) {
								//id has not been referenced yet
								firstRefInstances.push(idsArray[x]);
								refElement = document.getElementById(idsArray[x]);

								if (refElement) {
									if ($(refElement).is("legend")) //is directly referencing a legend
										alert = [alert_006B, [attribute]];
									if (!hasNodeBeenTraversed(refElement)) {
										andiCheck.areThereAnyDuplicateIds(attribute, idsArray[x]);

										//Don't call stepB again to avoid infinite loops (spec explicitely defines this)
										if (element != refElement && $(refElement).attr(attribute)) {//reference contains another reference
											alert = [alert_006C, [attribute, attribute]];
											AndiData.addComp(data, componentType, [("\"\" "), refElement, idsArray[x]]);
										}

										var refData = {}; //will be discarded
										if (calcRefName(stepC(refElement, refData))); //aria-label
										else if (calcRefName(stepD(refElement, refData))); //native markup
										else if (calcRefName(stepE(refElement, refData))); //embedded control
										else if (calcRefName(stepF(refElement, refData, true, true))); //name from content
										else if (calcRefName(stepI(refElement, refData))); //title attribute
										else if (calcRefName(stepJ(refElement, refData))); //placeholder
									}
									else {//Referenced Element has already been traversed.
										alert = [alert_006E, [attribute, idsArray[x]]];
										var refData = {}; //will be discarded
										var alreadyTraversedText = (
											stepC(refElement, refData) ||
											stepD(refElement, refData) ||
											//stepE(refElement, refData) ||
											stepF(refElement, refData, true, true) ||
											stepI(refElement, refData) ||
											stepJ(refElement, refData)
										);
										AndiData.addComp(data, componentType, [alreadyTraversedText, refElement, idsArray[x]]);
									}
								}
								else {//No, this id was not found, add to list.
									missingReferences.push(idsArray[x]);
									AndiData.addComp(data, componentType, [" ", undefined, idsArray[x]]);
								}
							}
							else { //id has already been directly referenced, this is a duplicate
								if (duplicateRefInstances.indexOf(idsArray[x]) === -1) {
									duplicateRefInstances.push(idsArray[x]);
									alert = [alert_006D, [attribute, idsArray[x]]];
								}
							}
						}
					}//end for loop

					if (idsArray.length === missingReferences.length) {//none of the id references return anything useful
						addEmptyComponent(componentType, data[componentType][0]); //add empty component
						delete data[componentType]; //remove from component list
					}

					andiCheck.areThereMissingReferences(attribute, missingReferences);
				}
			}
		}
		return accumulatedText;

		function calcRefName(result) {
			if (result) {
				accumulatedText += AndiData.addComp(data, componentType, [(result + " "), refElement, refElement.id]);
				return true;
			}
			return false;
		}
	}

	//stepC: aria-label
	function stepC(element, data) {
		var accumulatedText = "";
		component = $(element).attr("aria-label");
		if (component !== undefined) {
			if (!isEmptyComponent(component, "ariaLabel", element)) {
				accumulatedText += AndiData.addComp(data, "ariaLabel", component) + " ";
			}
		}
		return accumulatedText;
	}

	//stepD: native markup
	//isRecursion is used to prevent an input from grabbing its label twice
	function stepD(element, data, isRecursion) {
		var accumulatedText = "";
		var component;
		var role = $(element).attr("role");

		if (!isCalcAccDesc) {
			component = $(element).attr("alt");
			if (component !== undefined) {
				//TODO: what about svg <image>
				if ($(element).is("img,input[type=image],area") && (!role || role === "img")) {
					if (!isEmptyComponent(component, "alt", element)) {
						accumulatedText += AndiData.addComp(data, "alt", component, hasNodeBeenTraversed(element));
					}
				}
				else if ($.trim(component) !== "") {//because alt="" is allowed for images only
					if ($(element).is("img[role=presentation],img[role=none]")) {
						alert = alert_0142;
					} else {
						alert = alert_0081;
					}
					AndiData.addComp(data, "alt", component);
				}
			}
		}

		if ($(element).is("input[type=image],input[type=button],input[type=submit],input[type=reset]")) {
			//value (can be namer or describer)
			if (!data.value) {
				if (!accumulatedText) {
					component = $(element).attr("value");
					if (component) {
						accumulatedText += AndiData.addComp(data, "value", component, hasNodeBeenTraversed(element));
					}
					else {//if type is submit or reset, add component
						var type = $(element).attr("type");
						if (type === "submit")
							accumulatedText += AndiData.addComp(data, "value", "Submit", hasNodeBeenTraversed(element));
						else if (type === "reset")
							accumulatedText += AndiData.addComp(data, "value", "Reset", hasNodeBeenTraversed(element));
					}
				}
			}
			else if (isCalcAccDesc && !usedInName.value) {
				accumulatedText += data.value;
			}
		}

		if ($(element).is("table")) {
			if (!data.caption) { //caption (can be namer or describer)
				component = grab_caption(element);
				if (component && !accumulatedText) {
					var caption = AndiData.addComp(data, "caption", component, hasNodeBeenTraversed(element));
					if (role !== "presentation" && role !== "none")
						accumulatedText += caption;
				}
			}
			else if (isCalcAccDesc && !usedInName.caption) {
				accumulatedText += data.caption;
			}

			//summary
			if (!isCalcAccDesc) {
				component = $(element).attr("summary");
				if (component !== undefined) {
					if (!isEmptyComponent(component, "summary", element)) {
						var summary = AndiData.addComp(data, "summary", component, hasNodeBeenTraversed(element));
						if (!accumulatedText && role !== "presentation" && role !== "none")
							accumulatedText += summary;
					}
				}
			}
		}
		else if (!isCalcAccDesc) {
			if ($(element).isSemantically("[role=textbox],[role=combobox],[role=listbox],[role=checkbox],[role=radio]", "input,select,textarea,[contenteditable=true],[contenteditable='']")) {
				component = grab_label(element);
				if (component !== undefined) {
					if (!isEmptyComponent(component[0], "label", element)) {
						accumulatedText += AndiData.addComp(data, "label", component, (isRecursion || hasNodeBeenTraversed(element)));
					}
				}
			}
			else if ($(element).is("fieldset")) {
				component = grab_legend(element);
				if (component !== undefined) {
					accumulatedText += AndiData.addComp(data, "legend", component, hasNodeBeenTraversed(element));
				}
			}
			else if (f$(element).is("figure")) {
				component = grab_figcaption(element);
				if (component !== undefined) {
					accumulatedText += AndiData.addComp(data, "figcaption", component, hasNodeBeenTraversed(element));
				}
			}
			else if (($(element).is("svg") || element instanceof SVGElement)) {
				if (!hasNodeBeenTraversed(element)) {
					component = $(element).find("title").first().text();
					if (component !== undefined) {
						accumulatedText += AndiData.addComp(data, "svgTitle", component);
					}

					component = $(element).find("desc").first().text();
					if (component !== undefined) {
						if (data.svgTitle)
							accumulatedText += " ";
						accumulatedText += AndiData.addComp(data, "svgDesc", component);
					}
				}
			}
		}

		return accumulatedText;
	}

	//stepE: embedded control
	function stepE(element, data) {
		var accumulatedText = "";
		if ($(element).is("input[type=text]")) {
			accumulatedText += $(element).val();
		}
		else if ($(element).is("select")) {
			var selectedOption = $(element).find("option:selected").first();
			if (selectedOption)
				accumulatedText += andiUtility.getVisibleInnerText(selectedOption[0], root);
		}
		else if ($(element).is("[role=combobox],[role=listbox],[role=progressbar],[role=scrollbar],[role=slider],[role=spinbutton]")) {
			accumulatedText += andiUtility.getVisibleInnerText(element, root);
		}
		return accumulatedText;
	}

	//stepF: name from content
	function stepF(element, data, isNameFromContent, isProcessRefTraversal) {
		var accumulatedText = "";

		var exclusions = ".ANDI508-overlay,script,noscript,iframe";

		var node, beforePseudo, afterPseudo;
		var nameFromContent_roles = "[role=button],[role=cell],[role=checkbox],[role=columnheader],[role=gridcell],[role=heading],[role=link],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=radio],[role=row],[role=rowgroup],[role=rowheader],[role=switch],[role=tab],[role=tooltip],[role=tree],[role=treeitem]";
		var nameFromContent_tags = "label,button,a,th,td,h1,h2,h3,h4,h5,h6";

		if (!data) //create data object if not passed
			data = {};

		if (!isNameFromContent) //determine name from content unless passed
			isNameFromContent = $(element).isSemantically(nameFromContent_roles, nameFromContent_tags);

		//get CSS ::before content
		lookForPseudoContent("before", element, data);

		//Loop through this element's child nodes
		for (var z = 0; z < element.childNodes.length; z++) {
			node = element.childNodes[z];
			if ($(node).attr("aria-hidden") !== "true") {//this node is not hidden
				//TODO: the following line prevents a node from being traversed more than once
				//if(node.nodeType === 1 && (!isProcessRefTraversal || !hasNodeBeenTraversed(node))){//element node
				if (node.nodeType === 1) {//element node
					if (root != node && $(node).is("select")) {
						//loop through selected options to accumulate text
						$(node).find("option:selected").each(function () {
							if (this.childNodes.length)
								accumulatedText += AndiData.addComp(data, "innerText", stepG(this.childNodes[0], data));
						});
					}
					else if (!$(node).is(exclusions) && $(node).is(":shown")) {
						var subtreeData;
						if (isNameFromContent || $(node).isSemantically(nameFromContent_roles, nameFromContent_tags)) {
							//Recurse through subtree
							subtreeData = {};

							if (!isProcessRefTraversal && calcSubtreeName(stepB(node, subtreeData))); //aria-labelledby
							else if (calcSubtreeName(stepC(node, subtreeData))); //aria-label
							else if (calcSubtreeName(stepD(node, subtreeData, true))); //native markup
							else if (root != node && calcSubtreeName(stepE(node, subtreeData))); //embedded control
							else if (root != node && calcSubtreeName(stepF(node, subtreeData, true, isProcessRefTraversal), true)); //name from content
							else if (calcSubtreeName(stepI(node, subtreeData, true))); //title attribute
							else if (calcSubtreeName(stepJ(node, subtreeData))); //placeholder

							pushSubtreeData(data, subtreeData, node);
						}
						else {//not a name from content element
							subtreeData = {};
							accumulatedText += stepF(node, subtreeData, false, isProcessRefTraversal);
							if (accumulatedText !== "" && andiUtility.isBlockElement(node))
								accumulatedText += " "; //add extra space after block elements
							pushSubtreeData(data, subtreeData, node);
						}
					}
				}
				else if (node.nodeType === 3) {//text node
					accumulatedText += AndiData.addComp(data, "innerText", stepG(node, data));
				}
			}
		}

		//get CSS ::after content
		lookForPseudoContent("after", element, data);

		return accumulatedText;

		function calcSubtreeName(result, checkForBlockLevelElement) {
			if (result)
				accumulatedText += result;
			if (checkForBlockLevelElement && accumulatedText !== "" && andiUtility.isBlockElement(node))
				accumulatedText += " "; //add extra space after block elements
			return !!result;
		}

		function pushSubtreeData(data, subtreeData, node) {
			if (!$.isEmptyObject(subtreeData)) {
				AndiData.grab_semantics(node, subtreeData);
				if (!data.subtree)//create subtree
					data.subtree = [];
				data.subtree.push(subtreeData);
			}
		}

		//This function checks for pseudo element content and accumulates text and adds a component to the data object
		function lookForPseudoContent(pseudo, element, data) {
			var pseudoObject = andiUtility.getPseudoContent(pseudo, element);
			if (pseudoObject) {
				accumulatedText += pseudoObject[0];
				AndiData.addComp(data, "::" + pseudo, pseudoObject[1]);
			}
		}
	}

	//stepG: text node
	function stepG(textNode, data) {
		var accumulatedText = "";
		var text = textNode.nodeValue;
		if ($.trim(text) !== "") {
			if (!data.ariaLabelledby && !data.ariaLabel && !data.title) {
				accumulatedText += andiUtility.condenseWhitespace(text);
			}
		}
		return accumulatedText;
	}

	//stepI: title attribute
	function stepI(element, data, isCheckRolePresentation) {
		var accumulatedText = "";

		if (!data.title) {
			component = $(element).attr("title");
			if (component !== undefined) {
				if (!isEmptyComponent(component, "title", element)) {
					accumulateText(AndiData.addComp(data, "title", component));
				}
			}
		}
		else if (isCalcAccDesc && !usedInName.title) {
			accumulateText(data.title);
		}
		return accumulatedText;

		//This function will check for role=presentation|none which should only occur on stepD
		function accumulateText(text) {
			if (isCheckRolePresentation) {
				var role = $(element).attr("role");
				if (role === "presentation" || role === "none")
					return "";
			}
			accumulatedText += text;
		}
	}

	//stepJ - placeholder
	function stepJ(element, data) {
		var accumulatedText = "";

		if (!isCalcAccDesc) {
			if ($(element).is("textarea") || ($(element).is("input") && $(element).is(":not([type]),[type=text],[type=password],[type=search],[type=tel],[type=email],[type=url],[type=number]"))) {
				component = $(element).attr("placeholder");
				if ($.trim(component) != "") {
					accumulatedText += AndiData.addComp(data, "placeholder", component);
				}
			}
		}

		return accumulatedText;
	}

	//stepZ: //grouping
	function stepZ(element, data) {
		var groupingText = "";

		//role=radiogroup
		if ($(element).isSemantically("[role=radio]", "input[type=radio]")) {
			getGroupingText($(element).closest("[role=radiogroup],[role=group]"));
		}
		//role=group
		if (!groupingText) {
			if ($(element).isSemantically("[role=button],[role=checkbox],[role=link],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=radio],[role=slider],[role=textbox],[role=treeitem]", "input,select,textarea,button")) { //is an interactive element
				getGroupingText($(element).closest("[role=group]"));
			}
		}
		//role=combobox
		if (!groupingText && (data.role === "textbox" || data.role === "listbox" || data.role === "tree" || data.role === "grid" || data.role === "dialog")) {
			getGroupingText($(element).closest("[role=combobox]"));
		}
		//role=listbox
		if (!groupingText && data.role === "option") {
			getGroupingText($(element).closest("[role=listbox]"));
		}
		//role=menu || role=menubar
		if (!groupingText && (data.role === "menuitem" || data.role === "menuitemcheckbox")) {
			getGroupingText($(element).closest("[role=menu],[role=menubar]"));
		}
		//legend
		if (!groupingText && $(element).isSemantically("[role=checkbox],[role=radio],[role=textbox],[role=option]", "input,select,textarea")) {
			component = grab_legend(element);
			if (component !== undefined) {
				groupingText += AndiData.addComp(data.components, "legend", component);
			}
		}

		return groupingText;

		function getGroupingText(groupingElement) {
			if (groupingElement) {
				component = getNameforGroupingElement(groupingElement);
				groupingText += addComp_grouping(data, component, groupingElement);
			}

			function getNameforGroupingElement(groupingElement) {
				var accumulatedText = "";
				var discard = {};

				isCalcAccDesc = false;
				if (calcGroupingName(stepB(groupingElement, discard)));
				else if (calcGroupingName(stepC(groupingElement, discard)));

				return accumulatedText;

				function calcGroupingName(result) {
					if (result)
						accumulatedText += result;
					return !!result;
				}
			}

			function addComp_grouping(data, component, groupingElement) {
				var displayText = "";

				if ($.trim(component) !== "")
					displayText = "<span class='ANDI508-display-grouping'>" + component + "</span>";

				if (displayText) {
					if (!data.grouping) //create grouping object
						data.grouping = {};

					if (!data.grouping.role) //store grouping role
						data.grouping.role = $(groupingElement).attr("role");

					data.grouping.text = displayText;
				}
				return displayText;
			}
		}
	}

	//Support Functions
	function isEmptyComponent(component, componentType, element) {
		if ($.trim(component) == "") {
			if (element == root)//only record empty components for the root
				addEmptyComponent(componentType, "\"\"");
			return true;
		}
		return false;
	}

	function addEmptyComponent(componentType, component) {
		if (!AndiData.data.empty)
			AndiData.data.empty = {};
		AndiData.data.empty[componentType] = component;
	}

	function hasNodeBeenTraversed(node) {
		if (nodesTraversed.indexOf(node) === -1) {
			nodesTraversed.push(node);
			return false; //not traversed
		}
		return true; //has been traversed
	}

	function grab_label(element) {
		var labelElement;

		//check if label is being used on page
		var accumulatedText = grab_labelNested(element);
		if (accumulatedText === undefined)
			accumulatedText = grab_labelFor(element);

		return (accumulatedText !== undefined) ? [accumulatedText, labelElement] : undefined;

		//This function attempts to grab the nested label if it exists
		function grab_labelNested(element) {
			var labelText;
			//Is the element nested inside a label?
			var closestLabel = $(element).closest("label", "body");
			if (closestLabel.length) {//element is nested inside a label
				//Is this label explictly associated with something else?
				var forAttr = $(closestLabel).attr("for");
				if (forAttr && forAttr != element.id) {
					alert = [alert_006F, [forAttr, element.id]];
				}
				else {
					labelElement = closestLabel;
					labelText = andiUtility.getVisibleInnerText(closestLabel[0], element);
				}
			}
			return labelText;
		}

		//This function attempts to grab the label with a [for] value that matches the element's id
		function grab_labelFor(element) {
			var labelText;
			//Does it contain an id, and therefore, possibly an associated label with 'for' attribute value that matches value of this elemtent's id?
			if (element.id !== "") {
				//Loop through the labels that have [for] attributes and search for a match with this id
				var labelFor;
				for (var x = 0; x < testPageData.allFors.length; x++) {
					if ($(testPageData.allFors[x]).attr("for") == element.id) {
						labelFor = $(testPageData.allFors[x]);
						break;
					}
				}

				if (labelFor) {//label with matching [for] was found
					labelElement = labelFor;
					labelText = andiUtility.getVisibleInnerText(labelFor[0], element);

					//Check if this is referencing an element with a duplicate id
					andiCheck.areThereAnyDuplicateIds("label[for]", element.id);
				}
			}
			return labelText;
		}
	}

	function grab_legend(element) {
		var legendText;
		var fieldset = ($(element).is("fieldset")) ? $(element) : $(element).closest("fieldset");
		var legend;
		if (fieldset.length) {
			legend = $(fieldset).find("legend").first();
			if ($(legend).length) {
				legendText = $(legend).text();
			}
		}
		return (legendText !== undefined) ? [legendText, legend] : undefined;
	}

	function grab_figcaption(element) {
		var figcaptionText;
		var figcaption = $(element).children("figcaption").first();
		if ($(figcaption).length) {
			figcaptionText = $(figcaption).text();
		}
		return (figcaptionText !== undefined) ? [figcaptionText, figcaption] : undefined;
	}

	function grab_caption(element) {
		var captionText;
		var caption = $(element).children("caption").first();
		if ($(caption).length) {
			captionText = $(caption).text();
		}
		return (captionText !== undefined) ? [captionText, caption] : undefined;
	}
};//end textAlternativeComputation

AndiData.addComp = function (data, componentType, component, hasNodebeenTraversed) {
	var displayText = "";

	if (typeof component === "string") {
		if ($.trim(component) !== "") {
			displayText = "<span class='ANDI508-display-" + componentType + "'>" +
				component + "</span>";
		}
	}
	else {//component is an array [text, refElement, id]
		if ($.trim(component[0]) !== "" || component[2]) { //add the text
			displayText = "<span class='ANDI508-display-" + componentType + "'>";

			if (component[2]) //add the referenced id
				displayText += "<span class='ANDI508-display-id'>#" + component[2] + "</span>";

			displayText += "</span>";
		}
	}

	if (displayText) {
		if (componentType === "ariaLabelledby" || componentType === "ariaDescribedby") {
			if (data[componentType])
				data[componentType].push(displayText);//push to array
			else
				data[componentType] = [displayText];//create array
		}
		else {//do not create an array
			if (data[componentType])
				data[componentType] += displayText;//append
			else
				data[componentType] = displayText;//create
		}
	}

	//if node is traversed return empty string, otherwise return displayText
	return (!hasNodebeenTraversed) ? displayText : "";
};

//This object sets up the check logic to determine if an alert should be thrown.
function AndiCheck() {
	//==Element Checks==//
	//This function will search the test page for elements with duplicate ids.
	//If found, it will generate an alert
	//TODO: add this check when these components are detected: aria-activedescendant,aria-colcount,aria-colindex,aria-colspan,aria-controls,aria-details,aria-errormessage,aria-flowto,aria-owns,aria-posinset,aria-rowcount,aria-rowindex,aria-rowspan,aria-setsize
	this.areThereAnyDuplicateIds = function (component, id) {
		if (id && testPageData.allIds.length > 1) {
			var idMatchesFound = 0;
			//loop through allIds and compare
			for (var x = 0; x < testPageData.allIds.length; x++) {
				if (id === testPageData.allIds[x].id) {
					idMatchesFound++;
					if (idMatchesFound === 2) break; //duplicate found so stop searching, for performance
				}
			}
			if (idMatchesFound > 1) {//Duplicate Found
				var message = "";
				if (component === "label[for]") //label[for]
					message = "Element has duplicate id [id=" + id + "] and is referenced by a &lt;label[for]&gt;";
				else //anything else
					message = "[" + component + "] is referencing a duplicate id [id=" + id + "]";
				alert = [alert_0011, [message]];
			}
		}
	};
	//==Component Quality Checks==//
	//this function will throw an alert if there are missingReferences
	this.areThereMissingReferences = function (attribute, missingReferences) {
		//Check if any ids were not found
		if (missingReferences.length === 1) {//one reference is missing
			alert = [alert_0063, [attribute, missingReferences]];
		}
		else if (missingReferences.length > 1) {//more than one reference missing
			alert = [alert_0065, [attribute, missingReferences]];
		}
	};
}

TestPageData.allElements = undefined;
//This class is used to store temporary variables for the test page
function TestPageData() {
	TestPageData.allElements = $("#ANDI508-testPage *");

	//all the ids of elements on the page for duplicate comparisons
	this.allIds = $(TestPageData.allElements).filter("[id]");

	//all the fors of visible elements on the page for duplicate comparisons
	this.allFors = "";

	//Get all fors on the page and store for later comparison
	if ($(TestPageData.allElements).filter("label").length * 1 > 0) {
		//get all 'for's on the page and store for later comparison
		this.allFors = $(TestPageData.allElements).filter("label[for]");
	}
}
