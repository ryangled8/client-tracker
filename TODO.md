TODO:

Date calcs:
- Thoroughly check date calculations - with a fresh head*

Managing Clients:
- adding a client throws error if there are no plans.
- move editclient logic into new file - clienttable is too big now.
- on edit/delete just refresh the clienttable component not the entire page.
- Updating the package name clears all of the dates for the clients that had that package assigned to them. Updaing package durations, intervals and colour does not affect the table like editing the name does.

Managing Packages:
- Add recurring as an option in create package which doesn't calculate an end date. Plan this out in AI.

*Once the above is done ^:*
- Add a 'coach colour' section in team settings and style the coach name in the table to the chosen colour and same tag style as the plan name - use the same colour pallete options from the training-plans modal.
- Set phone to false by default on add client


Cleanup / Fixes:
- Remove invites from TeamInvites in the database if they're accepted, declined or expired
- Fix descendent html errors in confrim delete team 
- id/page.tsx: Property 'planColor' does not exist on type '{ planName: string; planDuration: number; planProgressCall: number; planRenewalCall: number; planUpdateWeek: number; isActive: boolean; createdAt: string; }'.ts(2339)
- fix all any types

---

Next:
- Test where we're up to thoroughly
- From the client-detail page, add a feature to 'move onto new phase' and that is then shown in the client table that they're on a new phase - talk to sophia re what this might entail content and feature wise.
