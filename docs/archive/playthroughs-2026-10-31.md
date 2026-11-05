# Three short careers — October 31, 2026

Played experimental.7 at `692bcf56aa583be71e31937f67c777d0bc97050b`. These are observation-limited scripted careers through the actual game, not the earlier fixture-assisted contract tests. No gameplay changes were made during the exercise.

## Method and limits

One fresh game per starting hull, with normal starting crew, money, equipment and world generation. Debug stayed off. The pilot used native movement, scanning, landing, interactions, shopping, inventory controls, dialogue, retreat and surrender. It did not assign resources, teleport, suppress enemies or force mission completion. UI selection fields were used to select actual available menu options. Decisions used revealed maps, visible enemies, inventory/crew information and published leads; they did not use undiscovered objective positions or enemy locations to plan routes.

The harness supplied a seeded random stream for reproducibility; the game's own market seed is not a complete world seed. Seeds were fixed in advance: Scout 104729, Freighter 130363, Corvette 155921. Different seeds and policies mean these results are not a controlled comparison of hull balance. No outcome was reversed by loading a save.

These were deliberately short careers. The pilot elected early retirement after sufficient outings/actions, after delivering two survivors on the rescue route, or if returning with critically low funds. A 1,000-action safety ceiling existed but none of the three final runs reached it. Two runs ended through the real retirement confirmation, and the third through ship destruction. None reached the 10,000-credit rich-retirement goal.

During controller calibration, the pilot incorrectly tried to equip while still docked and treated diagonal survivor proximity as valid interaction range. Those attempts generated failed commands or unwanted purchases. The policy was corrected to equip after undocking, approach survivors cardinally and reset the per-visit return decision on reboarding. The final three runs replayed the same predetermined seeds with those valid controls. Calibration traces were retained locally and are not counted as additional independent careers.

All three final runs completed without captured JavaScript/input errors. This checks sampled paths; it does not establish full game coverage, human enjoyment or statistical balance. In particular, the Corvette rescue route did not exercise its ship guns, and the pilot's late-surrender and limited airlock-wait policies affected outcomes.

| Career | Turns | Pilot actions | Ending | Credits remaining | Crew and ship |
| --- | ---: | ---: | --- | ---: | --- |
| Light Scout, Far Lantern | 325 | 370 | Voluntary early retirement | 993 | Four crew healthy; hull 100/100 |
| Bulk Freighter, Quiet Profit | 194 | 265 | Destroyed after refused surrender | 84 | Hull 0/120, fuel zero; three crew still listed when the ship was lost |
| Attack Corvette, Second Chance | 260 | 290 | Voluntary early retirement | 462 | Three crew healthy; hull 110/110 |

Pilot actions and global turns differ because menus, existing interaction rules and ship combat do not all advance the global clock. This exercise did not change the clock inconsistency found in the foundation review.

## Mara Vale — Light Scout Far Lantern

I began with 500 credits and four crew. Docking paid 30 credits in wages. I took the offered science contract, which required five alien corpses, then bought a 150-credit handgun and equipped the captain after undocking. That left 320 credits before the first flight.

The nearest revealed derelict was Mercy of Dawn, so the survey career began with an incidental rescue. I opened the bridge route, met Mira, escorted her to the airlock and delivered her to Starbase Alpha on turn 20. The relief fund paid 100 credits. I did not complete the wreck or repair its life support on this route.

I then explored and scanned systems, reaching Waypoint Omega. By turn 62 I had sold only 14 credits of survey data and was down to 366 credits after fuel and wages. The opening was financially slow.

The surface trips made the difference. I landed on Gemma I, a desert world, and later Melvorn III, a frozen world. I collected natural samples and identified ore with the scientist. Since the Scout had no cargo capacity or drill, the identified deposits were survey discoveries rather than a bulk-mining income stream. Oxygen warnings and the planned trip back to the ship constrained surface travel.

The turn-192 return sold 224 credits of surveys and 195 of samples. The final return on turn 325 sold another 164 in surveys and 210 in samples, plus a 20-credit survey bonus. I refuelled and chose early retirement with 993 credits, a net cash increase of 493 from the starting 500. All four crew were healthy and the hull was intact. The game counted eight scanned planets; this is its counter, not a claim that eight planets were fully explored on foot.

The five-corpse contract remained unfinished because the pilot avoided a combat livelihood. The retirement grade was **Broke & Stranded**, seven credits below the next cash tier. That was a consequence of the simulation's early-retirement decision, not an inability to keep playing.

What this shows: surveying and collecting samples funded a cautious Scout in this particular sector. It was a gradual career, and the scientist mattered. It does not establish the income rate or danger of a complete rich-retirement run.

## Elias Voss — Bulk Freighter Quiet Profit

I started with the mysterious delivery package, three crew and no ship weapons. Wages cost 20 credits. I bought and equipped the same 150-credit personal handgun; that protected the away team, not the freighter's hull. Keeping a cash reserve limited the first speculative purchase to one unit of microelectronics.

The first haul to Waypoint Omega reached turn 59. Delivering the package paid 300 credits. The microelectronics sold for 125, a 14-credit commodity margin. I learned the destination's actual prices there, then used both stations' observed price lists to choose subsequent cargo.

Three encrypted drives bought at 139 credits each sold at Alpha for 184 each: a 135-credit commodity margin before travel costs. A later nebula crystal bought for 270 sold at Omega for 544, a 274-credit margin. Trading opportunities were present and profitable before fuel, wages, repairs and losses.

Pirates changed the run. Interceptions began during the third crossing. Repeated retreats escaped individual encounters but consumed fuel and did not guarantee a clear route afterward. I reached Omega on turn 172 with only 35 fuel and 76/120 hull. Four repair purchases restored the hull to 116, and refuelling cost 116 credits. After buying the next cargo I had only 168 credits left.

The next crossing produced another chain of interceptions. Across the career the pilot attempted 25 ship retreats. It kept prioritizing escape until fuel was nearly gone, then surrendered on turn 192. Pirates took 84 credits and emptied the hold. The ship was then out of fuel; I activated SOS. Another interception followed, surrender was refused, and the hull was destroyed on turn 194 with 84 credits remaining.

The logs use the generic name Raider Frigate for these encounters. They do not establish that the final attacker was the same individual that accepted payment, so this report does not claim a pirate violated its surrender cooldown.

What this shows: commodity margins alone did not protect the trading career. Escape fuel, repair bills and pursuit were decisive. My policy surrendered late and bought cargo aggressively after repairs; earlier surrender, different routing, lower exposure or ship upgrades could change the outcome. This one failed career does not prove the Freighter is unviable. Re-interception feedback and practical escape options deserve further examination.

## Rin Calder — Attack Corvette Second Chance

This captain concentrated on Mercy of Dawn rather than pursuing the offered ancient-artifact contract. Starting wages and the personal handgun left 330 credits. I made four rescue outings from nearby Alpha, keeping all three crew alive.

The first outing found Mira, escorted her aboard and delivered her on turn 28 for 100 credits. On the next visit I read the bridge roster and engineering report, which identified Rowan, Ilya and the failed pump. The engineer built a bypass over turns 60–62, stabilizing life support before the reserve ran out. Later I recovered the medical supplies and the spare coupling; the coupling was no longer necessary for the completed bypass.

The third outing found injured Rowan. I used the recovered medical supplies to stabilize his leg, then led him back toward the airlock. I also reconnected the isolation scrubber. The pilot departed after its limited waiting period before Rowan completed his transfer, leaving him on the persistent wreck. That extra ferry trip was a pilot decision, not a failed delivery or missing save.

I returned, assisted Rowan again and brought him aboard on turn 256. Alpha received him on turn 260 and paid another 100 credits. I retired early with 462 credits, full hull and healthy crew. The relief payments totalled 200; wages and refuelling cost 88, and the retained handgun had cost 150, explaining the 38-credit cash decline. That decline does not mean the rescue itself failed to cover its travel costs.

I did not reach Ilya's isolation room before choosing retirement. Separate post-run inspection confirms he remained alive and waiting on the repaired wreck; that hidden state was not used to guide the pilot. The two completed deliveries and repaired life support appeared in the career record.

What this shows: repair, supplies, escort, departure, return and station handoff connected successfully. Supporting a follow-up visit was valuable. Escort pacing and explicit boarding confirmation deserve human testing, especially when diagonal player movement can outpace a cardinal-moving follower. This was a partial rescue, not a complete clearance of Mercy of Dawn.

## Assessment after these careers

- The game produced different stories without adding encounters: an incidental rescue followed by survey work, profitable cargo routes ruined by pursuit, and a repair/medical rescue with return visits.
- The Scout sample economy worked in its sampled sector. The Freighter's financial risk depended on survival costs, not just the nominal market spread. The rescue career retained useful equipment and helped people without producing a large cash windfall.
- Initial science jobs did not match the chosen policies: corpses for the surveyor, biodata for the trader and an artifact for the rescuer. All stayed unfinished. The pilot also chose not to relinquish them; that is a limitation of this policy, not evidence that contracts cannot be completed. Offer selection and guidance are worth watching in human playtests.
- Pursuit and escape need targeted follow-up with both competent early surrender and different route/upgrade policies. One fatal late-surrender policy is insufficient evidence for a numerical combat rebalance.
- The endings still emphasize cash tiers. The known Unknown Captain field issue was visible, and the broader narrative account remains less specific than the actual play history, although the rescue summary reflects delivered survivors and pump repair.
- The autosave indicator reached the correct final turn for each run. No reloads were used to undo outcomes. Corruption/recovery resilience was checked separately in the autosave work, not established by these careers alone.

Local deliverables include full action/event traces, ending screenshots and exported final-state JSON files. The private pilot harness remains outside the public source tree. No gameplay edits or balance adjustments were made in response to these three samples.
