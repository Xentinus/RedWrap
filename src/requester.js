/* ====================================
 =      Requester.js      =
 ==================================== */

/* ==========  MODULES  ========== */

const request = require('request');
const { EventEmitter } = require('events');
const url = require('url');

/* ==========  CONSTRUCTOR  ========== */

const Requester = function (path, options = {}) {
  this.debug = options.debug;
  this.userAgent = options.userAgent || 'redwrap';

  this.ee = new EventEmitter();
  this.path = path || '/';
  this.filter = '';
  this.url = {
    protocol: 'http',
    host: 'www.reddit.com',
    pathname: `${path}.json`,
    query: options.query || {},
  };
};

Requester.prototype.setUserAgent = (userAgent) => {
  this.userAgent = userAgent;
  return this;
};

Requester.prototype.setQuery = (query) => {
  this.url.query = query;
  return this;
};

Requester.prototype.setOptions = (opts) => {
  Object.keys(opts).forEach((key) => {
    this[key] = opts[key];
  });
  return this;
};


/* ========== @REQUEST EXECUTION METHODS  ========== */

// Executes a single request
Requester.prototype.exe = function (cb) {
  const reqUrl = url.format(this.url);
  let parsedBody = '';

  const data = {
    uri: reqUrl,
    headers: {
      'User-Agent': this.userAgent,
    },
  };

  request(data, (err, res, body) => {
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      return cb(parseError, null);
    }
    return cb(err, parsedBody, res);
  });
};

// Executes multiple requests
Requester.prototype.all = function (cb) {
  const { limit } = this.url.query;
  this.url.query.limit = limit || 100; // Default max limit, 100

  cb(this.ee);

  this.collector();
};

/*
Collector calls itself recursivly to make multiple requests when
it becomes actiavted by the .all() method. It emits a data event
each time a request completes and passes the response data to the event
listener.
*/

Requester.prototype.collector = function () {
  const that = this;
  const reqUrl = url.format(that.url);
  let parsedBody = '';
  let nextAfter = '';
  let prevAfter = '';

  if (that.debug) {
    console.log(`Requesting: ${reqUrl}`);
  }

  const data = {
    uri: reqUrl,
    headers: {
      'User-Agent': this.userAgent,
    },
  };

  request(data, (error, res, body) => {
    if (error) {
      return that.ee.emit('error', error);
    }

    if (!error && res.statusCode === 200) {
      try {
        parsedBody = JSON.parse(body);
      } catch (parseError) {
        return that.ee.emit('error', parseError);
      }

      that.ee.emit('data', parsedBody, res);

      if (parsedBody.data.after) {
        nextAfter = parsedBody.data.after;
        prevAfter = that.url.query.after;
        that.url.query.after = nextAfter;

        return (nextAfter !== prevAfter) // Check to see if we are done
          ? that.collector() : that.ee.emit('end');
      }
      return that.ee.emit('end');
    }
    return null;
  });
};


/* ========== @QUERY OPTIONS  ========== */

const queries = [
  'sort',
  'from',
  'limit',
  'after',
  'before',
  'count',
];

queries.forEach((query) => {
  if (query === 'from') {
    Requester.prototype.from = function (value, cb) {
      this.url.query.t = value;
      return (cb) ? this.exe(cb) : this;
    };
  } else {
    Requester.prototype[query] = function (value, cb) {
      this.url.query[query] = value;
      return (cb) ? this.exe(cb) : this;
    };
  }
});


/* ==========  FILTERS  ========== */

const filters = [
  // User filters
  'overview',
  'comments',
  'submitted',
  'liked',
  'disliked',
  'hidden',
  'saved',
  'about',
  // Subreddit filters
  'hot',
  'new',
  'controversial',
  'top',
];

filters.forEach((filter) => {
  Requester.prototype[filter] = function (cb) {
    if (this.filter) {
      throw new Error('Only one filter can be applied to a query.');
    }

    this.filter = filter;
    this.url.pathname = `${this.path + this.filter}/.json`;

    return (cb) ? this.exe(cb) : this;
  };
});


/* ==========  EXPORTS  ========== */

module.exports = Requester;
