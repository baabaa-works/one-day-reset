// Public configuration, never an API secret. External transmission stays off
// until the site owner approves privacy changes and supplies a website ID.
window.RESET_ANALYTICS_CONFIG = Object.freeze({
  enabled: false,
  websiteId: '',
  hostname: 'baabaa-works.github.io',
  pathname: '/one-day-reset/',
  campaigns: ['snapshot', 'launch_202610', 'evergreen'],
  contents: ['question_card', 'personal_card', 'threads_question_01', 'threads_action_01', 'ig_question_01', 'post-a', 'post-b', 'post-c', 'post-d', 'post-e'],
  shortLinks: {'th-a':{source:'threads',campaign:'snapshot',content:'post-a'},'th-b':{source:'threads',campaign:'snapshot',content:'post-b'},'ig-a':{source:'instagram',campaign:'snapshot',content:'post-a'}}
});
