TODO:

Date calcs:
- Thoroughly check date calculations - with a fresh head* - seems to be working (as of checking 27/07/25).

Managing Clients:
- adding 2 clients without email still adds emial as null and throws error?!
- adding a client throws error if there are no plans.
- add reorder columns logic & ensure it persists for the team.
- add a minimal / relaxed table view options which increase/descrease padding/row heights - ensure chioce is persisted.

Managing Packages:
- Set 'phone' to false by default on add client and add a 'Payment date' option above 'Gender'.
- If I try add a client to a team before there's any packages, I get this error:
Error: A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.

src/components/ui/select.tsx (107:5) @ SelectItem


  105 | }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  106 |   return (
> 107 |     <SelectPrimitive.Item
      |     ^

Please fix.

*Once the above is done ^:*
- Add a 'coach colour' section in team settings and style the coach name in the table to the chosen colour and same tag style as the plan name - use the same colour pallete options from the training-plans modal.


Cleanup / Fixes:
- Remove invites from TeamInvites in the database if they're accepted, declined or expired
- Fix descendent html errors in confrim delete team 
- id/page.tsx: Property 'planColor' does not exist on type '{ planName: string; planDuration: number; planProgressCall: number; planRenewalCall: number; planUpdateWeek: number; isActive: boolean; createdAt: string; }'.ts(2339)
- fix all any types
- on edit/delete client just refresh the clienttable component not the entire page.
- Errors for API endpoints when they timeout currently show a window popup but need to gracefully show a toast ui saying 'X action (like adding a team/client) has timed out due to poor connection).
Add team error: [MongooseError: Operation `teams.insertOne()` buffering timed out after 10000ms]
 POST /api/teams/add-team 500 in 10996ms
Code that needs to change to toast: 'alert("Error creating team");'

---

Next:
- Test where we're up to thoroughly
- From the client-detail page, add a feature to 'move onto new phase' and that is then shown in the client table that they're on a new phase - talk to sophia re what this might entail content and feature wise.
