stripe listen --forward-to localhost:3000/api/stripe/webhook

TODO:

Date calcs & Mapping - Done but need to thoroughly test and check:
- Thoroughly check date calculations - with a fresh head* - seems to be working (as of checking 27/07/25).
- CSV uploads and mapping - thoroughly check

--

STRIPE:
- If I downgrade, show in the UI when the downgrade will occur - keep the user on their current plan until the billing cycle ends from stripe (also show this date in the UI).
- Changing to 'Free' shows manage subscription but there's no free option there since we don't have a free product in stripe. Maybe instead we handle this in the cancellation of plan?
- Integrate cancellations. If user has cancelled, return them to FREE plan and hide all clients and teams after the free plan limit. Consider how we do this for free users that haven't cancelled but are on the free plan.

--

UI TIME:
1. Settings > General > Coaches UI

2. Table
- Check if expanded is infact showing the next future date after the upcoming one
- Table spacing on RHS

Modals
- CSV Modal
-- Add an 'uploading' state to show user that the upload is acutally happening...
-- Fix 'add package' modal from the button on the CSV modal
- If we upload via CSV and detect more clients than the current plan allows, show this warning that only X number will be added due to plan limitations.
- There's an issue with uploaded via CSV not being assigned the coach in the table - may be a clients-table problem tho as the coach is assigned in the logged data.

--


Cleanup / Fixes:
- PRIMARY FIX: adding 2 clients without email still adds emial as null and throws error?!
- Invite notification not showing anymore - may be due to the below?...:
  - Remove invites from TeamInvites in the database if they're accepted, declined or expired

- fix all any types`
- on edit/delete client just refresh the clienttable component not the entire page.
- Errors for API endpoints when they timeout currently show a window popup but need to gracefully show a toast ui saying 'X action (like adding a team/client) has timed out due to poor connection) (error encountered on a train with poor wifi).
Add team error: [MongooseError: Operation `teams.insertOne()` buffering timed out after 10000ms]
 POST /api/teams/add-team 500 in 10996ms
Code that needs to change to toast: 'alert("Error creating team");'
- Might be calling /invites/pending api twice - once in the [id]/page.ts parent and once in the pendingInvites.tsx component.

---

Next:
- Test where we're up to thoroughly
- add reorder columns logic & ensure it persists for the team.
- Add timezone field
- Add custom field for paying users
- TeamSettingsModal > General: Add metrics (kg/lbs/cm/inch/feet)
- From the client-detail page, add a feature to 'move onto new phase' and that is then shown in the client table that they're on a new phase - talk to sophia re what this might entail content and feature wise.
