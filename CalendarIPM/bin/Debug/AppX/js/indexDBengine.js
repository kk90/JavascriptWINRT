

DB = (function () {
    var database = null;

    return {
        data: [],
        getAll: function () {
            DB.data = [];
            if (database != null) {
                var objectStore =
            database.transaction("notes").objectStore("notes");
                objectStore.openCursor().onsuccess = function (event) {

                    var cursor = event.target.result;
                    if (cursor) {
                        DB.data.push(cursor.value)
                        console.log(cursor.value.id);
                        cursor.continue();
                    }

                }
            };
        },
        init: function () {
            if (indexedDB) {
                const dbName = "notes_c";
                const dbVer = 1;
                var request = indexedDB.open(dbName, dbVer);

                request.onerror = function (event) {
                };

                request.onupgradeneeded = function (event) {
                    database = event.target.result;
                    if (!database.objectStoreNames.contains("notes")) {
                        var objectStore = database.createObjectStore("notes", {
                            keyPath: "id",
                            autoIncrement: false
                        });
                    }

                };

                request.onsuccess = function (e) {

                    database = e.target.result;
                    DB.getAll();

                };
            }

        },
        add: function (item) {
            if (database != null) {
                var filesObjectStore =
                  database.transaction("notes", "readwrite").objectStore("notes");
                console.log("add" + item.id);
                filesObjectStore.add(item);
            }
        },
        remove: function (item) {
            if (database != null) {
                var filesObjectStore =
                  database.transaction("notes", "readwrite").objectStore("notes");


                var request = filesObjectStore.delete("" + item.id);
                request.onsuccess = function (event) {
                    console.log("removed"+item.id);
                    DB.getAll();
                };

                request.onerror = function (event) {
                    console.log("shit..");
                    DB.getAll();
                };
            }
        }
    }
})();


function toModel(id_, object_) {
    function twoPositionNumber(num) {
        if (num < 10) {
            return "0" + num;
        } else {
            return num;
        }

    }
    function getDate(date) {
        return twoPositionNumber(date.getMonth() + 1) + '.'
                + twoPositionNumber(date.getUTCDate()) + '.'
                + date.getFullYear() + ' '
                + twoPositionNumber(date.getHours()) + ':'
                + twoPositionNumber(date.getMinutes());
    }

    return note = {
        id: id_,
        text: object_.text,
        start_date: getDate(object_.start_date),
        end_date: getDate(object_.end_date)
    }
}