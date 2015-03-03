// Emulate addEventListener on older versions of Internet Explorer
if (!window.addEventListener) {
    window.addEventListener = function (eventType, callback) {
        'use strict';

        window.attachEvent('on' + eventType, callback);
    };
}

// wait until the document has loaded
window.addEventListener('load', function () {
    'use strict';

    var controlElem,
        dilElems = [],      // dilution HTML elements (INPUT tags)
        raElems = [],       // residual activity HTML elements (DIV tags)
        dilRows = [],       // table rows for each dilution
        closestDilutionElem,  // dilution with RA closest to 50% (calculated)
        bethesdaFactorElem,  // inhibitor in the dilute sample (calculated)
        sampleBUElem,  // final sample BU (calculated)
        selfTestTable, // table of self test results
        dateElem,      // date element (INPUT tag)
        testSuccessStatusElem, // message giving self-test results (DIV)
        loadingDiv, // section of document with the testing message
        testingDiv, // section of document with the testing message
        testsFailedDiv, // section of document with tests-failed message
        mainFormDiv, // section of document with the main form
        dilutions = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

    // Add leading zeros to the given value until it is 'width' digits wide
    // (width defaults to 2)
    function zeroPad(val, width) {
        width = width || 2;
        while (String(val).length < 2) {
            val = '0' + String(val);
        }
        return val;
    }

    // Output a date in ISO 8601 format
    function isoDate(date) {
        return date.getFullYear() + "-" +
            zeroPad(date.getMonth() + 1) + "-" +
            zeroPad(date.getDate());
    }

    // Output a date and time in ISO8601 format
    function isoDateTime(date) {
        return isoDate(date) + "T" +
            zeroPad(date.getHours()) + ":" +
            zeroPad(date.getMinutes()) + ":" +
            zeroPad(date.getSeconds());
        // a time zone is recommended, but we're skipping that for now
    }

    // Check if the given value is a number
    function isNumeric(val) {
        return (
            /\S/.test(val) &&          // value is not just whitespace and
            !(isNaN(parseFloat(val)))  // can be converted to a number
        );
    }

    // creates a new row for an HTML table with the given entries
    function createTableRow(entries) {
        var i, tableRow, tableDatum;

        // create the new (empty) row
        tableRow = document.createElement('tr');

        // for each entry we were given
        for (i = 0; i < entries.length; i += 1) {

            // create the HTML for that entry
            tableDatum = document.createElement('td');
            tableDatum.innerHTML = entries[i];

            // add it to the row
            tableRow.appendChild(tableDatum);
        }

        return tableRow;
    }

    // Update all of the calculations based on the current user-entered values
    function updateResults() {
        var i,
            ra, // relative activity
            idealRAVal = 0.5, // target relative activity
            closestRAVal = 0.29999999, // closest value so far
            closestRAIndex = -1, // index of row with closest value, -1 = none
            closestDilution,
            bethesdaFactor,
            sampleBU;


        // iterate over the rows
        for (i = 0; i < dilutions.length; i += 1) {
            // if we have enough information to calculate the relative
            // activity...
            if (isNumeric(controlElem.value) && isNumeric(dilElems[i].value)) {
                // calculate the relative activity and fill in that column
                ra = parseFloat(dilElems[i].value) /
                    parseFloat(controlElem.value);
                raElems[i].innerHTML = (100 * ra).toFixed(2) + "%";

                // if it's closer to 50% than our best row so far, choose
                // this row as our best row to date.
                if (Math.abs(ra - idealRAVal) <
                        Math.abs(closestRAVal - idealRAVal)) {
                    closestRAVal = ra;
                    closestRAIndex = i;
                }
            } else {
                // We don't have enough information to calculate the
                // relative activity for this row, so clear that column.
                raElems[i].innerHTML = '';
            }
        }

        // If we found a row that was better than our starting 30%...
        if (closestRAIndex !== -1) {
            // calculate our intermediate values and final result using that
            // row
            closestDilution = dilutions[closestRAIndex];
            bethesdaFactor = -Math.log(closestRAVal) / Math.log(2);
            sampleBU = closestDilution * bethesdaFactor;

            // update the values displayed on the form
            closestDilutionElem.innerHTML = "1:" + closestDilution;
            bethesdaFactorElem.innerHTML =
                bethesdaFactor.toFixed(2) + " BU/mL";
            sampleBUElem.innerHTML = sampleBU.toFixed(2) + " BU/mL";
        } else {
            // clear the values displayed on the form
            closestDilutionElem.innerHTML = "";
            bethesdaFactorElem.innerHTML = "";
            sampleBUElem.innerHTML = "";
        }

        // highlight the row that was selected (if any), and unhighlight all
        // other rows.
        for (i = 0; i < dilutions.length; i += 1) {
            if (i === closestRAIndex) {
                dilRows[i].className = "selected";
            } else {
                dilRows[i].className = "";
            }
        }
    }

    // clear all of the dilution input boxes
    function clearInputs() {
        var i;
        controlElem.value = '';
        for (i = 0; i < dilutions.length; i += 1) {
            dilElems[i].value = '';
        }
        updateResults();
    }

    // initialization
    (function () {
        var i, today, dilElem, raElem, dilRow;

        //
        // Locate all of the HTML elements we need and store them in
        // JavaScript variables.
        //
        controlElem = document.getElementById('control');
        controlElem.oninput = updateResults;

        closestDilutionElem = document.getElementById('closestDilution');
        bethesdaFactorElem = document.getElementById('bethesdaFactor');
        sampleBUElem = document.getElementById('sampleBU');

        dateElem = document.getElementById('date');

        testSuccessStatusElem = document.getElementById('testSuccessStatus');
        loadingDiv = document.getElementById('loading');
        testingDiv = document.getElementById('testing');
        testsFailedDiv = document.getElementById('testsFailed');
        mainFormDiv = document.getElementById('mainForm');
        selfTestTable = document.getElementById("selfTestTable");

        for (i = 0; i < dilutions.length; i += 1) {
            dilElem = document.getElementById('dil' + dilutions[i]);
            dilElem.oninput = updateResults;
            dilElems.push(dilElem);

            raElem = document.getElementById('ra' + dilutions[i]);
            raElems.push(raElem);

            dilRow = document.getElementById('row' + dilutions[i]);
            dilRows.push(dilRow);
        }

        // Erase any existing values in the dilution input boxes
        clearInputs();

        // Fill in the current date
        today = new Date();
        dateElem.value = isoDate(today);

        // Hide everything we don't want to show initially
        mainFormDiv.style.display = 'none';
        testsFailedDiv.style.display = 'none';
        selfTestTable.style.display = 'none';

        // Belt and suspenders: some older browsers have bugs where they
        // don't fire an event when a text field changes.  Thus we'll update
        // the calculations every 500ms just in case we missed a change in
        // one of the inputs.
        window.setInterval(updateResults, 500);
    }());

    // Make clicking on the self-test summary toggle the visibility of the
    // table of self-test results.
    testSuccessStatusElem.onclick = function () {
        if (selfTestTable.style.display === 'block') {
            selfTestTable.style.display = 'none';
        } else {
            selfTestTable.style.display = 'block';
        }
    };

    // Run a series of integration self-tests to make sure entering a given
    // set of data in the activity column produces the expected output in
    // the calculation fields.
    function runTests() {
        var i, j, testcases, numFailures, testStartTime,
            testPassed, testResultsRow;

        // record the time the tests were run
        testStartTime = new Date();

        // List of hand-generated set of inputs and expected outputs
        testcases = [
            // should choose the appropriate dilution
            { control: 0.04, dilutions:
                [ 0.02, 0.05, 0.1,   3,   6,  11,  14,  16,  20,  23,  22],
                closestDilution:  "1:1", bethesdaFactor: "1.00 BU/mL",
                sampleBU:  "1.00 BU/mL" },
            { control: 0.1, dilutions:
                [ 0.02, 0.05, 0.1,   3,   6,  11,  14,  16,  20,  23,  22],
                closestDilution:  "1:2", bethesdaFactor: "1.00 BU/mL",
                sampleBU:  "2.00 BU/mL" },
            { control: 0.2, dilutions:
                [ 0.02, 0.05, 0.1,   3,   6,  11,  14,  16,  20,  23,  22],
                closestDilution:  "1:4", bethesdaFactor: "1.00 BU/mL",
                sampleBU:  "4.00 BU/mL" },
            { control:   6, dilutions:
                [ 0.02, 0.05, 0.1,   3,   6,  11,  14,  16,  20,  23,  22],
                closestDilution:  "1:8", bethesdaFactor: "1.00 BU/mL",
                sampleBU:  "8.00 BU/mL" },
            { control:  12, dilutions:
                [ 0.02, 0.05, 0.1,   3,   6,  11,  14,  16,  20,  23,  22],
                closestDilution: "1:16", bethesdaFactor: "1.00 BU/mL",
                sampleBU: "16.00 BU/mL" },
            { control:  22, dilutions:
                [ 0.02, 0.05, 0.1,   3,   6,  11,  14,  16,  20,  23,  22],
                closestDilution: "1:32", bethesdaFactor: "1.00 BU/mL",
                sampleBU: "32.00 BU/mL" },
            { control:  28, dilutions:
                [ 0.02, 0.05, 0.1,   3,   6,  11,  14,  16,  20,  23,  22],
                closestDilution: "1:64", bethesdaFactor: "1.00 BU/mL",
                sampleBU: "64.00 BU/mL" },

            // should clear the results when the inputs are empty
            { control:  "", dilutions:
                [   "",   "",  "",  "",  "",  "",  "",  "",  "",  "",  ""],
                closestDilution: "", bethesdaFactor: "",
                sampleBU: "" },

            // should handle non-monotonic values
            { control:  28, dilutions:
                [ 0.02, 0.01, 0.02,  3,   2,  11,  14,  16,  28,  30,  28],
                closestDilution: "1:64", bethesdaFactor: "1.00 BU/mL",
                sampleBU: "64.00 BU/mL" },

            // should pick the lower value in a tie
            { control:   6, dilutions:
                [ 0.02, 0.05, 0.1,   3,   3,   6,  11,  14,  16,  20,  23],
                closestDilution:  "1:8", bethesdaFactor: "1.00 BU/mL",
                sampleBU:  "8.00 BU/mL" }
        ];

        // change the page the user sees from "loading" to "running tests"
        loadingDiv.style.display = 'block';
        loadingDiv.style.display = 'none';

        // keep a count of how many tests failed
        numFailures = 0;

        // for each of the tests...
        for (i = 0; i < testcases.length; i += 1) {

            // fill in the fields on the form
            controlElem.value = testcases[i].control;
            for (j = 0; j < dilutions.length; j += 1) {
                dilElems[j].value = testcases[i].dilutions[j];
            }

            // recalculate the results
            updateResults();

            // if any of the results are not the ones expected by the test
            if ((closestDilutionElem.innerHTML !==
                    testcases[i].closestDilution) ||
                    (bethesdaFactorElem.innerHTML !==
                    testcases[i].bethesdaFactor) ||
                    (sampleBUElem.innerHTML !== testcases[i].sampleBU)) {

                // note the error, including increasing our error counter
                testPassed = false;
                numFailures += 1;
            } else {
                testPassed = true;
            }

            // Add the result to our test results table

            // First, build up the list of things to go in the row,
            // namely all of the inputs...
            testResultsRow = [];
            testResultsRow.push(testcases[i].control);
            for (j = 0; j < dilutions.length; j += 1) {
                testResultsRow.push(testcases[i].dilutions[j]);
            }
            // ...expected and actual outputs...
            testResultsRow.push(testcases[i].closestDilution);
            testResultsRow.push(closestDilutionElem.innerHTML);
            testResultsRow.push(testcases[i].bethesdaFactor);
            testResultsRow.push(bethesdaFactorElem.innerHTML);
            testResultsRow.push(testcases[i].sampleBU);
            testResultsRow.push(sampleBUElem.innerHTML);
            // ... and whether the test passed.
            testResultsRow.push(testPassed ? "passed" : "failed");

            // Then turn it into HTML and append it to the table
            selfTestTable.appendChild(createTableRow(testResultsRow));
        }

        // If all of the tests passed...
        if (numFailures === 0) {
            // The app seems to be working, and we can show the normal user
            // interface.
            mainFormDiv.style.display = 'block';
        } else {
            // Otherwise, show a failure message and the test results table
            testsFailedDiv.style.display = 'block';
            selfTestTable.style.display = 'block';
        }
        testingDiv.style.display = 'none';

        // Add a line verifying the tests were run.
        testSuccessStatusElem.innerHTML = (
            testcases.length - numFailures + " of " +
            testcases.length + " self tests passed on " +
            isoDateTime(testStartTime)
        );

        // Erase any inputs the tests may have left
        clearInputs();
    }

    // Run the self tests every time the page is loaded.
    runTests();

}, false);

