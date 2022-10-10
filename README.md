# Token Generation - Disable the refresh token

## Explanation

Token Generation is JWT Token with a "generation" system  
Required mysql database

### Generation system

All refresh tokens are created with a generation.  
All access tokens are only created when the refresh token's generation is valid.

## Install

### BASH

```bash
npm install
```

### MYSQL

```sql
CREATE TABLE generation (
  id varchar(/*what you want*/) not null,
  generation int not null
);
```

## Example

```javascript
import TokenGeneration from "./src/generation";
import crypto from "crypto";

const hmacKey = Buffer.from(crypto.randomBytes(32)); //HMAC KEY

const generation = new TokenGeneration(
  {
    host: "localhost",
    user: "(user)",
    password: "(password)",
    database: "(database)",
  },
  hmacKey
);

(async () => {
  const refreshToken = await generation.createRefreshToken("hanzikr", 20);
  const accessToken = await generation.createAccessToken(refreshToken, 30);

  if (!accessToken) throw new Error("Access token error");

  console.log(generation.tokenToString(refreshToken));
  console.log(generation.tokenToString(accessToken));

  generation.addGeneration("hanzikr"); //Disable refresh token

  //It will be null
  const accessToken2 = await generation.createAccessToken(refreshToken, 30);
  console.log(accessToken2);

  generation.close();
})();
```
