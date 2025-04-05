// filter requests by target
// redirect if css file
function onRequest(e) {
    var rc = {};

    // in practice, compare e.url to more than one value
    console.log(e.url)
    if (e.url.endsWith(".css")) {

        // Get color data
        let temp = localStorage.getItem("ScratchColorData")
        let data
        if (temp) {
            data = JSON.parse(temp)
        } else {
            data = {
                "s3lc": "#4c97ff",
                "s3dc": "#3875ca",
                "s2lc": "#0f8bc0",
                "s2dc": "#0c6185"
            }
        }
        console.log(data)

        // Request css file synchronously
        const request = new XMLHttpRequest();
        request.open("GET", e.url, false); 
        request.send(null)
        let t = request.responseText
        console.log("before", t)

        // Replace colors
        t = t.replaceAll("hsl(260,60%,60%)", data.s3lc)//"#4c97ff")
        t = t.replaceAll("hsl(260,46%,54%)", data.s3dc)//"#3875ca")
        t = t.replaceAll("#855cd6", data.s2lc)//"#0f8bc0")
        t = t.replaceAll("#7854c0", data.s2dc)//"#0c6185")

        // Make images use absolute paths
        let p = e.url
        p = p.slice(0, p.lastIndexOf("/"))
        console.log("path", p)
        while (t.includes('url(')) {
            let start = t.indexOf('url(') + 4
            let end = start + t.slice(start + 4).indexOf(')') + 4
            let path = t.slice(start, end)
            let quotes = false
            if (path.startsWith('"')) {
                quotes = true
                path = path.slice(1, path.length - 1)
            }
            let finalPath
            if (path.startsWith("/")) {
                finalPath = new URL(e.url).origin + path
            } else {
                finalPath = p + "/" + path
            }
            console.log(finalPath)
            if (quotes) {
                finalPath = '"' + finalPath + '"'
            }
            let url = `uri(${finalPath})`
            console.log(url)
            t = t.replace(t.slice(start - 4, end + 1), url)
        }

        t = t.replaceAll("uri(", "url(")

        console.log("after", t)
        let finalURL = `data:text/css;base64,${Base64.encode(t)}`
        console.log("final url", finalURL.toString())

        rc = { redirectUrl: finalURL};
    }
    return rc;
}
chrome.webRequest.onBeforeRequest.addListener(
    onRequest,
    {
        types: ["stylesheet"],
        urls: ["https://*.scratch.mit.edu/*"],
    },
    ["blocking"]
);


/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info
*
**/
var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

    // public method for encoding
    , encode: function (input)
    {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length)
        {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2))
            {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3))
            {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        } // Whend 

        return output;
    } // End Function encode 


    // public method for decoding
    ,decode: function (input)
    {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length)
        {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64)
            {
                output = output + String.fromCharCode(chr2);
            }

            if (enc4 != 64)
            {
                output = output + String.fromCharCode(chr3);
            }

        } // Whend 

        output = Base64._utf8_decode(output);

        return output;
    } // End Function decode 


    // private method for UTF-8 encoding
    ,_utf8_encode: function (string)
    {
        var utftext = "";
        string = string.replace(/\r\n/g, "\n");

        for (var n = 0; n < string.length; n++)
        {
            var c = string.charCodeAt(n);

            if (c < 128)
            {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048))
            {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else
            {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        } // Next n 

        return utftext;
    } // End Function _utf8_encode 

    // private method for UTF-8 decoding
    ,_utf8_decode: function (utftext)
    {
        var string = "";
        var i = 0;
        var c, c1, c2, c3;
        c = c1 = c2 = 0;

        while (i < utftext.length)
        {
            c = utftext.charCodeAt(i);

            if (c < 128)
            {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224))
            {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else
            {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        } // Whend 

        return string;
    } // End Function _utf8_decode 

}