// wait until the document has loaded
window.addEventListener('load', function () {
    'use strict';

    var controlElem,
        dilElems = [], // dilution HTML elements (INPUT tags)
        raElems = [],  // residual activity HTML elements (DIV tags)
        dilRows = [],  // table rows for each dilution
        sampleBUElem,  // final sample BU (calculated)
        selfTestTable, // table of self test results
        dateElem,      // date element (INPUT tag)
        testSuccessStatusElem, // message giving self-test results (DIV)
        loadingDiv, // section of document with the testing message
        testingDiv, // section of document with the testing message
        testsFailedDiv, // section of document with tests-failed message
        mainFormDiv, // section of document with the main form
        dilutions = [1,2,4,8,16,32,64,128,256,512,1024];

    function isNumeric(val) {
        return (
            /\S/.test(val) &&          // value is not just whitespace and
            !(isNaN(parseFloat(val)))  // can be converted to a number
            );
    }

    function updateResults() {
        var i, ra,
            idealRAVal = 0.5,
            closestRAVal = 0.29999999,
            closestRAIndex = -1;

        for (i = 0; i < dilutions.length; ++i) {
            if (isNumeric(controlElem.value) && isNumeric(dilElems[i].value)) {
                ra = parseFloat(dilElems[i].value) /
                    parseFloat(controlElem.value);
                raElems[i].innerHTML = (100 * ra).toFixed(2) + "%";

                if (Math.abs(ra - idealRAVal) < Math.abs(closestRAVal - idealRAVal)) {
                    closestRAVal = ra;
                    closestRAIndex = i;
                }
            } else {
                raElems[i].innerHTML = '';
            }
        }

        if (closestRAIndex != -1) {
            var dilution, dilutionBU, sampleBU;

            dilution = dilutions[closestRAIndex];
            dilutionBU = -Math.log(closestRAVal)/Math.log(2);
            sampleBU = dilution * dilutionBU;

            sampleBUElem.innerHTML = sampleBU.toFixed(2) + " BU/mL";
        } else {
            sampleBUElem.innerHTML = "";
        }

        for (i = 0; i < dilutions.length; ++i) {
            if (i == closestRAIndex) {
                dilRows[i].className = "selected";
            } else {
                dilRows[i].className = "";
            }
        }
    }

    function clearInputs() {
        var i;
        controlElem.value = '';
        for (i = 0; i < dilutions.length; ++i) {
            dilElems[i].value = '';
        }
        updateResults();
    }

    // initialization
    (function () {
        // locate all of the elements
        var i;

        controlElem = document.getElementById('control');
        controlElem.oninput = updateResults;

        sampleBUElem = document.getElementById('sampleBU');

        for (i = 0; i < dilutions.length; ++i) {
            var dilElem, raElem, dilRow;
            dilElem = document.getElementById('dil' + dilutions[i]);
            dilElem.oninput = updateResults;
            dilElems.push(dilElem);

            raElem = document.getElementById('ra' + dilutions[i]);
            raElems.push(raElem);

            dilRow = document.getElementById('row' + dilutions[i]);
            dilRows.push(dilRow);
        }
        dateElem = document.getElementById('date');
        testSuccessStatusElem = document.getElementById('testsuccessstatus');
        loadingDiv = document.getElementById('loading');
        testingDiv = document.getElementById('testing');
        testsFailedDiv = document.getElementById('testsfailed');
        mainFormDiv = document.getElementById('mainform');
        selfTestTable = document.getElementById("self_test_table");

        clearInputs();
    })();

    testSuccessStatusElem.onclick = function() {
        selfTestTable.hidden = !selfTestTable.hidden;
    }

    function runTests() {
        var i, j, testcases, numFailures, testStartTime,
            testPassed, tr, td;

        testStartTime = new Date();

        testcases = [
            { control:  22, dilutions: [   0,   0, 0.1,   3,   6,  11,  14,  16,  20,  23,  22], sampleBU: "32.00 BU/mL" },
            { control:  28, dilutions: [   0,   0, 0.1,   3,   6,  11,  14,  16,  20,  23,  22], sampleBU: "64.00 BU/mL" },
            { control:  "", dilutions: [  "",  "",  "",  "",  "",  "",  "",  "",  "",  "",  ""], sampleBU: "" }
        ];

        testingDiv.hidden = false;
        loadingDiv.hidden = true;

        numFailures = 0;

        for (i = 0; i < testcases.length; ++i) {
            controlElem.value = testcases[i].control;
            for (j = 0; j < dilutions.length; ++j) {
                dilElems[j].value = testcases[i].dilutions[j];
            }

            updateResults();
            if (sampleBUElem.innerHTML !== testcases[i].sampleBU) {
                testPassed = false;
                ++numFailures;
                console.log("Test " + i + " failed - expected \"" +
                        testcases[i].sampleBU + "\", got \"" +
                        sampleBUElem.innerHTML + "\"");
            } else {
                testPassed = true;
            }
            tr = document.createElement('tr');
            selfTestTable.appendChild(tr);

            td = document.createElement('td');
            td.innerHTML = testcases[i].control;
            tr.appendChild(td);
            for (j = 0; j < dilutions.length; ++j) {
                td = document.createElement('td');
                td.innerHTML = testcases[i].dilutions[j];
                tr.appendChild(td);
            }
            td = document.createElement('td');
            td.innerHTML = testcases[i].sampleBU;
            tr.appendChild(td);
            td = document.createElement('td');
            td.innerHTML = sampleBUElem.innerHTML;
            tr.appendChild(td);
            td = document.createElement('td');
            td.innerHTML = testPassed ? "passed" : "failed";
            tr.appendChild(td);
        }

        if (numFailures == 0) {
            mainFormDiv.hidden = false;
        } else {
            testsFailedDiv.hidden = false;
            selfTestTable.hidden = false;
        }
        testingDiv.hidden = true;
        testSuccessStatusElem.innerHTML = (
                testcases.length - numFailures + " of " +
                testcases.length + " self tests passed on " +
                testStartTime);

        clearInputs();
    }

    runTests();

}, false);

