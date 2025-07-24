
1. To calculate the  should use date-fns to cal - not working.

2. move editclient logic into new file - clienttable is too big now.

3. adding a client throws error if there are no plans.
2. on edit/delete just refresh the clienttable component not the entire page.
3. Updating the package name clears all of the dates for the clients that had that package assigned to them. Updaing package durations, intervals and colour does not affect the table like editing the name does.

6. Add recurring as an option in create package which doesn't calculate an end date. Plan this out in AI.
5. From the client-detail page, add a feature to 'move onto new phase' and that is then shown in the client table that they're on a new phase - talk to sophia re what this might entail content and feature wise.

--
2. Add a 'coach colour' section in team settings and style the coach name in the table to the chosen colour and same tag style as the plan name - use the same colour pallete options from the training-plans modal.
3. id/page.tsx: Property 'planColor' does not exist on type '{ planName: string; planDuration: number; planProgressCall: number; planRenewalCall: number; planUpdateWeek: number; isActive: boolean; createdAt: string; }'.ts(2339)
--
4. Remove invites from TeamInvites if they're accepted, declined or expired
5. Set phone to false by default on add client
6. Fix descendent html errors in confrim delete team 
