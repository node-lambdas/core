import { lambda as v1, Configuration as V1Configuration } from './v1.mjs';
import { lambda as v2, Configuration as V2Configuration, V2Request } from './v2.mjs';

export { Format, uid } from './common.mjs';
export { Console } from './console.mjs';
import { Request, Response } from './http.mjs';

export { V1Configuration, V2Configuration, V2Request, Response as V2Response, Request, Response };

export function lambda(configuration: V1Configuration): void;
export function lambda(configuration: V2Configuration): void;
export function lambda(configuration: V1Configuration | V2Configuration) {
  switch (configuration.version || 1) {
    case 1:
      return v1(configuration as V1Configuration);

    case 2:
      return v2(configuration as V2Configuration);
  }
}


async function main() {
  // @ts-ignore
  const fn = await import(process.env.FN_PATH);
  lambda(fn.default);
}

main();