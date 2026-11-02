# Dungeon Joe — TODO (deferred within the build)

Items deferred during a session, with the reason. Every item is picked up before the build is called done
(BUILD_BRIEF §0). Empty means nothing is deferred.

**Nothing is deferred.** The engine gaps the zone content pass reported were fixed before M8 (commit acc7e8a);
the approximations made while building are recorded as decisions (D41–D71), and the known limits are in the
README.

Not built, by choice (recorded so nobody looks for them):

- The optional in-game text chat (NETCODE §3 lists it as optional): the protocol carries `chat`, there is no
  chat box.
- Balance against human play: the bot harness cannot stand in for a competent player at bosses
  (docs/BALANCE_REPORT.md); tuning past the two fixes in D71 waits for the owner's play (docs/OWNER_CHECKS.md).
