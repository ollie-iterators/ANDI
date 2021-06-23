//This function precalculates the table name
//Returns an array with the tableName and the namingMethodUsed
function preCalculateTableName(table) {
    var tableName, namingMethod;
    var role = $.trim($(table).attr("role"));
    if (role === "presentation" || role === "none") {
        tableName = "<span style='font-style:italic'>Presentation Table</span>";
        namingMethod = "";
    } else if (role && role !== "table" && role !== "grid" && role !== "treegrid") {
        tableName = "<span style='font-style:italic'>Not Recognized as a Data Table</span>";
        namingMethod = "";
    } else {
        tableName = grabTextFromAriaLabelledbyReferences(table);
        namingMethod = "aria-labelledby";
        if (!tableName) {
            tableName = cleanUp($(table).attr("aria-label"));
            namingMethod = "aria-label";
        }
        if (!tableName) {
            tableName = cleanUp($(table).find("caption").filter(":visible").first().text());
            namingMethod = "&lt;caption&gt;";
        }
        if (!tableName) {
            tableName = cleanUp($(table).attr("summary"));
            namingMethod = "summary";
        }
        if (!tableName) {
            tableName = cleanUp($(table).attr("title"));
            namingMethod = "title";
        }

        //No Name, check if preceeded by heading
        if (!tableName) {
            var prevElement = $(table).prev();
            if ($(prevElement).is("h1,h2,h3,h4,h5,h6")) {
                tableName = "<span class='ANDI508-display-caution'><img alt='Caution: ' src='" + icons_url + "caution.png' /> " +
                    "Data Table with No Name, but Preceded by Heading: </span>" +
                    cleanUp($(prevElement).text());
                namingMethod = "&lt;" + $(prevElement).prop("tagName").toLowerCase() + "&gt;";
            }
        }

        //No Name
        if (!tableName) {
            tableName = "<span class='ANDI508-display-caution'><img alt='Caution: ' src='" + icons_url + "caution.png' /> " +
                "Data Table with No Name</span>";
            namingMethod = "<span class='ANDI508-display-caution'>None</span>";
        }
    }
    return [tableName, namingMethod];

    function cleanUp(text) {
        return andiUtility.formatForHtml($.trim(text));
    }

    //This function gets the text from the aria-labelledby references
    //TODO: some code is being duplicated here. Difference here is that alerts aren't needed
    function grabTextFromAriaLabelledbyReferences(element) {
        var ids = $.trim($(element).attr("aria-labelledby"));//get the ids to search for
        var idsArray = ids.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
        var accumulatedText = "";//this variable is going to store what is found. And will be returned
        var referencedId, referencedElement, referencedElementText;
        //Traverse through the array
        for (var x = 0; x < idsArray.length; x++) {
            //Can the aria list id be found somewhere on the page
            if (idsArray[x] !== "") {
                referencedElement = document.getElementById(idsArray[x]);
                referencedElementText = "";
                if ($(referencedElement).attr("aria-label")) { //Yes, this id was found and it has an aria-label
                    referencedElementText += andiUtility.formatForHtml($(referencedElement).attr("aria-label"));
                } else if ($(referencedElement).html() !== undefined) { //Yes, this id was found and the reference contains something
                    referencedElementText += andiUtility.formatForHtml(andiUtility.getVisibleInnerText(referencedElement, true));
                }
                //Add to accumulatedText
                accumulatedText += referencedElementText + " ";
            }
        }
        return $.trim(accumulatedText);
    }
}