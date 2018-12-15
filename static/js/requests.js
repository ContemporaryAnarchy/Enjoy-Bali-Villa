let getRandomIntegers = function() {
    console.log('working')

    var request = {
        "jsonrpc": "2.0",
        "method": "generateIntegers",
        "params": {
            "apiKey": "3496c702-4df4-473d-9760-95f14679f5fc",
            "n": 6,
            "min": 1,
            "max": 6,
            "replacement": true
        },
        "id": 1
    }
    
    var jsonRequest = JSON.stringify(request)

    $.ajax({
        type: "POST",
        url: "https://api.random.org/json-rpc/1/invoke",
        contentType: 'application/json',
        data: jsonRequest,
        success: function (response) {
            console.log(response)                           
        }
    });

}
