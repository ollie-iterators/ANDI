//==========================================//
//bANDI: colors ANDI (small code)           //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //TODO: select box, check for selected

    //create bANDI instance
    var bANDI = new AndiModule("4.1.3", "b");

    var imgCount = 0;
    var elementsContainingTextCount = 0;

    //This function will run tests on text containing elements
    bANDI.analyze = function () {
        //Elements that are disabled or have aria-disabled="true" do not need to be tested
        $(TestPageData.allElements).filter("*:not(option)").each(function () {

            if ($(this).is("img[src],input:image[src],svg,canvas")) {
                imgCount++;
            } else {
                if (hasTextExcludingChildren(this)) {
                    if (!hasAdditionalHidingTechniques(this)) {
                        //Element is not hidden and contains text.

                        elementsContainingTextCount++;

                        //Try to get the contrast ratio automatically
                        var bANDI_data = bANDI.getContrast($(this));

                        if (!bANDI_data.disabled) {
                            andiData = new AndiData(this, true);

                            $(this).data("bandi508", bANDI_data);

                            //Throw alerts if necessary
                            bANDI.processResult($(this));

                            AndiData.attachDataToElement(this);
                        } else {
                            testPageData.disabledElementsCount++;
                        }
                    }
                }
            }
        });

        //This function checks for additional hiding techniques and returns true if it has one
        //Techniques such as font-size:0, large text-indent, overflow:hidden width small height and width
        function hasAdditionalHidingTechniques(element) {
            if ( //font-size:0
                parseInt($(element).css("font-size")) === 0 ||
                //text-indent is pushing the element off the page
                (
                    $(element).css("text-indent") != "0" || $(element).css("text-indent") != "0px") && parseInt($(element).css("text-indent")) < -998 ||
                //overflow:hidden and height:1 width:1
                $(element).css("overflow") == "hidden" && (parseInt($(element).css("height")) <= 1 || parseInt($(element).css("width")) <= 1)
            ) {
                return true; //has an additional hiding technique
            }
            return false;
        }

        //This function returns true if one of the immediate children has text
        function hasTextExcludingChildren(element) {
            //Loop through the child nodes of this element looking for text
            var l = element.childNodes.length;
            if (l) {//has child nodes
                for (var x = 0; x < l; x++) {
                    if (element.childNodes[x].nodeType === Node.TEXT_NODE && element.childNodes[x].nodeValue.trim() !== "") {
                        return true; //one of the immediate children has text
                    }
                }
            } else if ($(element).is("input:not([type=radio],[type=checkbox])")) {//element has no child nodes but still can contain text
                return true;
            }
            return false;
        }
    };

    //This function will get the contrast
    bANDI.getContrast = function (fgElement) {
        var disabled = isThisDisabled(fgElement);
        var semiTransparency = false;
        var opacity = false;

        //Get background color
        var bgColor = new Color($(fgElement).css("background-color"));
        var bgElement = getBgElement(fgElement);

        //Get foreground color
        var fgColor = new Color($(fgElement).css("color"));
        if (fgColor.alpha < 1) {
            semiTransparency = true;
            fgColor = fgColor.overlayOn(bgColor);
        }

        var contrast = fgColor.contrast(bgColor);
        var ratio = contrast.ratio;

        var bANDI_data = {
            bgColor: bgColor,
            fgColor: fgColor,
            contrast: contrast,
            ratio: ratio,
            semiTransparency: semiTransparency,
            opacity: opacity,
            bgImage: $(bgElement).css("background-image"),
            size: parseFloat($(fgElement).css("font-size")),
            weight: $(fgElement).css("font-weight"),
            family: $(fgElement).css("font-family"),
            minReq: undefined,
            result: undefined,
            disabled: disabled
        };

        if (!disabled) { //Run the contrast test
            contrastTest(bANDI_data);
        }

        //send bANDI_data back
        return bANDI_data;

        //This function does the contrast test
        function contrastTest(bANDI_data) {
            //Set minReq (minimum requirement)
            bANDI_data.minReq = 4.5;

            if (bANDI_data.size >= 24) {
                bANDI_data.minReq = 3;
            } else if (bANDI_data.size >= 18.66 && bANDI_data.weight >= 700) { //700 is where bold begins, 18.66 is approx equal to 14pt
                bANDI_data.minReq = 3;
            }

            if (bANDI_data.bgImage === "none" && !bANDI_data.opacity) {
                //No, Display PASS/FAIL Result and Requirement Ratio
                if (bANDI_data.ratio >= bANDI_data.minReq) {
                    bANDI_data.result = "PASS";
                } else {
                    bANDI_data.result = "FAIL";
                }
            }
        }

        //This function will recursively get the element that contains the background-color or background-image.
        function getBgElement(element, recursion) {
            if (!disabled) {
                disabled = isThisDisabled(element);
            }
            if (parseInt($(element).css("opacity")) < 1) {
                opacity = true;
            }
            if ($(element).css("background-image") !== "none") {
                return element;
            } else {
                //Store this background color
                var thisBgColor = new Color($(element).css("background-color"));

                //Overlay the accumulated bgColor with the the previous background color that was semi-transparent
                if (recursion) {
                    bgColor = bgColor.overlayOn(thisBgColor);
                } else {
                    bgColor = thisBgColor;
                }

                if ($(element).is("html")) {
                    //transparent or semi-transparent
                    if (thisBgColor.alpha < 1) {
                        bgColor = bgColor.overlayOn(Color.WHITE);
                        if (thisBgColor.alpha > 0) {
                            semiTransparency = true;
                        }
                    }
                } else if (thisBgColor.alpha < 1) {
                    //Look at parent element
                    if (thisBgColor.alpha > 0) {
                        semiTransparency = true;
                    }
                    return getBgElement($(element).parent(), true);
                }
                return element;
            }
        }

        function isThisDisabled(element) {
            return !!($(element).prop("disabled") || $(element).attr("aria-disabled") === "true");
        }
    };

    //This function will throw alerts depending on the results of the contrast test.
    bANDI.processResult = function (element) {
        var bANDI_data = $(element).data("bandi508");

        //Throw Alerts if Necessary:
        if (bANDI_data.result === "FAIL") { //Text does not meet minimum contrast ratio
            var minReq = $(element).data("bandi508").minReq;
            if (minReq === 3) {
                alert = [alert_0240, ["large text ", "AA", minReq]];
            } else {
                alert = [alert_0240, [" ", "AA", minReq]];
            }
        } else if (!bANDI_data.result) {
            if ($(element).data("bandi508").opacity) { //Opacity Less Than 1
                alert = [alert_0232];
            }
            if ($(element).data("bandi508").bgImage !== "none") { //Has Background Image
                alert = [alert_0230];
            }
                
        }
    };

    //This function will return the suggested color HTML
    //if bANDI_data not passed in, returns a message about suggested color not being possible
    bANDI.getSuggestedColorHTML = function (bANDI_data) {
        var suggestedColorHtml = "<tr><th class='bANDI508-label' scope='row'>Suggested&nbsp;";
        if (bANDI_data) {
            //Get Suggested Color
            var suggestedFgColor = bANDI.getSuggestedColor(bANDI_data, "fg");
            var suggestedBgColor = bANDI.getSuggestedColor(bANDI_data, "bg");

            var suggestedColor;

            if (bANDI.suggestForegroundChange(bANDI_data, suggestedFgColor, suggestedBgColor)) {
                //Suggest Foreground Color
                suggestedColor = suggestedFgColor;
                suggestedColorHtml += "Text&nbsp;Color";
            } else {
                //Suggest Background Color
                suggestedColor = suggestedBgColor;
                suggestedColorHtml += "Background";
            }

            suggestedColor = rgbToHex(suggestedColor);

            suggestedColorHtml += ":</th><td><div class='bANDI508-colorSelector' style='background-color:" + suggestedColor + " !important;'></div>";
            suggestedColorHtml += "<span id='bANDI508-suggested'>" + suggestedColor + "</span></td></tr>";
        } else {
            suggestedColorHtml += "Color:</th>" +
                "<td><a href='" + help_url + "modules.html#bANDI-style' target='_ANDIhelp' class='bANDI508-suggestionNotPossible'>" +
                "Semi-transparency present; cannot provide specific suggestion." +
                "</a></td></tr>";
        }
        return suggestedColorHtml;
    };

    //This function will suggest a foreground color that satisfies the minReq
    bANDI.getSuggestedColor = function (bANDI_data, fgbg) {
        var contrastingColor;
        var suggestedColor;

        if (fgbg == "fg") {
            contrastingColor = bANDI_data.bgColor;
            suggestedColor = bANDI_data.fgColor.clone();
        } else {
            contrastingColor = bANDI_data.fgColor;
            suggestedColor = bANDI_data.bgColor.clone();
        }

        var contrastOnBlack = Color.BLACK.contrast(contrastingColor).ratio;
        var contrastOnWhite = Color.WHITE.contrast(contrastingColor).ratio;

        if (contrastOnBlack > contrastOnWhite) { //Original Color is closer to black
            //Suggest lighter foreground color
            for (var x = 0; x < 256; x++) {
                for (var i = 0; i < 3; i++) {
                    if (suggestedColor.rgba[i] > 0) {
                        suggestedColor.rgba[i]--;
                    }
                }

                if (suggestedColor.contrast(contrastingColor).ratio >= bANDI_data.minReq) {
                    break;
                }
            }
        } else { //Original Color is closer to white
            //Suggest darker foreground color
            for (var y = 0; y < 256; y++) {
                for (var j = 0; j < 3; j++) {
                    if (suggestedColor.rgba[j] < 255) {
                        suggestedColor.rgba[j]++;
                    }
                }

                if (suggestedColor.contrast(contrastingColor).ratio >= bANDI_data.minReq) {
                    break;
                }
            }
        }

        return suggestedColor;
    };

    //This function returns true if the suggested foreground color is closer to the actual foreground color.
    //Returns false if the suggested background color is closer to the actual background color 
    bANDI.suggestForegroundChange = function (bANDI_data, suggestedFgColor, suggestedBgColor) {
        if (getColorDifferenceValue(bANDI_data.fgColor, suggestedFgColor) <= getColorDifferenceValue(bANDI_data.bgColor, suggestedBgColor)) {
            return true;
        } else {
            return false;
        }

        //This function compares two colors and returns a "color difference value" that can be used in comparisons.
        //Formula: The Color Difference Value = abs(r1 - r2) + abs(g1 - g2) + abs(b1 - b2)
        function getColorDifferenceValue(color1, color2) {
            var r = Math.abs(color1.rgba[0] - color2.rgba[0]);
            var g = Math.abs(color1.rgba[1] - color2.rgba[1]);
            var b = Math.abs(color1.rgba[2] - color2.rgba[2]);

            //Return the Color Difference Value
            return r + g + b;
        }
    };

    //This function will check the contrast for an element
    //It takes into consideration the font-size and font-weight
    bANDI.contrastDisplay = function (element) {
        var bANDI_data = $(element).data("bandi508");

        $("#bANDI508-fontsize").html(convertPxToPt(bANDI_data.size) + "pt");

        //Display Font-weight (if bold)
        if (bANDI_data.weight >= 700) {
            $("#bANDI508-fontweight").html("bold");
        }

        //Display Font-family
        $("#bANDI508-fontfamily").html(bANDI_data.family);

        //Display Text Color
        displayColorValue("#bANDI508-fg", bANDI_data.fgColor);

        //Display Minimum Required Ratio
        $("#bANDI508-minReqRatio").html(bANDI_data.minReq + "<span class='bANDI508-ratio-darker'>:1</span>");

        //Display text-shadow color if it exists
        //TODO: display the color in a color box, however, browsers order this property's value differently
        if ($(element).css("text-shadow") != "none") {
            $("#bANDI508-table-style tbody").append("<tr><th scope='row' class='bANDI508-label'>Text-Shadow:</th><td><span id='bANDI508-textshadow'>" + $(element).css("text-shadow") + "</span></td></tr>");
        }
        
        if (bANDI_data.result) { //If Result is PASS or FAIL
            //Display Background Color
            displayColorValue("#bANDI508-bg", bANDI_data.bgColor);

            //Display Contrast Ratio
            $("#bANDI508-ratio").html(bANDI_data.ratio + "<span class='bANDI508-ratio-darker'>:1</span>");

            //Display Result
            if (bANDI_data.result === "PASS") {
                $("#bANDI508-result").html("PASS").addClass("bANDI508-pass");
            } else { //FAIL
                $("#bANDI508-result").html("FAIL").addClass("bANDI508-fail");

                if (!bANDI_data.semiTransparency) {
                    //There is no transparency involved, therefore, a suggestion can be made.
                    //Suggest a color that meets the contrast ratio minimum:
                    $("#bANDI508-table-style tbody").append(bANDI.getSuggestedColorHTML(bANDI_data));
                } else {
                    //Cannot suggest color due to semi-transparency
                    $("#bANDI508-table-style tbody").append(bANDI.getSuggestedColorHTML());
                }
            }
        } else { //MANUAL TEST NEEDED - Cannot determine pass or fail status
            //Remove Background Color Selector Box
            $("#bANDI508-colorSelector-background").remove();

            //Insert the reason:
            if (bANDI_data.bgImage != "none") {
                $("#bANDI508-bg").html("<span class='bANDI508-attention'>has background image</span>");
            } else if (bANDI_data.opacity) {
                $("#bANDI508-bg").closest("tr").remove();
                $("#bANDI508-fg").closest("tr").remove();
            }

            $("#bANDI508-result").html("MANUAL TEST NEEDED").addClass("bANDI508-manual");
        }

        //This function converts px units to pt
        function convertPxToPt(px) {
            var pt;
            //convert px to inches (divide by 96)
            pt = (px / 96);
            //convert inches to pt (multiply by 72)
            pt = pt * 72;
            //round to 2 decimals
            pt = Math.round(pt, 2);
            //truncate the decimal
            pt = Math.floor(pt);
            return pt;
        }
    };

    //This function will diplay the color 
    function displayColorValue(id, rgbaColor) {
        var hexColor = rgbToHex(rgbaColor);
        //Change color display value of this element
        if ($(id).is("input")) {
            $(id).val(hexColor);
        } else {
            $(id).html(hexColor);
        }
        //Change color on the colorSelector
        $(id).prev().attr("style", "background-color:" + hexColor + " !important");
    }

    //This function will convert an rgb value to a hex value
    function rgbToHex(rgbaColor) {
        return "#" + valueToHex(Math.round(rgbaColor.rgba[0])) + valueToHex(Math.round(rgbaColor.rgba[1])) + valueToHex(Math.round(rgbaColor.rgba[2]));

        function valueToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
    }

    //===============
    //https://github.com/LeaVerou/contrast-ratio
    //Copyright (c) 2013 Lea Verou
    //Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
    //to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
    //and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    //The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    //color.js Start (modified by SSA)

    // Extend Math.round to allow for precision
    Math.round = (function () {
        var round = Math.round;
        return function (number, decimals) {
            decimals = +decimals || 0;
            var multiplier = Math.pow(10, decimals);
            return round(number * multiplier) / multiplier;
        };
    })();

    // Simple class for handling sRGB colors
    (function () {

        var _ = self.Color = function (rgba) {
            if (rgba === 'transparent') {
                rgba = [0, 0, 0, 0];
            } else if (typeof rgba === 'string') {
                var rgbaString = rgba;
                rgba = rgbaString.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);

                if (rgba) {
                    rgba.shift();
                } else {
                    throw new Error('Invalid string: ' + rgbaString);
                }
            }

            if (rgba[3] === undefined) {
                rgba[3] = 1;
            }

            rgba = rgba.map(function (a) { return Math.round(a, 3); });

            this.rgba = rgba;
        };

        _.prototype = {
            get rgb() {
                return this.rgba.slice(0, 3);
            },

            get alpha() {
                return this.rgba[3];
            },

            set alpha(alpha) {
                this.rgba[3] = alpha;
            },

            get luminance() {
                // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
                var rgba = this.rgba.slice();

                for (var i = 0; i < 3; i++) {
                    var rgb = rgba[i];

                    rgb /= 255;

                    rgb = rgb < 0.03928 ? rgb / 12.92 : Math.pow((rgb + 0.055) / 1.055, 2.4);

                    rgba[i] = rgb;
                }

                return 0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2];
            },

            get inverse() {
                return new _([
                    255 - this.rgba[0],
                    255 - this.rgba[1],
                    255 - this.rgba[2],
                    this.alpha
                ]);
            },

            toString: function () {
                return 'rgb' + (this.alpha < 1 ? 'a' : '') + '(' + this.rgba.slice(0, this.alpha >= 1 ? 3 : 4).join(', ') + ')';
            },

            clone: function () {
                return new _(this.rgba);
            },

            //Overlay a color over another
            overlayOn: function (color) {
                var overlaid = this.clone();

                var alpha = this.alpha;

                if (alpha >= 1) {
                    return overlaid;
                }

                //Modified code (Mod 1): (moved this line before the for loop)
                overlaid.rgba[3] = alpha + (color.rgba[3] * (1 - alpha));

                for (var i = 0; i < 3; i++) {
                    //Modified code (Mod 2): (divide by the overlaid alpha if not zero) (Formula: https://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending)
                    if (overlaid.rgba[3] !== 0) {
                        overlaid.rgba[i] = (overlaid.rgba[i] * alpha + color.rgba[i] * color.rgba[3] * (1 - alpha)) / overlaid.rgba[3];
                    } else { //Modified code (Mod 2) End
                        overlaid.rgba[i] = overlaid.rgba[i] * alpha + color.rgba[i] * color.rgba[3] * (1 - alpha);
                    }
                }

                //Original code (Mod 1):
                //overlaid.rgba[3] = alpha + (color.rgba[3] * (1 - alpha));

                return overlaid;
            },

            contrast: function (color) {
                // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
                var alpha = this.alpha;

                if (alpha >= 1) {
                    if (color.alpha < 1) {
                        color = color.overlayOn(this);
                    }

                    var l1 = this.luminance + 0.05,
                        l2 = color.luminance + 0.05,
                        ratio = l1 / l2;

                    if (l2 > l1) {
                        ratio = 1 / ratio;
                    }

                    return {
                        ratio: ratio,
                        error: 0,
                        min: ratio,
                        max: ratio
                    };
                }

                // If we’re here, it means we have a semi-transparent background
                // The text color may or may not be semi-transparent, but that doesn't matter

                var onBlack = this.overlayOn(_.BLACK),
                    onWhite = this.overlayOn(_.WHITE),
                    contrastOnBlack = onBlack.contrast(color).ratio,
                    contrastOnWhite = onWhite.contrast(color).ratio;

                var max = Math.max(contrastOnBlack, contrastOnWhite);

                // This is here for backwards compatibility and not used to calculate
                // `min`.  Note that there may be other colors with a closer luminance to
                // `color` if they have a different hue than `this`.
                var closest = this.rgb.map(function (c, i) {
                    return Math.min(Math.max(0, (color.rgb[i] - c * alpha) / (1 - alpha)), 255);
                });

                closest = new _(closest);

                var min = 1;
                if (onBlack.luminance > color.luminance) {
                    min = contrastOnBlack;
                } else if (onWhite.luminance < color.luminance) {
                    min = contrastOnWhite;
                }

                return {
                    ratio: (min + max) / 2,
                    error: (max - min) / 2,
                    min: min,
                    max: max,
                    closest: closest,
                    farthest: onWhite == max ? _.WHITE : _.BLACK
                };
            }
        };

        _.BLACK = new _([0, 0, 0]);
        _.GRAY = new _([127.5, 127.5, 127.5]);
        _.WHITE = new _([255, 255, 255]);

    })();
    //color.js End
    //===============
    bANDI.analyze();
}//end init
