/*
 *
 * Title:   Daily Task Tracker
 * Author:  Daniel Marino
 * Revised: November 2010
 *
 */

/*global window, document, localStorage, $ */

$(document).ready(function() {

    // Set some variables
    var num = 0, rowHTML = "", hv = "has_value",
    increment = $(".increment"), tt = $(".task_title"),
    lastSelected;

    // Adds Unique Ids to increments
    function addUniqueIds(el) {
      $(el).each(function() {
          $(this)
              .find("label")
              .attr("for", "field_" + num);
          $(this)
              .find(':input')
              .attr("id", "field_" + num)
              .attr("name", "field_" + num);
          num++;
      });
    }

    function addRow() {
        var theId = $("#tasks tbody tr").length + 1;
        $("tbody").append('<tr id="task_' + theId + '">' + rowHTML + '</tr>');
        var tr = $("#task_" + theId + " .title, #task_" + theId + " .inc");
        addUniqueIds(tr);
        $(".task_title:last-child").focus();
    }

    // Store data via localStorage
    function storeData() {
        var data = $("#tasks_form").serializeArray(),
            rows = { "rows" : $("tbody tr").length };
        data.unshift(rows);
        localStorage.dtt = JSON.stringify(data);
        return false;
    }

    // Generate CSV
    function generateCSV() {
        var csvHead = "Task Title, Time Spent",
            csvTrTitle, csvTrTotal, csvOut = csvHead + "\n";
        $("tbody tr").each(function() {
            csvTrTitle = $(this).find(".task_title").val();
            csvTrTotal = $(this).find(".task_total").text();
            csvOut = csvOut + '"' + csvTrTitle + '"' + ", " + csvTrTotal + "\n";
        });
        $("#download_csv").attr("href", "export.php?data=" + encodeURIComponent(csvOut));
    }

    function pad(num, size) {
        var s = "000000000" + num;
        return s.substr(s.length-size);
    }

    function intHourToStr(intHour) {
        return pad(Math.trunc(intHour),2)+":"+ pad(Math.trunc((intHour-Math.trunc(intHour))*60),2);
    }

    // Create some table columns
    (function createFirstRow() {
        var td = increment.html(), html = "";
        // We need to create at least one row
        for (var i = 1; i < 12; i++) {
            html += '<td id="tc_' + i + '" class="t_inc">' + td + '</td>';
        }
        increment.replaceWith(html);
        // Add unique ids to first tr of increment checkboxes
        var tr = $("#task_1 .title, #task_1 .inc");
        // This will be the html used for creating new rows
        rowHTML = $("#task_1").html();
        addUniqueIds(tr);
    }());

    // Get todays date
    (function todaysDate() {
        var theDate = new Date(),
            m       = theDate.getMonth(),
            month   = m + 1,
            d       = theDate.getDate(),
            y       = theDate.getFullYear(),
            months  = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"],
            theDotw = theDate.getDay(),
            dotw    = ["Воскременье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
            day;
        if (d < 10) {
            day = "0" + d;
        }
        if (month < 10) {
            month = "0" + month;
        }
        $("#today time")
            .attr("datetime", y + "-" + month + "-" + day)
            .text(dotw[theDotw] + ", " + d + " " + months[m] + " " + y);
    }());

    // Load data from localStorage if record exists
    (function loadData() {
        if (localStorage.dtt) {
            var jsonData = JSON.parse(localStorage.dtt),
                numRows  = jsonData[0].rows;
            // Create extra rows if necessary
            if (numRows > 1) {
                for (var x = 1; x < numRows; x++) {
                    addRow();
                }
            }
            // Insert titles and check checkboxes
            for (var i = 0; i < jsonData.length; i++) {
                var el = $("#" + jsonData[i].name);
                if (el.is("textarea")) {
                    if (jsonData[i].value) {
                        el.text(jsonData[i].value);
                        el.addClass(hv);
                    }
                } else
                 if (jsonData[i].value&&jsonData[i].value=="on"){
                    el.attr("checked", "checked");
                    el.val("on");
                    el.prev().addClass("active");
                 } else {
                     el.attr("checked", "checked");
                     el.val("on-half");
                     el.prev().addClass("active-half");
                 }
            }

            var task_total;
            $("tbody tr").each(function() {
                task_total = $(this).find(".active").length * 0.25 + $(this).find(".active-half").length * 0.125;
                $(this).find(".task_total").text(intHourToStr(task_total));
            });
            // Update daily time totals
            var day_total  = $("body").find(".active").length * 0.25 + $("body").find(".active-half").length * 0.125;
            $("#day_total").text(intHourToStr(day_total));
            // Load CSV Content
            generateCSV();
        }
    }());

    // Actions taking place when increment box is checked/unchecked
    (function incrementCheckbox() {
        $(".inc").live("click", function(e) {

            var thisLabel = $(this).find("label"),
                thisInput = $(this).find("input");

            function checkOrUncheck(l, i) {
                if (l.hasClass("active")) {
                    l.removeClass("active");
                    l.addClass("active-half");
                    i.val("on-half");
                    //i.removeAttr("checked");
                } else
                if (l.hasClass("active-half")) {
                    l.removeClass("active-half");
                    i.removeAttr("checked");
                    i.val("");
                }
                else
                {
                    l.addClass("active");
                    i.attr("checked", "checked");
                    i.val("on");
                }
            }

            // Add/removes .active class and checks/unchecks input checkbox
            checkOrUncheck(thisLabel, thisInput);

            var parent     = $(this).parents("tr"),
                task_total = parent.find(".active").length * 0.25 + parent.find(".active-half").length * 0.125,
                day_total  = $("body").find(".active").length * 0.25 + $("body").find(".active-half").length * 0.125;

            // Updates task time total
            $(parent).find(".task_total").text(intHourToStr(task_total));

            // Updates daily time total
            $("#day_total").text(intHourToStr(day_total));
            storeData();

            // Updates CSV
            generateCSV();

            // Makes this click the last field selected
            lastSelected = thisInput.attr("id");

            return false;
        });
    }());

    // Add a task
    (function addTask() {
        $("#add_task").click(function() {
            addRow();
        });
        $(document).keydown(function(e) {
            if (e.shiftKey && e.keyCode === 13) {
                addRow();
                return false;
            }
        });
    }());

    // Delete a task
    (function deleteTask() {
        $(".delete_task").live("click", function() {
            $(this).parents("tr").remove();
            num = 0 // Resets global counter for resetting field ids & names
            var all_fields = $(".title, .inc");
            addUniqueIds(all_fields);
            storeData();
            generateCSV();
            return false;
        });
    }());

    // Task Title Actions
    (function taskTitleClass() {
        tt.live("blur", function() {
            if ($(this).val()) {
                $(this).addClass(hv);
            } else {
                $(this).removeClass(hv);
            }
        });
        tt.live("focus", function() {
            $(this).removeClass(hv);
        });
        tt.live("keyup", function() {
            storeData();
            generateCSV();
        });
        // Blur textarea and prevents line break when Enter key is pressed
        tt.live("keypress", function(e) {
            if (e.keyCode === 13) {
            		$(this).blur();
          	}
        });
    }());

    // Wipe out localStorage
    (function noSubmit() {
        $("#clear_data").click(function() {
            $("tbody tr:not(#task_1)").remove();
            $(":input").val("").removeAttr("checked").removeClass(hv);
            $(".inc label").removeClass("active");
            $(".task_total, #day_total").text("00:00");
            delete localStorage.dtt;
            generateCSV();
            return false;
        });
    }());

    // Return false if form is somehow submitted
    (function noSubmit() {
        $("form").submit(function() {
            return false;
        });
    }());

    // Instructions
    (function toggleInstructions() {
        var i = $(".instructions");
        i.hide();
        // Can't use jQuery toggle() because it uses display inline
        // which messes up the layout of the instructions.
        $(".help").click(function() {
            if (i.css("display") === "none") {
                i.css("display", "block");
            } else {
                i.css("display", "none");
            }
        });
    }());

});