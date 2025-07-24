1. Rename plans to packages.

2. To calculate the  should use date-fns to cal

2. When I edit a plan that a client is assigned to, it's not updating in the client table.
If I change a plan name, colour, or all other details, this should reflect on the client's that are associted with this plan.



--
2. Add a 'coach colour' section in team settings and style the coach name in the table to the chosen colour and same tag style as the plan name - use the same colour pallete options from the training-plans modal.
3. id/page.tsx: Property 'planColor' does not exist on type '{ planName: string; planDuration: number; planProgressCall: number; planRenewalCall: number; planUpdateWeek: number; isActive: boolean; createdAt: string; }'.ts(2339)
--
4. Remove invites from TeamInvites if they're accepted, declined or expired
5. Set phone to false by default on add client
6. Fix descendent html errors in confrim delete team 
