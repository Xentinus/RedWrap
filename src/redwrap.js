const Requester = require('./requester');

const redwrap = {};

redwrap.options = {};

redwrap.setUserAgent = (userAgent) => {
  redwrap.options.userAgent = userAgent;
  return redwrap;
};

redwrap.setQuery = (query) => {
  redwrap.options.query = query;
  return redwrap;
};

redwrap.setOptions = (opts) => {
  Object.keys(opts).forEach((key) => {
    redwrap.options[key] = opts[key];
  });
  return redwrap;
};

// Request user data
redwrap.user = (username, cb) => {
  const path = `/user/${username}/`;
  const requester = new Requester(path, redwrap.options);

  return (cb) ? requester.exe(cb) : requester;
};

// Request subreddit data
redwrap.r = (subreddit, cb) => {
  const path = `/r/${subreddit}/`;
  const requester = new Requester(path, redwrap.options);

  return (cb) ? requester.exe(cb) : requester;
};

// Lists reddit front page filters
redwrap.list = (filter, cb) => {
  let path = '';
  let requester = '';

  if (filter) {
    path = `${filter}/`;
    requester = new Requester(path, redwrap.options);
  } else {
    requester = new Requester(null, redwrap.options);
  }

  return (cb) ? requester.exe(cb) : requester;
};

module.exports = redwrap;
