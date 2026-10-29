// Run in a fixed non-UTC timezone so local-date bugs (e.g. UTC "today") show up in tests.
export default function setup() {
  process.env.TZ = 'America/Los_Angeles'
}
