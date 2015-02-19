(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            DB.init();
            var delay = 300;//1 seconds
            setTimeout(function () {

                //your code to be executed after 1 seconds

                var list=document.getElementById("taskList");

                var a = DB.data;
                a.length
                for (var i = 0; i < a.length; i++) {
                    var item = document.createElement("h3");
                    item.innerHTML = i+". "+a[i].text + "   " + a[i].start_date;
                    console.log(a[i].text);
                    list.appendChild(item);
                }
            }, delay);

        },

        goToCallendar:function(){
            var nav = WinJS.Navigation;
            nav.navigate("/pages/calendar/calendar.html");
        }
    });
})();


function goToCallendar(){
    var nav = WinJS.Navigation;
    nav.navigate("/pages/calendar/calendar.html");
}