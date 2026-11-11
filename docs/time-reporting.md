# Parallel time reporting

The elapsed calendar is a reporting clock. Every existing gameplay turn, NPC response, oxygen/fuel cost, injury tick, deadline, reload and planetary daylight update retains its original behavior. Adding 30 reporting minutes does not run 30 turns or advance a single gameplay timer. Menus do not measure wall-clock time.

| Committed action | Reported time |
| --- | ---: |
| Galaxy travel, waiting or fuel scooping | 1 hour |
| Orbital scan or other orbital turn | 10 minutes |
| Surface movement, waiting or exploration/interior work | 5 minutes |
| Ground/ship combat action (including tactical waiting) | 1 minute |
| Field repair or improvised repair attempt, any outcome | 15 minutes |
| Paid casino event | 30 minutes |
| Docking at a major station or casino | 15 minutes |
| Planet landing or liftoff | 15 minutes |
| Successful station refuel, hull/core repair or core/hull upgrade | 30 minutes |
| Other successful station transactions | 5 minutes |
| Menus, inspection, rejected actions, completed-scan previews | Free |

Station transactions add reporting time without introducing gameplay turns. Casino-deck walking is station time; artificial stations/derelicts/quarantine interiors are interior time; caves and underwater exploration remain planet time. Land/launch transit is space time, except casino undocking, which is station time. Space includes tactical ship combat; activities are an independent breakdown and must not be added to location totals. The first version is intentionally coarse: dialogue and actions that previously consumed no turn remain free unless listed as docking, transit or successful station services.

The HUD keeps TURN and adds ELAPSED (`D1 00:00` at career start). A standard day is 24 hours; reporting months are fixed 30-day blocks. The LOCAL planet dial maps the existing daylight cycle onto 24 solar hours: dawn 06:00, peak day 12:00, dusk 18:00 and peak night 00:00. Local hours are normalized solar hours, not standard ship hours. This preserves different biome day lengths and the old off-world pause, combat/daylight advancement and special fixed-light environments. No local solar clock is invented for indoor maps or caves.

LOG → RECORDS includes elapsed/location totals. Retirement records include elapsed career length, location totals, combat and repair time; the ordinary death report includes elapsed/location totals. Older careers without time data begin accumulating reporting time from their next action; earlier turns are not reconstructed. Start a new career for full-career totals.

The implementation is in `src/actions/calendar.js`. `G.careerTime` saves minutes and independent location/activity totals; parsing rejects malformed or inconsistent totals before installing a save. Clock state is never read by gameplay rules. Default durations derive from the underlying location rather than an inventory overlay; repair and combat actions pass explicit activity names. Debug careers retain ordinary isolation from real career saves.
