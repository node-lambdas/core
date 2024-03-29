# @node-lambdas/core

The code behind all node-lambdas

## Introduction

Lambdas are functions that receive an input and generate an output over HTTP requests.

Each function has its own web address and works like a regular server.
Behind that address is a tiny app that transforms an input into something else.

## Examples

The simplest function just prints its input back to the output:

```ts
// index.mjs
export default function sendInputBack(input, output) {
  input.pipe(output);
}
```

A more useful example: create a hash from the input text

```ts
import { createHash } from 'node:crypto';

export default {
  version: 2,
  description: 'Create a hash from the input. Set the "type" option to any Node.js hash algorithm, like sha256',
  actions: {
    createHash: {
      default: true,
      options: {
        type: 'algorithm',
      },
      handler(input, output) {
        const type = input.options.type || 'sha256';
        const hash = createHash(type);
        input.on('data', c => hash.update(c));
        input.on('end', () => output.sendText(hash.digest('hex')));
      }
    }
  }
}
```

## Function Configurations

To allow multiple actions in a single cloud function, and allow for options, the API prefers
an object as a default export. For example:

```ts
import { V2Request, V2Response } from '@node-lambdas/core';

// index.js
export default {
  version: 2,
  actions: {
    echo: {
      default: true,
      handler: (input: V2Request, output: V2Response) => input.pipe(output),
    },
  },
};
```

This function is invoked calling `POST https://echo.jsfn.run/` with any content.
The data is just sent back as a stream.

## Input/Output

A lambda handler function will receive two arguments, `input` and `output`, which are just Node.js [request](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [response](https://nodejs.org/api/http.html#http_class_http_serverresponse) objects from an incoming request.

They have a few extra properties:

#### `request.body`

| input type  | request.body |
| ----------- | ------------ |
| text        | string       |
| json        | object       |
| buffer      | Buffer       |
| - not set - | undefined    |

If not set, the request data won't be read from stream.
Use `request.on('data')` and `request.on('end')` to read the input in the action.

#### response output (via output.send(response))

| output type | response body |
| ----------- | ------------- |
| text        | string        |
| json        | JSON string   |
| buffer      | binary output |
| - not set - | binary output |

In `v1` only one input/output format can be specified
In `v2`, each action can specify a different input/input/output format.

#### `request.options`

In `v2`, options are parsed from the query string parameters sent by the incoming HTTP request.

For example, consider a call to function `foo` with `POST /action?alice=1&bob=2`. Then `request.options` will be an object like `{ alice: 1, bob: 2 }`

#### `request.parsedUrl`

Since `v2`.
This is set to an instance of [URL](https://nodejs.org/api/url.html#url_the_whatwg_url_api) parsed from `request.url`.

---

## Configuration object

### v1

Accepts a configuration object and a simple handler function.

```javascript
function textToJson(input, output) {
  const textInput = input.body;
  const jsonOutput = { text: textInput };

  output.sendJson(jsonOutput);
}

export default {
  version: 1,
  input: 'text',
  output: 'json',
  handler: main,
};
```

### v2

Accepts multiple actions in a single lambda.
One of the actions can be marked as default.

```javascript
import { lambda, Format } from '@node-lambdas/core';

// encode text as JSON
function encode(text) {
  return { text };
}

// decode JSON back to text
function decode(json) {
  return json.text;
}

const configuration = {
  version: 2,
  description: '',
  actions: {
    encode: {
      default: true,
      input: 'text',
      output: 'json',
      handler: (input, output) => output.send(encode(input.body)),
    },

    decode: {
      input: 'json',
      output: 'text',
      handler: (input, output) => output.send(decode(input.body)),
    },
  },
};

export default configuration;
```

## Functions API

A function handler receives two arguments, `input` and `output`.

They are the same instances of a normal Node.JS HTTP server, with some additional properties:

```ts
interface Request extends IncomingMessage {
  id: string;
  input: 'text' | 'json' | 'buffer';
  body: string | object | Buffer;
  credentials: Record<string, string>;
  options: Record<string, string>;
  asText(): Promise<string>;
  asJson(): Promise<any>;
  asBuffer(): Promise<Buffer>;
}

interface Response extends ServerResponse {
  id: string;
  request: Request;
  output: 'text' | 'json' | 'buffer';

  header(name: string, value: string): void;
  send(body: any): void;
  send(status: number, body: any): void;
  reject(message: string): void;
  pipeTo(nextCommand: string, args: string[]): void;
  sendText(b: string): void;
  sendJson(b: any): void;
  sendBuffer(b: Buffer): void;
}
```

## Version history

`v1`

First version. Just process input and send back an output.

`v2`

- Add support for multiple actions and different input/output formats per action.
- Parses the incoming URL
- adds `request.options` and `request.credentials`
