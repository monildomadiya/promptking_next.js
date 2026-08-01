// Where the header's prompt controls are allowed to exist.
//
// The search box and the premium toggle don't do anything on their own — they
// drive the `search`/`filter` state that PromptList reads, and the home route is
// the only one that renders PromptList. (/category/[slug] ships its own
// server-rendered grid and never looks at that state.) So anywhere else the
// controls would be filtering a grid that isn't on the page: previously they
// stayed in the header and quietly bounced the user back to / when used.
//
// One predicate, two consumers: the header renders the controls only where this
// is true, and AppContext drops the search term and filter when it stops being
// true, so a stale filter can't follow the user off the page and back.
export const isPromptGridPath = (pathname) => {
  const path = (pathname || '/').split('?')[0].replace(/\/+$/, '');
  return path === '';
};

export default isPromptGridPath;
