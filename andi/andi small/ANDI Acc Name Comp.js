//=============================================//
//ANDI: Accessible Name & Description Inspector//
//Created By Social Security Administration    //
//=============================================//
// NOTE: This is used to see which parts of the code were kept when the Accessible Name code was removed
var andiVersionNumber = "27.4.0";

//==============//
// ANDI CONFIG: //
//==============//
//URLs
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
	if (prevCss)//remove already inserted CSS to improve performance on consequtive favelet launches
		head.removeChild(prevCss);
	head.appendChild(andiCss);
})();

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

//==================//
// ANDI INITIALIZE: //
//==================//
//This main function is called when jQuery is ready.
function launchAndi() {
	(window.andi508 = function () {
		//Ensure that $ is mapped to jQuery
		window.jQuery = window.$ = jQuery;

		//Check <html> and <body> elements for aria-hidden=true
		if ($("html").first().attr("aria-hidden") === "true" || $("body").first().attr("aria-hidden") === "true") {
			if (confirm("ANDI has detected aria-hidden=true on the <html> or <body> elements which would render this page invisible to a screen reader.\n\nPress OK to remove the aria-hidden=true from the <html> and <body> elements to continue.")) {
				$("html").removeAttr("aria-hidden");
				$("body").removeAttr("aria-hidden");
			}
			else {
				alert("ANDI will not continue while aria-hidden=true is on <html> or <body> elements.");
				return; //Stops ANDI
			}
		}

		//Frames handling
		if (document.getElementsByTagName("frameset")[0]) {
			if (confirm("ANDI has detected frames:\nPress OK to stay on the page.\nPress Cancel to test an individual frame.") !== true) {
				var oldLocation = document.location;
				var framesSelectionHead = "<head><title>ANDI Frame Selection</title><style>body{margin-left:1em;}*{font-family:Verdana,Sans-Serif;font-size:12pt}h1{font-weight:bold;font-size:20pt}h2{font-weight:bold;font-size:13pt}li{margin:7px}a{font-family:monospace;margin-right:8px}</style></head>";
				var framesSelectionBody = "<h1 id='ANDI508-frameSelectionUI'>ANDI</h1><p>This page uses frames. The page title is: '" + document.title + "'.<br /><br />Each frame must be tested individually. Select a frame from the list below, then launch ANDI.</p><h2>Frames:</h2><ol>";
				var title, titleDisplay, framesrc;
				$("frame").each(function () {
					//Build Title Display
					title = $(this).attr("title");
					framesrc = $(this).attr("src");
					titleDisplay = (!title) ? " <span style='color:#c4532c'><img style='width:18px' src='https://ollie-iterators.github.io/ANDI/andi/icons/danger.png' alt='danger: ' /> No title attribute on this &lt;frame&gt;.</span>" : " <span style='color:#058488'>title=\"" + title + "\"</span>";
					framesSelectionBody += "<li><a href='" + framesrc + "'>" + framesrc + "</a>" + titleDisplay + "</li>";
				});
				framesSelectionBody += "</ol><button id='ANDI508-frameSelectionUI-goBack'>Go Back</button>";
				$("frameset").remove();
				$("html head").html(framesSelectionHead);
				$("html").append(document.createElement("body"));
				$("html body").append(framesSelectionBody);
				$("#ANDI508-frameSelectionUI-goBack").click(function () { document.location = oldLocation; });
			}
			else {//Reload the test page so that the ANDI files that were added are removed.
				location.reload();
			}
			return; //Stops ANDI
		}
		//Prevent running ANDI on the frame selection UI
		if (document.getElementById("ANDI508-frameSelectionUI")) {
			//ANDI was launched while the frame selection UI was open.
			alert("Select a frame, then launch ANDI.");
			return;
		}

		//Get ANDI ready to launch the first module
		andiReady();

		andiCheck.isThereExactlyOnePageTitle();
		andiCheck.areThereMoreExclusiveChildrenThanParents();
	})();
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
	insertAndiBarHtml();

	//This function creates main html structure of the ANDI Bar.
	function insertAndiBarHtml() {
		var moduleButtons = "<div id='ANDI508-moduleMenu' role='menu' aria-label='Select a Module'><div id='ANDI508-moduleMenu-prompt'>Select Module:</div>" +
			//Default (fANDI)
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-f'>focusable elements</button>" +
			//gANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-g' aria-label='graphics slash images'>graphics/images</button>" +
			//lANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-l' aria-label='links slash buttons'>links/buttons</button>" +
			//tANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-t'>tables</button>" +
			//sANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-s'>structures</button>" +
			//cANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-c'>color contrast</button>" +
			//hANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-h'>hidden content</button>" +
			//iANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-i'>iframes</button>" +
			"</div>";

		var andiBar = "<section id='ANDI508' tabindex='-1' aria-label='ANDI' style='display:none'>" +
			"<div id='ANDI508-header'>" +
			"<h1 id='ANDI508-toolName-heading'><a id='ANDI508-toolName-link' class='ANDI508-sectionJump' href='#' aria-haspopup='dialog' aria-label='ANDI " + andiVersionNumber + "'><span id='ANDI508-module-name' data-andi508-moduleversion=''>&nbsp;</span>ANDI</a></h1>" +
			"<div id='ANDI508-moduleMenu-container'>" +
			moduleButtons +
			"</div>" +
			"<div id='ANDI508-module-actions'></div>" +
			"<div id='ANDI508-loading'>Loading <div id='ANDI508-loading-animation'></div></div>" +
			"</div>" +
			"<div id='ANDI508-body' style='display:none'>" +
			"<div id='ANDI508-activeElementInspection' aria-label='Active Element Inspection' class='ANDI508-sectionJump' tabindex='-1'>" +
			"<div id='ANDI508-activeElementResults'>" +
			"<div id='ANDI508-elementControls'>" +
			"<button title='Previous Element' accesskey='" + andiHotkeyList.key_prev.key + "' id='ANDI508-button-prevElement'><img src='" + icons_url + "prev.png' alt='' /></button>" +
			"<button title='Next Element' accesskey='" + andiHotkeyList.key_next.key + "' id='ANDI508-button-nextElement'><img src='" + icons_url + "next.png' alt='' /></button>" +
			"<br />" +
			"</div>" +
			"<div id='ANDI508-startUpSummary' tabindex='0'></div>" +
			"<div id='ANDI508-elementDetails'>" +
			"<div id='ANDI508-elementNameContainer'><h3 class='ANDI508-heading'>Element:</h3> " +
			"<a href='#' id='ANDI508-elementNameLink' aria-labelledby='ANDI508-elementNameContainer ANDI508-elementNameDisplay'>&lt;<span id='ANDI508-elementNameDisplay'></span>&gt;</a>" +
			"</div>" +
			"<div id='ANDI508-additionalElementDetails'></div>" +
			"<div id='ANDI508-accessibleComponentsTableContainer' class='ANDI508-scrollable' tabindex='0' aria-labelledby='ANDI508-accessibleComponentsTable-heading'>" +
			"<h3 id='ANDI508-accessibleComponentsTable-heading' class='ANDI508-heading'>Accessibility Components: <span id='ANDI508-accessibleComponentsTotal'></span></h3>" +
			"<table id='ANDI508-accessibleComponentsTable' aria-labelledby='ANDI508-accessibleComponentsTable-heading'><tbody></tbody></table>" +
			"</div>" +
			"<div id='ANDI508-outputContainer'>" +
			"<h3 class='ANDI508-heading' id='ANDI508-output-heading'>ANDI Output:</h3>" +
			"<div id='ANDI508-outputText' class='ANDI508-scrollable' tabindex='0' accesskey='" + andiHotkeyList.key_output.key + "' aria-labelledby='ANDI508-output-heading ANDI508-outputText'></div>" +
			"</div>" +
			"</div>" +
			"</div>" +
			"</div>" +
			"<div id='ANDI508-pageAnalysis' aria-label='Page Analysis' class='ANDI508-sectionJump' tabindex='-1'>" +
			"<div id='ANDI508-resultsSummary'>" +
			"<h3 class='ANDI508-heading' tabindex='0' id='ANDI508-resultsSummary-heading'></h3>" +
			"</div>" +
			"<div id='ANDI508-additionalPageResults'></div>" +
			"<div id='ANDI508-alerts-list'></div>" +
			"</div>" +
			"</div>" +
			"</section>";

		var body = $("body").first();

		//Preserve original body padding and margin
		var body_padding = "padding:" + $(body).css("padding-top") + " " + $(body).css("padding-right") + " " + $(body).css("padding-bottom") + " " + $(body).css("padding-left") + "; ";
		var body_margin = "margin:" + $(body).css("margin-top") + " 0px " + $(body).css("margin-bottom") + " 0px; ";

		$("html").addClass("ANDI508-testPage");
		$(body)
			.addClass("ANDI508-testPage")
			.wrapInner("<div id='ANDI508-testPage' style='" + body_padding + body_margin + "' ></div>") //Add an outer container to the test page
			.prepend(andiBar); //insert ANDI display into body

	}

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

		//Define Object.keys for old IE
		if (!Object.keys) { Object.keys = (function () { 'use strict'; var hasOwnProperty = Object.prototype.hasOwnProperty, hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'), dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'], dontEnumsLength = dontEnums.length; return function (obj) { if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) { throw new TypeError('Object.keys called on non-object'); } var result = [], prop, i; for (prop in obj) { if (hasOwnProperty.call(obj, prop)) { result.push(prop); } } if (hasDontEnumBug) { for (i = 0; i < dontEnumsLength; i++) { if (hasOwnProperty.call(obj, dontEnums[i])) { result.push(dontEnums[i]); } } } return result; }; }()); }

		//Define Array.indexOf for old IE
		if (!Array.prototype.indexOf) { Array.prototype.indexOf = function (obj, start) { for (var i = (start || 0), j = this.length; i < j; i++) { if (this[i] === obj) { return i; } } return -1; }; }
	}
}

//This class is used to perform common utilities such as regular expressions and string alertations.
function AndiUtility() {
	//cache the regex for performance gains
	this.greaterthan_regex = />/g;
	this.lessthanthan_regex = /</g;
	this.ampersand_regex = /&/g;
	this.whitespace_regex = /\s+/g;

	//This ultility function takes a string and converts &, < and > into &amp;, &lt; and &gt; so that when the
	//string is displayed on screen, the browser doesn't try to parse the string into html tags.
	this.formatForHtml = function (string) {
		if (string !== undefined)
			return string.replace(this.ampersand_regex, "&amp;").replace(this.greaterthan_regex, "&gt;").replace(this.lessthanthan_regex, "&lt;");
	};

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

//==================//
// ELEMENT ANALYSIS //
//==================//
//This object grabs the accessible components and attaches the components and alerts to the element
//Should be re-instantiated for each element to be inspected
//If a child is passed in, it will grab the accessibility components from the child instead.
function AndiData(element, skipTAC) {
	andiAlerter.reset();

	testPageData.andiElementIndex++;

	AndiData.data = {
		andiElementIndex: testPageData.andiElementIndex,
		components: {} //will store the accessible components as they are gathered
	};

	AndiData.grab_semantics(element, AndiData.data);

	if (!skipTAC) {
		//do the text alternative computation
		AndiData.textAlternativeComputation(element);
		AndiData.grab_coreProperties(element);
	}

	$(element)
		.addClass("ANDI508-element")
		.attr("data-andi508-index", AndiData.data.andiElementIndex);

	return AndiData.data;
}

AndiData.grab_coreProperties = function (element) {
	grab_tabindex();
	grab_accesskey();
	grab_imageSrc();

	function grab_tabindex() {
		AndiData.data.isTabbable = true; //assume true (prove to be false)
		var tabindex = $.trim($(element).attr("tabindex"));
		var nativelyTabbableElements = "a[href],button,input,select,textarea,iframe,area,[contenteditable=true],[contenteditable='']";
		if (tabindex) {
			if (tabindex < 0) {
				AndiData.data.isTabbable = false;
				if ($(element).is("iframe")) {
					if ($(element).contents().find(":focusable").length) { //check if iframe has focusable contents
						andiAlerter.throwAlert(alert_0123);
					}
				}
				else if (!$(element).parent().is(":tabbable")) { //element and parent are not tabbable
					if (AndiData.data.accName)
						andiAlerter.throwAlert(alert_0121);
					else
						andiAlerter.throwAlert(alert_0122);
				}
			}
			else if (isNaN(tabindex)) {//tabindex is not a number
				andiAlerter.throwAlert(alert_0077, [tabindex]);
				if (!$(element).is(nativelyTabbableElements))
					AndiData.data.isTabbable = false;
			}
			//else element is tabbable
			AndiData.data.tabindex = tabindex;
		}
		else if (!$(element).is(nativelyTabbableElements)) {
			AndiData.data.isTabbable = false;
		}
	}

	function grab_accesskey() {
		var accesskey = $(element).attr("accesskey");
		if (accesskey && accesskey !== " ") { //accesskey is not the space character
			accesskey = $.trim(accesskey.toUpperCase());
			AndiData.data.accesskey = accesskey;
		}
	}

	function grab_imageSrc() {
		var imageSrc;
		if ($(element).is("area")) {
			var map = $(element).closest("map");
			if (map)
				imageSrc = $("#ANDI508-testPage img[usemap=\\#" + $(map).attr("name") + "]").first().attr("src");
		}
		else if ($(element).is("img,input[type=image]"))
			imageSrc = $(element).attr("src");
		else if ($(element).is("svg"))
			imageSrc = ($(element).find("image").first().attr("src"));

		if (imageSrc) {
			imageSrc = imageSrc.split("/").pop(); //get the filename and extension only
			AndiData.data.src = imageSrc;
		}
	}
};

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

	if (!isAriaHidden) {
	} else {
		AndiData.data.isAriaHidden = true;
	}

	//Support Functions

};//end textAlternativeComputation

AndiData.attachDataToElement = function (element) {
	//Store elementData onto the html element's data-andi508 attribute

	//TODO: add alerts directly to data object instead of copying here.
	AndiData.data.dangers = andiAlerter.dangers;
	AndiData.data.warnings = andiAlerter.warnings;
	AndiData.data.cautions = andiAlerter.cautions;

	$(element).data("andi508", AndiData.data);

	//Attach danger class
	if (AndiData.data.dangers.length > 0)
		$(element).addClass("ANDI508-element-danger");
};

AndiData.addComp = function (data, componentType, component, hasNodebeenTraversed) {
	var displayText = "";

	if (typeof component === "string") {
		if ($.trim(component) !== "") {
			displayText = "<span class='ANDI508-display-" + componentType + "'>" +
				andiCheck.checkCharacterLimit(component, componentType) + "</span>";
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
	//==Mult-Point Checks==//
	//This function is used to check for alerts related to focusable elements
	this.commonFocusableElementChecks = function (andiData, element) {
		this.hasThisElementBeenHiddenFromScreenReader(element, andiData, true);
		this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined(andiData);
		this.areThereAnyMisspelledAria(element);
		this.areThereAnyDuplicateFors(element, andiData);
		this.areThereAnyTroublesomeJavascriptEvents(element);
		this.clickableAreaCheck(element, andiData);
	};

	//This function is used to check for alerts related to non-focusable elements
	this.commonNonFocusableElementChecks = function (andiData, element, isElementMustHaveName) {
		this.hasThisElementBeenHiddenFromScreenReader(element, andiData);
		if (isElementMustHaveName)
			this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined(andiData);
		this.areThereAnyMisspelledAria(element);
	};

	//==Test Page Checks==//

	//This function will count the number of visible fieldset/figure/table tags and compare to the number of legend/figcaption/caption tags
	//If there are more parents than children, it will generate an alert with the message and the counts.
	//Note: The function does not test whether the children are actually contained within the parents, it's strictly concerned with the counts.
	//More children than parents might mean a parent is missing or the child tag isn't being used properly.
	this.areThereMoreExclusiveChildrenThanParents = function () {
		var children, parents;

		//legend/fieldset
		parents = $(TestPageData.allVisibleElements).filter("fieldset").length * 1; //*1 ensures that the var will be a number
		children = $(TestPageData.allVisibleElements).filter("legend").length * 1; //*1 ensures that the var will be a number
		if (children > parents) andiAlerter.throwAlert(alert_0074, [children, parents], 0);

		//figcaption/figure
		parents = $(TestPageData.allVisibleElements).filter("figure").length * 1; //*1 ensures that the var will be a number
		children = $(TestPageData.allVisibleElements).filter("figcaption").length * 1; //*1 ensures that the var will be a number
		if (children > parents) andiAlerter.throwAlert(alert_0075, [children, parents], 0);

		//caption/table
		parents = $(TestPageData.allVisibleElements).filter("table").length * 1; //*1 ensures that the var will be a number
		children = $(TestPageData.allVisibleElements).filter("caption").length * 1; //*1 ensures that the var will be a number
		if (children > parents) andiAlerter.throwAlert(alert_0076, [children, parents], 0);
	};

	//This function checks to see if there is only one page <title> tag within the head
	//If none, empty, or more than one, it will generate an alert.
	//It also looks at document.title
	this.isThereExactlyOnePageTitle = function () {
		var pageTitleCount = $("head title").length;
		if (document.title === "") { //check document.title because could have been set by javascript
			if (pageTitleCount === 0)
				andiAlerter.throwAlert(alert_0072, alert_0072.message, 0);
			else if (pageTitleCount === 1 && $.trim($("head title").text()) === "")
				andiAlerter.throwAlert(alert_0071, alert_0071.message, 0);
		}
		else if (pageTitleCount > 1)
			andiAlerter.throwAlert(alert_0073, alert_0073.message, 0);
	};

	//==Element Checks==//
	//This function resets the accessibleComponentsTable
	//returns true if components were found that should appear in the accessibleComponentsTable
	this.wereComponentsFound = function (isTabbable, accessibleComponentsTableBody) {
		//calculate total
		var total = $(accessibleComponentsTableBody).find("tr").length;
		//Display total
		$("#ANDI508-accessibleComponentsTotal").html(total);

		if (total === 0) {//No components. Display message in table
			var alertLevel = "danger"; //tabbable elements with no components, default to red
			if (!isTabbable)
				alertLevel = "caution"; //non-tabbable elements with no components, default to yellow
			$(accessibleComponentsTableBody).html(
				"<tr><th id='ANDI508-accessibleComponentsTable-noData' class='ANDI508-display-" +
				alertLevel + "'>No accessibility markup found for this Element.</th></tr>");
		}
	};

	//This function will throw No Accessible Name alert depending on the tagName passed
	this.wasAccessibleNameFound = function (elementData) {
		if (!elementData.isAriaHidden) { //element is not aria-hidden=true and not contained by aria-hidden=true
			var tagNameText = elementData.tagNameText;
			if (!elementData.accName) {
				if (elementData.components.ariaDescribedby)
					//element has no name but has ariaDescribedby
					andiAlerter.throwAlert(alert_0021);
				else { //throw No Accessible Name Alert
					if (tagNameText === "iframe") {
						if (elementData.tabindex)
							andiAlerter.throwAlert(alert_0007);
						else//no tabindex
							andiAlerter.throwAlert(alert_0009);
					}
					else if (elementData.isTabbable) {
						//Does this element have a role?
						if (elementData.role) {
							var roleCapitalized = elementData.role.charAt(0).toUpperCase() + elementData.role.slice(1);
							andiAlerter.throwAlert(alert_0008, roleCapitalized + " Element" + alert_0008.message);
						}
						//Is this an input element, excluding input[image]?
						else if (tagNameText.includes("input") && tagNameText != "input[type=image]") {
							switch (tagNameText) {
								case "input[type=text]":
									andiAlerter.throwAlert(alert_0001, "Textbox" + alert_0001.message); break;
								case "input[type=radio]":
									andiAlerter.throwAlert(alert_0001, "Radio Button" + alert_0001.message); break;
								case "input[type=checkbox]":
									andiAlerter.throwAlert(alert_0001, "Checkbox" + alert_0001.message); break;
								default:
									andiAlerter.throwAlert(alert_0001, "Input Element" + alert_0001.message);
							}
						}
						//All other elements:
						else switch (tagNameText) {
							case "a":
								andiAlerter.throwAlert(alert_0002, "Link" + alert_0002.message); break;
							case "img":
							case "input[type=image]":
								andiAlerter.throwAlert(alert_0003, "Image" + alert_0003.message); break;
							case "button":
								andiAlerter.throwAlert(alert_0002, "Button" + alert_0002.message); break;
							case "select":
								andiAlerter.throwAlert(alert_0001, "Select" + alert_0001.message); break;
							case "textarea":
								andiAlerter.throwAlert(alert_0001, "Textarea" + alert_0001.message); break;
							case "table":
								andiAlerter.throwAlert(alert_0004, alert_0004.message); break;
							case "figure":
								andiAlerter.throwAlert(alert_0005, alert_0005.message); break;
							case "th":
							case "td":
								andiAlerter.throwAlert(alert_0002, "Table Cell" + alert_0002.message); break;
							case "canvas":
								andiAlerter.throwAlert(alert_0008, "Canvas" + alert_0008.message); break;
							default:
								andiAlerter.throwAlert(alert_0002, "Element" + alert_0002.message);
						}
					}
					else {//not tabbable
						//Does this element have a role?
						if (elementData.role === "img") {
							andiAlerter.throwAlert(alert_0008, "[role=img] Element" + alert_0008.message);
						}
						else {
							switch (tagNameText) {
								case "img":
								case "input[type=image]":
									if (!elementData.role) andiAlerter.throwAlert(alert_0003, "Image" + alert_0003.message); break;
								case "canvas":
									andiAlerter.throwAlert(alert_0008, "Canvas" + alert_0008.message); break;
							}
						}
					}
				}
				if (elementData.components.legend) { //element has no name but has legend
					andiAlerter.throwAlert(alert_0022);
				}
			}
		}
	};

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
				andiAlerter.throwAlert(alert_0011, [message]);
			}
		}
	};

	//This function will search the html body for labels with duplicate 'for' attributes
	this.areThereAnyDuplicateFors = function (element, data) {
		if (data.components.label) {
			var id = $.trim($(element).prop("id"));
			if (id && testPageData.allFors.length > 1) {
				var forMatchesFound = 0;
				for (var x = 0; x < testPageData.allFors.length; x++) {
					if (id === $.trim($(testPageData.allFors[x]).attr("for"))) {
						forMatchesFound++;
						if (forMatchesFound == 2) break; //duplicate found so stop searching, for performance
					}
				}
				if (forMatchesFound > 1) //Duplicate Found
					andiAlerter.throwAlert(alert_0012, [id, id]);
			}
		}
	};

	//This function goes through the LabelFor array and checks if is pointing to valid form element
	this.areLabelForValid = function () {
		var referencedElement;
		for (var f = 0; f < testPageData.allFors.length; f++) {
			referencedElement = document.getElementById(testPageData.allFors[f].htmlFor);
			if (referencedElement && $(referencedElement).hasClass("ANDI508-element")) {
				if (!$(referencedElement).isSemantically("[role=textbox],[role=combobox],[role=listbox],[role=checkbox],[role=radio]", "input,select,textarea,button,[contenteditable=true],[contenteditable='']"))
					//is not a form element
					andiAlerter.throwAlertOnOtherElement($(referencedElement).attr("data-andi508-index"), alert_0091);
			}
		}
	};

	this.areThereAnyTroublesomeJavascriptEvents = function (element) {
		var events = "";
		if ($(element).is("[onblur]"))
			events += "[onBlur] ";
		if ($(element).is("input,select,textarea") && $(element).is("[onchange]"))
			events += "[onChange] ";
		if ($(element).is("[ondblclick]"))
			events += "[ondblclick] ";
		if (events !== "")
			andiAlerter.throwAlert(alert_0112, [$.trim(events)]);
	};

	//This function will check the clickable area of the element.
	this.clickableAreaCheck = function (element, andiData) {
		if (!andiData.components.label && $(element).is("input[type=checkbox],input[type=radio]")) {
			//the element is a radio button or checkbox and does not have an associated label
			var height = $(element).height();
			var width = $(element).width();
			var clickableAreaLimit = 21; //px
			if (height < clickableAreaLimit && width < clickableAreaLimit) {
				//The height and with of the element is smaller than the clickableAreaLimit
				if (andiData.tagNameText == "input[type=radio]")
					andiAlerter.throwAlert(alert_0210, ["radio button"]);
				else if (andiData.tagNameText == "input[type=checkbox]")
					andiAlerter.throwAlert(alert_0210, ["checkbox"]);
			}
		}
	};

	//This function will search for misspelled aria attributes and throw an alert if found.
	this.areThereAnyMisspelledAria = function (element) {
		if ($(element).is("[aria-role]"))
			andiAlerter.throwAlert(alert_0032);

		if ($(element).is("[aria-labeledby]"))
			andiAlerter.throwAlert(alert_0031);
	};

	//if the element has aria-hidden=true or is a child of an element with aria-hidden=true
	//NOTE: role=presentation/none are not factored in here
	//      because browsers automatically ignore them if the element is focusable
	this.hasThisElementBeenHiddenFromScreenReader = function (element, elementData, isDangerous) {
		if (elementData.isAriaHidden) {
			if (isDangerous) //this type of element should not be hidden from screen reader
				andiAlerter.throwAlert(alert_0260); //danger level alert
			else //this type of element could be hidden by a screen reader, but tester should investigate
				andiAlerter.throwAlert(alert_0261); //warning level alert
		}
	};

	//This function will increment the testPageData.disabledElementsCount
	//Returns true if the element is disabled
	this.isThisElementDisabled = function (element) {
		if (element.disabled) {
			//if the element has aria-hidden=true, assume intentiality behind making this element disabled. Therefore don't complain about this element's disabled state.
			if ($(element).attr("aria-hidden") !== "true") {
				testPageData.disabledElementsCount++;
				return true;
			}
		}
		return false;
	};

	//This function will scan for deprecated HTML relating to accessibility associated with the element
	this.detectDeprecatedHTML = function (element) {
		if (document.doctype !== null && document.doctype.name == "html" && !document.doctype.publicId && !document.doctype.systemId) {
			var message;
			if ($(element).is("table") && $(element).attr("summary")) {
				var role = $(element).attr("role");
				if (role !== "presentation" && role !== "none")
					message = ["attribute [summary] in &lt;table&gt;, use &lt;caption&gt; or [aria-label] instead"];
			}
			else if ($(element).is("a") && $(element).attr("name"))
				message = ["attribute [name] in &lt;a&gt;, use [id] instead"];
			else if ($(element).is("td") && $(element).attr("scope"))
				message = ["attribute [scope] on &lt;td&gt;, in HTML5 [scope] only valid on &lt;th&gt;"];

			if (message) {
				if ($(element).hasClass("ANDI508-element"))
					andiAlerter.throwAlert(alert_0078, message);
				else
					andiAlerter.throwAlert(alert_0078, message, 0);
			}
		}
	};

	//==Component Quality Checks==//

	this.areThereComponentsThatShouldntBeCombined = function (data) {
		if (data.components.ariaLabel && data.components.ariaLabelledby)
			andiAlerter.throwAlert(alert_0101, ["[aria-label] with [aria-labelledby]"]);
	};

	//This function checks the character length of the componentText.
	//If it exceeds the number defined in the variable characterLimiter, it will throw an alert.
	//If the limit was exceeded, it will insert a scissors unicode
	this.checkCharacterLimit = function (componentText, componentName) {
		if (componentText && (componentName === "ariaLabel" || componentName === "title" || componentName === "alt") && componentText.length > 250) {
			if (componentName === "ariaLabel") {
				componentName = "aria-label";
			}
			andiAlerter.throwAlert(alert_0151, [componentName]);
			return insertCharacterLimitMark(componentText);
		}
		return componentText;

		//This function inserts a pipe character into the componentText at the characterLimiter position
		//The color of the pipe is the color of a warning
		function insertCharacterLimitMark(componentText) {//inject scissors unicode
			return andiUtility.formatForHtml(componentText.substring(0, 250)) +
				"<span class='ANDI508-display-warning'>&hellip;&#9986;&hellip;</span>" +
				andiUtility.formatForHtml(componentText.substring(250, componentText.length));
		}
	};
}

//This function handles the throwing of alerts.
// TODO: AndiAlerter has no alert messages in the function
function AndiAlerter() {
	//These functions will throw Danger/Warning/Caution Alerts
	//They will add the alert to the alert list and attach it to the element
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. If not passed will use default alertObject.message
	//	index: 	(optional) pass in 0 if this cannot be linked to an element.  If not passed will use andiElementIndex
	this.throwAlert = function (alertObject, customMessage, index) {
		if (alertObject) {
			var message = alertMessage(alertObject, customMessage);
			if (index === undefined) {
				index = testPageData.andiElementIndex; //use current andiElementIndex
			}
			this.addToAlertsList(alertObject, message, index);

			//Add the Alert Button to the alertButtons array (to be displayed later)
			if (alertObject.alertButton && alertButtons.indexOf(alertObject) < 0)
				alertButtons.push(alertObject);
		}
	};

	//This function will add an alert another element's alert object.
	//It is used to add an alert to a related (different) element than the element being currently analyzed.
	//For example: non-unique link text: since the second instance triggers the alert, use this method to add the alert to the first instance
	//NOTE: this function will not check if the alert has already been placed on the element, therefore such logic should be added by the caller before this function is called.
	//	index:			andiElementIndex of the element
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. If not passed will use default alertObject.message
	this.throwAlertOnOtherElement = function (index, alertObject, customMessage) {
		var message = alertMessage(alertObject, customMessage);
		this.addToAlertsList(alertObject, message, index);
	};

	//This private function will add an icon to the message
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. if string, use the string. If array, get values from array
	function alertMessage(alertObject, customMessage) {
		//var message = "<img alt='"+alertObject.level+": ' src='"+icons_url+alertObject.level+".png' />";
		var message = "";
		if (typeof customMessage === "string")
			message += customMessage;
		else if (customMessage !== undefined)
			message += getParams(alertObject, customMessage); //use custom message
		else
			message += alertObject.message; //use default alert message
		return message;

		//This function will fill in the parameters of the alert message with the string in the array
		function getParams(alertObject, paramArray) {
			var m = alertObject.message.split("%%%");
			var message = "";
			for (var x = 0; x < paramArray.length; x++)
				message += m[x] + paramArray[x];
			message += m[m.length - 1];
			return message;
		}
	}

	//This function is not meant to be used directly.
	//It will add a list item into the Alerts list.
	//It can place a link which when followed, will move focus to the field relating to the alert.
	//	alertObject:	the alert object
	//  message:		text of the alert message
	//  elementIndex:	element to focus on when link is clicked. expects a number. pass zero 0 if alert is not relating to one particular element
	this.addToAlertsList = function (alertObject, message, elementIndex) {
		//Should this alert be associated with a focusable element?
		var listItemHtml = " tabindex='-1' ";
		if (elementIndex !== 0) {
			//Yes, this alert should point to a focusable element. Insert as link:
			listItemHtml += "href='javascript:void(0)' data-andi508-relatedindex='" + elementIndex + "' aria-label='" + alertObject.level + ": " + message + " Element #" + elementIndex + "'>" +
				"<img alt='" + alertObject.level + "' role='presentation' src='" + icons_url + alertObject.level + ".png' />" +
				message + "</a></li>";
		}

		var alertGroup = AndiAlerter.alertGroups[alertObject.group];

		//Adds the alert into its group
		//Assign the alert level to the group
		if (alertObject.level === "danger") {
			alertGroup.dangers.push(listItemHtml);
			alertGroup.level = "danger";
		}
		else if (alertObject.level === "warning") {
			alertGroup.warnings.push(listItemHtml);
			if (alertGroup.level !== "danger")
				alertGroup.level = "warning";
		}
		else {
			alertGroup.cautions.push(listItemHtml);
			if (alertGroup.level !== "danger" && alertGroup.level !== "warning")
				alertGroup.level = "caution";
		}
		testPageData.numberOfAccessibilityAlertsFound++;
	};

	//This fucntion returns a new instance of an Alert Groups Array.
	//Messages are categorized into these major groups.
	this.createAlertGroups = function () {
		return [
			new AlertGroup("Elements with No Accessible Name"),			//0
			new AlertGroup("Duplicate Attributes Found"),
			new AlertGroup("Components That Should Not Be Used Alone"),
			new AlertGroup("Misspelled ARIA Attributes"),
			new AlertGroup("Table Alerts"),
			new AlertGroup("AccessKey Alerts"),							//5
			new AlertGroup("Reference Alerts"),
			new AlertGroup("Invalid HTML Alerts"),
			new AlertGroup("Misuses of Alt attribute"),
			new AlertGroup("Misuses of Label Tag"),
			new AlertGroup("Unreliable Component Combinations"),		//10
			new AlertGroup("JavaScript Event Cautions"),
			new AlertGroup("Keyboard Access Alerts"),
			new AlertGroup("Empty Components Found"),
			new AlertGroup("Unused Components"),
			new AlertGroup("Excessive Text"),							//15
			new AlertGroup("Link Alerts"),
			new AlertGroup("Graphics Alerts"),
			new AlertGroup("Improper ARIA Usage"),
			new AlertGroup("Structure Alerts"),
			new AlertGroup("Button Alerts"),							//20
			new AlertGroup("Small Clickable Areas"),
			new AlertGroup("CSS Content Alerts"),
			new AlertGroup("Manual Tests Needed"),
			new AlertGroup("Contrast Alerts"),
			new AlertGroup("Disabled Element Alerts"),					//25
			new AlertGroup("Aria-Hidden Alerts")
		];
	};

	//Keeps track of alert buttons that need to be added.
	var alertButtons = [];

	this.dangers = [];
	this.warnings = [];
	this.cautions = [];

	//This function resets the alert data associated with a single element
	this.reset = function () {
		this.dangers = [];
		this.warnings = [];
		this.cautions = [];
	};
}

//This defines the class AlertGroup
function AlertGroup(heading) {
	this.heading = heading;	//heading text for the group
	this.level = undefined;
	this.dangers = [];
	this.warnings = [];
	this.cautions = [];
}

//This defines the class AlertButton
function AlertButton(label, id, clickLogic, overlayIcon) {
	this.label = label; //button's innerText
	this.id = id;		//button's id
	this.clickLogic = clickLogic; //buttons clicklogic
	this.overlayIcon = overlayIcon; //if button should contain overlayIcon, pass in overlayIcon. else pass in empty string ""
}

TestPageData.allVisibleElements = undefined;
TestPageData.allElements = undefined;
//This class is used to store temporary variables for the test page
function TestPageData() {
	//Creates the alert groups
	AndiAlerter.alertGroups = andiAlerter.createAlertGroups();

	TestPageData.allElements = $("#ANDI508-testPage *");

	//all the visible elements or elements within a canvas on the test page
	TestPageData.allVisibleElements = $(TestPageData.allElements).filter(":shown,canvas *");

	//all the ids of elements on the page for duplicate comparisons
	this.allIds = $(TestPageData.allElements).filter("[id]");

	//all the fors of visible elements on the page for duplicate comparisons
	this.allFors = "";

	//Keeps track of the number of focusable elements ANDI has found, used to assign unique indexes.
	//the first element's index will start at 1.
	//When ANDI is done analyzing the page, this number will equal the total number of elements found.
	this.andiElementIndex = 0;

	this.relatedLaserIndex = 0;

	//Keeps track of the number of accessibility alerts found.
	this.numberOfAccessibilityAlertsFound = 0;

	this.pageAlerts = [];

	//Keeps track of the number of disabled elements
	this.disabledElementsCount = 0;

	//Get all fors on the page and store for later comparison
	if ($(TestPageData.allVisibleElements).filter("label").length * 1 > 0) {
		//get all 'for's on the page and store for later comparison
		this.allFors = $(TestPageData.allVisibleElements).filter("label[for]");
	}
}

//==============//
// jQuery Load: //
//==============//
//This function will check to see if the page being tested already has jquery installed.
//If not, it downloads the appropriate version from the jquery download source.
//It will also determine if an old IE version is being used
var jqueryPreferredVersion = "3.6.0"; //The preferred (latest) version of jQuery we want
var jqueryMinimumVersion = "1.9.1"; //The minimum version of jQuery we allow ANDI to use
var jqueryDownloadSource = "https://ajax.googleapis.com/ajax/libs/jquery/"; //where we are downloading jquery from
var oldIE = false; //used to determine if old version of IE is being used.
(function () {
	//Determine if old IE compatability mode
	if (navigator.userAgent.toLowerCase().indexOf("msie") != -1) { if (parseInt(navigator.userAgent.toLowerCase().split("msie")[1]) < 9) { oldIE = true; } }
	//Determine if Jquery exists
	var j = (window.jQuery !== undefined) ? window.jQuery.fn.jquery.split(".") : undefined;
	var m = jqueryMinimumVersion.split(".");
	var needJquery = true;
	if (j !== undefined) {
		for (var i = 0; i < 3; i++) {
			if (parseInt(j[i]) > parseInt(m[i])) {
				needJquery = false;
				break; //existing jquery version is greater than required minimum
			}
			else if (parseInt(j[i]) < parseInt(m[i])) {
				break; //existing jquery version is less than required minimum
			}
		}
	}
	if (needJquery) {
		var script = document.createElement("script"); var done = false;
		//Which version is needed?
		if (!oldIE) { script.src = jqueryDownloadSource + jqueryPreferredVersion + "/jquery.min.js"; }//IE 9 or later is being used, download preferred jquery version.
		else { script.src = jqueryDownloadSource + jqueryMinimumVersion + "/jquery.min.js"; }//Download minimum jquery version.
		//Waits until jQuery is ready before running ANDI
		script.onload = script.onreadystatechange = function () { if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) { done = true; launchAndi(); } };
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	else { //sufficient version of jQuery already exists
		launchAndi(); //initialize ANDI
	}
})();
