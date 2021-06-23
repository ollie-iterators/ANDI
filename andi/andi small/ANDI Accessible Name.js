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

	} else {
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
										andiAlerter.throwAlert(alert_006B, [attribute]);

									if (!hasNodeBeenTraversed(refElement)) {
										andiCheck.areThereAnyDuplicateIds(attribute, idsArray[x]);

										//Don't call stepB again to avoid infinite loops (spec explicitely defines this)
										if (element != refElement && $(refElement).attr(attribute)) {//reference contains another reference
											andiAlerter.throwAlert(alert_006C, [attribute, attribute]);
											AndiData.addComp(data, componentType, [(AndiCheck.emptyString + " "), refElement, idsArray[x]]);
										}

										var refData = {}; //will be discarded
										if (calcRefName(stepC(refElement, refData))); //aria-label
										else if (calcRefName(stepD(refElement, refData))); //native markup
										else if (calcRefName(stepE(refElement, refData))); //embedded control
										else if (calcRefName(stepF(refElement, refData, true, true))); //name from content
										else if (calcRefName(stepI(refElement, refData))); //title attribute
										else if (calcRefName(stepJ(refElement, refData))); //placeholder
									} else {//Referenced Element has already been traversed.
										andiAlerter.throwAlert(alert_006E, [attribute, idsArray[x]]);
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
								} else {//No, this id was not found, add to list.
									missingReferences.push(idsArray[x]);
									AndiData.addComp(data, componentType, [" ", undefined, idsArray[x]]);
								}
							} else { //id has already been directly referenced, this is a duplicate
								if (duplicateRefInstances.indexOf(idsArray[x]) === -1) {
									duplicateRefInstances.push(idsArray[x]);
									andiAlerter.throwAlert(alert_006D, [attribute, idsArray[x]]);
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
				} else if ($.trim(component) !== "") {//because alt="" is allowed for images only
					if ($(element).is("img[role=presentation],img[role=none]")) {
						andiAlerter.throwAlert(alert_0142);
					} else {
						andiAlerter.throwAlert(alert_0081);
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
					} else {//if type is submit or reset, add component
						var type = $(element).attr("type");
						if (type === "submit") {
							accumulatedText += AndiData.addComp(data, "value", "Submit", hasNodeBeenTraversed(element));
						} else if (type === "reset") {
							accumulatedText += AndiData.addComp(data, "value", "Reset", hasNodeBeenTraversed(element));
						}
					}
				}
			} else if (isCalcAccDesc && !usedInName.value) {
				accumulatedText += data.value;
			}
		}

		if ($(element).is("table")) {
			if (!data.caption) {
				component = grab_caption(element);
				if (component && !accumulatedText) {
					var caption = AndiData.addComp(data, "caption", component, hasNodeBeenTraversed(element));
					if (role !== "presentation" && role !== "none")
						accumulatedText += caption;
				}
			} else if (isCalcAccDesc && !usedInName.caption) {
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
		} else if (!isCalcAccDesc) {
			if ($(element).isSemantically("[role=textbox],[role=combobox],[role=listbox],[role=checkbox],[role=radio]", "input,select,textarea,[contenteditable=true],[contenteditable='']")) {
				component = grab_label(element);
				if (component !== undefined) {
					if (!isEmptyComponent(component[0], "label", element)) {
						accumulatedText += AndiData.addComp(data, "label", component, (isRecursion || hasNodeBeenTraversed(element)));
					}
				}
			} else if ($(element).is("fieldset")) {
				component = grab_legend(element);
				if (component !== undefined) {
					accumulatedText += AndiData.addComp(data, "legend", component, hasNodeBeenTraversed(element));
				}
			} else if ($(element).is("figure")) {
				component = grab_figcaption(element);
				if (component !== undefined) {
					accumulatedText += AndiData.addComp(data, "figcaption", component, hasNodeBeenTraversed(element));
				}
			} else if (browserSupports.svg && ($(element).is("svg") || element instanceof SVGElement)) {
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
		} else if ($(element).is("select")) {
			var selectedOption = $(element).find("option:selected").first();
			if (selectedOption)
				accumulatedText += andiUtility.getVisibleInnerText(selectedOption[0], root);
		} else if ($(element).is("[role=combobox],[role=listbox],[role=progressbar],[role=scrollbar],[role=slider],[role=spinbutton]")) {
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
					} else if (!$(node).is(exclusions) && $(node).is(":shown")) {
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
						} else {//not a name from content element
							subtreeData = {};
							accumulatedText += stepF(node, subtreeData, false, isProcessRefTraversal);
							if (accumulatedText !== "" && andiUtility.isBlockElement(node))
								accumulatedText += " "; //add extra space after block elements
							pushSubtreeData(data, subtreeData, node);
						}
					}
				} else if (node.nodeType === 3) {//text node
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
		} else if (isCalcAccDesc && !usedInName.title) {
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
				addEmptyComponent(componentType, AndiCheck.emptyString);
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
					andiAlerter.throwAlert(alert_006F, [forAttr, element.id]);
				} else {
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

// Other Necessary Functions
AndiUtility.getVisibleInnerText = function (element, root) {
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
						innerText += AndiUtility.getVisibleInnerText(node, root);

					if (andiUtility.isBlockElement(node))
						innerText += " ";
				}
			} else if (node.nodeType === 3) {//text node
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
		} else if ($(node).is("[role=combobox],[role=listbox]")) { //get chosen option
			component = $(node).find("[role=option][aria-selected=true]").first().text();
			if (component && $.trim(component) !== "") {
				innerText += component;
			}
			return true;
		} else if ($(node).is("select")) { //get chosen option
			component = $(node).find("option:selected").first().text();
			if (component && $.trim(component) !== "") {
				innerText += component;
			}
			return true;
		} else if ($(node).is("[role=progressbar],[role=scrollbar],[role=slider],[role=spinbutton]")) {
			component = $(node).attr("aria-valuetext");
			if (component && $.trim(component) !== "") {
				innerText += component;
			} else {
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

AndiUtlity.isBlockElement = function (node) {
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

//This function checks for pseudo element content
//Return: Array [displayText, contentLiteral]
AndiUtility.getPseudoContent = function (pseudo, element) {
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

		//strip double quotes
		//TODO: do it more "carefully"
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

AndiUtility.condenseWhitespace = function (string) {
	var whitespace_regex = /\s+/g;
	if (string !== undefined) {
		return string.replace(whitespace_regex, " ");
	}
};