function loadevents(delay) {
    
    setTimeout(function () {

        //your code to be executed after 1 seconds

        var list = document.getElementById("taskList");
        list.innerHTML = "";
        var a = DB.data;
        for (var i = 0; i < a.length; i++) {
            var item = document.createElement("h3");
            item.innerHTML = i + ". " + a[i].text + "   " + a[i].start_date;
            console.log(a[i].text);
            list.appendChild(item);
        }
    }, delay);

}


(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            DB.init();
            loadevents(300);
            

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

function removefirst() {

    console.log("test");
    DB.remove(DB.data[0]);
    loadevents(300);
};

function addone() {
    DB.add(toModel(+new Date(),{
        text: document.getElementById("addTask").value,
        start_date: new Date(),
        end_date: new Date()
    }));

    setTimeout(function () {
        DB.getAll();
        loadevents(300);
    }, 300);
    


    

}