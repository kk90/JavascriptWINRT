// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/calendar/calendar.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            init();
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in layout.
        }
    });
})();


function init() {
    DB.init();

    scheduler.config.multi_day = true;
    scheduler.config.details_on_create = true;
    scheduler.config.details_on_dblclick = true;
   
    scheduler.init('scheduler_here');
    var delay = 300;//1 seconds
    setTimeout(function () {

        //your code to be executed after 1 seconds
   
    var a = JSON.stringify(DB.data);
    scheduler.parse(a, 'json');
    }, delay);
    

}


scheduler.attachEvent("onEventDeleted", function (event_id, event_object) {
    var note = toModel(event_id, event_object);
    DB.remove(note);

});

scheduler.attachEvent("onEventChanged", function (event_id, event_object) {
    var note = toModel(event_id, event_object);
    //noteService.updateNote(note);
});

scheduler.attachEvent("onEventAdded", function (event_id, event_object) {
    var note = toModel(event_id, event_object);
    DB.add(note);
});

function show_minical() {
    if (scheduler.isCalendarVisible())
        scheduler.destroyCalendar();
    else
        scheduler.renderCalendar({
            position: "dhx_minical_icon",
            date: scheduler._date,
            navigation: true,
            handler: function (date, calendar) {
                scheduler.setCurrentView(date);
                scheduler.destroyCalendar()
            }
        });
}