'use strict'

var util = require('util')
var passport = require('passport-strategy')
var OAuth = require('citi-oauth').default
var debug = require('debug')('passport-citi')
var extend = require('xtend')

function CitiStrategy(options, verify) {
  options = options || {}

  if (!verify) {
    throw new TypeError('CitiStrategy required a verify callback')
  }

  if (typeof verify !== 'function') {
    throw new TypeError('_verify must be function')
  }

  if (!options.appId) {
    throw new TypeError('CitiStrategy requires a appId option')
  }

  if (!options.appSecret) {
    throw new TypeError('CitiStrategy requires a appSecret option')
  }

  if (!options.redirectUri) {
    throw new TypeError('CitiStrategy requires a redirectUri option')
  }

  passport.Strategy.call(this, options, verify)

  this.name = options.name || 'citi'
  this._verify = verify
  this._oauth = new OAuth(
    options.appId,
    options.appSecret,
    options.redirectUri,
    options.getToken,
    options.saveToken,
  )
  this._state = options.state
  this._scope = options.scope || 'customers_profiles'
  this._passReqToCallback = options.passReqToCallback
}

/**
 * Inherit from 'passort.Strategy'
 */
util.inherits(CitiStrategy, passport.Strategy)

CitiStrategy.prototype.authenticate = async function(req, options) {
  if (!req._passport) {
    return this.error(new Error('passport.initialize() middleware not in use'))
  }

  var self = this

  options = options || {}

  // 获取code,并校验相关参数的合法性
  // No code only state --> User has rejected send details. (Fail authentication request).
  if (req.query && req.query.state && !req.query.code) {
    return self.fail(401)
  }

  // Documentation states that if user rejects userinfo only state will be sent without code
  // In reality code equals "authdeny". Handle this case like the case above. (Fail authentication request).
  if (req.query && req.query.code === 'authdeny') {
    return self.fail(401)
  }

  // 校验完成信息
  function verified(err, user, info) {
    if (err) {
      return self.error(err)
    }
    if (!user) {
      return self.fail(info)
    }
    self.success(user, info)
  }

  // 获取code授权成功
  if (req.query && req.query.code) {
    var code = req.query.code
    debug('citi callback -> \n %s', req.url)

    try {
      const accessToken = await self._oauth.getAccessToken(code)
      debug(
        'fetch accessToken -> \n %s',
        JSON.stringify(accessToken, null, ' '),
      )

      var params = accessToken

      debug('params.scope = %s', params.scope)
      if (~params.scope.indexOf('customers_profiles')) {
        try {
          if (self._passReqToCallback) {
            self._verify(
              req,
              params['access_token'],
              params['refresh_token'],
              {},
              params['expires_in'],
              verified,
            )
          } else {
            self._verify(
              params['access_token'],
              params['refresh_token'],
              {},
              params['expires_in'],
              verified,
            )
          }
        } catch (ex) {
          return self.error(ex)
        }
      } else {
        try {
          debug('getting user by access token...')
          const profile = await self._oauth.getUserByAccessToken(
            params.access_token,
          )
          debug('profile = ', profile)

          debug('fetch userinfo -> \n %s', JSON.stringify(profile, null, ' '))

          // merge params
          params = extend(params, profile)

          try {
            if (self._passReqToCallback) {
              self._verify(
                req,
                params['access_token'],
                params['refresh_token'],
                profile,
                params['expires_in'],
                verified,
              )
            } else {
              self._verify(
                params['access_token'],
                params['refresh_token'],
                profile,
                params['expires_in'],
                verified,
              )
            }
          } catch (ex) {
            return self.error(ex)
          }
        } catch (err) {
          debug('fetch userinfo by access token error ->', err.message)
          return self.error(err)
        }
      }
    } catch (ex) {
      debug('error met: --> ', JSON.stringify(ex))
      return self.error(ex)
    }
  } else {
    var state = options.state || self._state,
      scope = options.scope || self._scope

    var location = self._oauth.getAuthorizeURL(state, scope)

    debug('redirect -> \n%s', location)
    self.redirect(location, 302)
  }
}

module.exports = CitiStrategy
