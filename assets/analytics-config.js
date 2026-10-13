// Public configuration, never an API secret. External transmission stays off
// until the site owner approves privacy changes and supplies a website ID.
window.RESET_ANALYTICS_CONFIG = Object.freeze({
  enabled: false,
  websiteId: '',
  hostname: 'baabaa-works.github.io',
  pathname: '/one-day-reset/',
  campaigns: ['snapshot', 'launch_202610', 'evergreen'],
  contents: ['question_card', 'personal_card', 'threads_question_01', 'threads_action_01', 'ig_question_01', 'post-a', 'post-b', 'post-c', 'post-d', 'post-e', 'post-a-reply', 'post-b-reply', 'post-c-reply', 'post-d-reply', 'post-e-reply'],
  shortLinks: {'th-a':{source:'threads',campaign:'snapshot',content:'post-a'},'th-b':{source:'threads',campaign:'snapshot',content:'post-b'},'th-c':{source:'threads',campaign:'snapshot',content:'post-c'},'th-d':{source:'threads',campaign:'snapshot',content:'post-d'},'th-e':{source:'threads',campaign:'snapshot',content:'post-e'},'ig-a':{source:'instagram',campaign:'snapshot',content:'post-a'},'f':{source:'share',medium:'friend',campaign:'snapshot',content:'question_card'}}
});
