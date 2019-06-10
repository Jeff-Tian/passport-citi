# passport-citi

[![Dependencies](https://david-dm.org/liangyali/passport-citi.svg)](https://david-dm.org/liangyali/passport-citi)

[Passport](http://passportjs.org/) strategy for authenticating with [Citi Account](https://sandbox.developerhub.citi.com/get-started)

##支持功能

- 花旗 Sandbox 账号登录

## 安装

    $ npm install passport-citi

## 使用

#### Configure Strategy

```js
 passport.use(new CitiStrategy({
        appID: {APPID},
        name:{默认为wechat,可以设置组件的名字}
        appSecret: {APPSECRET},
        client:{wechat|web},
        callbackURL: {CALLBACKURL},
        scope: {snsapi_userinfo|snsapi_base},
        state:{STATE},
        getToken: {getToken},
        saveToken: {saveToken}
      },
      function(accessToken, refreshToken, profile,expires_in, done) {
        return done(err,profile);
      }
));

The `callbackURL`, `scope` and `state` can be overwritten in `passport.authenticate` middleware.

The `getToken` and `saveToken` can be provided to initialize Wechat OAuth instance.
```

#### Authenticate Requests

```js
router.get("/auth/citi", passport.authenticate("citi", options));
```

`options` - Optional. Can include the following:

- `state` - Override state for this specific API call
- `callbackURL` - Override callbackURL for this specific API call
- `scope` - Override scope for this specific API call

If no callbackURL is specified, the same request url will be used.

#### Authentication Callback

```js
router.get(
  "/auth/citi/callback",
  passport.authenticate("citi", {
    failureRedirect: "/auth/fail",
    successReturnToOrRedirect: "/"
  })
);
```

## License

Copyright (c) 2014 liangyali  
Licensed under the MIT license.
