// wait until the document has loaded
window.addEventListener('load', function () {
    'use strict';

    var controlElem,
        dilElems = [], // dilution HTML elements (INPUT tags)
        raElems = [],  // residual activity HTML elements (DIV tags)
        dilRows = [],  // table rows for each dilution
        sampleBUElem,  // final sample BU (calculated)
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

            sampleBUElem.innerHTML = sampleBU.toFixed(2);
        }

        for (i = 0; i < dilutions.length; ++i) {
            if (i == closestRAIndex) {
                dilRows[i].className = "selected";
            } else {
                dilRows[i].className = "";
            }
        }
    }

    (function () {
        // locate all of the elements
        var i;

        controlElem = document.getElementById('control');
        controlElem.value = '';

        sampleBUElem = document.getElementById('sampleBU');

        for (i = 0; i < dilutions.length; ++i) {
            var dilElem, raElem, dilRow;
            dilElem = document.getElementById('dil' + dilutions[i]);
            dilElem.oninput = updateResults;
            dilElems.push(dilElem);
            dilElem.value = '';

            raElem = document.getElementById('ra' + dilutions[i]);
            raElems.push(raElem);

            dilRow = document.getElementById('row' + dilutions[i]);
            dilRows.push(dilRow);
        }
    })();
    updateResults();

    controlElem.oninput = updateResults;

}, false);

