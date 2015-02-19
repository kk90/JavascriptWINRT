describe("Date converter", function () {
    it("sate conversion", function () {
        var examplestart = new Date(1995, 11, 17, 3, 24, 0);
        var exampleend = new Date(1995, 11, 17, 4, 24, 0);
        
        var testcalendarobject = {
            start_date: examplestart,
            end_date: exampleend,
            text: "test"
        }

        var model = toModel(1,testcalendarobject);

        expect(model.start_date).toBe("12.17.1995 03:24");
        expect(model.end_date).toBe("12.17.1995 04:24");
        expect(model.text).toBe("test");
    });
});

//describe("Data base", function () {
//    DB.init();
//    beforeEach(function (done) {
//        setTimeout(function () {
            
//            done();
//        }, 1000);
//    });

//    it("saving data", function () {
        
   
//    expect(DB.data.length).toBe(1);
   

        //var testitem = {
        //    id: "123",
        //    text: "123",
        //    start_date: "12.17.1995 03:24",
        //    end_date: "12.17.1995 04:24"
        //}

//        DB.add(testitem);

//        DB.getAll();
//        expect(DB.data.length).toBe(1);

//        done();

//    });
//});