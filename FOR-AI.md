
Client table:
1. To calculate the  should use date-fns to cal
2. on edit/delete just refresh the clienttable component not the entire page.
3. Updating packages doesn't refresh and reflesct in the table (changes do reflect in the packages UI however). Can we elegantly refresh only the client table to show the updated data?



--
2. Add a 'coach colour' section in team settings and style the coach name in the table to the chosen colour and same tag style as the plan name - use the same colour pallete options from the training-plans modal.
3. id/page.tsx: Property 'planColor' does not exist on type '{ planName: string; planDuration: number; planProgressCall: number; planRenewalCall: number; planUpdateWeek: number; isActive: boolean; createdAt: string; }'.ts(2339)
--
4. Remove invites from TeamInvites if they're accepted, declined or expired
5. Set phone to false by default on add client
6. Fix descendent html errors in confrim delete team 
