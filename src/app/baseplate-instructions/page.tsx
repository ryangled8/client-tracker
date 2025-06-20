import React from "react";

export default function BaseplateInstructions() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-neutral-800 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Next.js Auth + MongoDB Baseplate
      </h1>

      <p>
        This is a reusable baseplate for setting up authentication using
        NextAuth (v4 syntax), connected to MongoDB with Mongoose. The basic flow
        for registering and logging in is already set up. Password updating and
        account deletion is also in place.
      </p>

      <ul className="list-disc list-inside space-y-1">
        <li>
          The <code className="text-neutral-600">/</code> route is protected via
          middleware.
        </li>
        <li>
          Unauthenticated users will be redirected to{" "}
          <code className="text-neutral-600">/login</code>.
        </li>
        <li>
          New users are automatically logged in and redirected after successful
          registration.
        </li>
      </ul>

      <hr className="border-neutral-300" />

      <h2 className="text-lg font-medium">Required Packages</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <code className="text-neutral-600">npm i next-auth</code>
        </li>
        <li>
          <code className="text-neutral-600">npm i mongodb</code>
        </li>
        <li>
          <code className="text-neutral-600">npm i mongoose</code>
        </li>
        <li>
          <code className="text-neutral-600">npm i bcrypt</code>
        </li>
      </ul>

      <hr className="border-neutral-300" />

      <h2 className="text-lg font-medium">MongoDB Setup</h2>
      <p>
        Go to{" "}
        <a
          href="https://account.mongodb.com/account/login"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black"
        >
          MongoDB Atlas
        </a>{" "}
        and create a new project and database.
      </p>
      <p>
        Follow along with{" "}
        <a
          href="https://www.youtube.com/watch?v=wNWyMsrpbz0"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black"
        >
          this tutorial (start at 18:30)
        </a>{" "}
        for guidance.
      </p>

      <hr className="border-neutral-300" />

      <h2 className="text-lg font-medium">Environment Variables</h2>
      <p>
        Add the following to your{" "}
        <code className="text-neutral-600">.env.local</code> file:
      </p>
      <pre className="bg-neutral-100 border border-neutral-300 p-4 rounded text-xs overflow-auto whitespace-pre-wrap">
        {`MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<app-name>
NEXTAUTH_SECRET=<your-generated-secret>
NEXTAUTH_URL=http://localhost:3000`}
      </pre>
      <p>
        To generate a secure secret, run:{" "}
        <code className="bg-neutral-100 px-1 py-0.5 rounded border border-neutral-300">
          openssl rand -base64 64
        </code>{" "}
        and copy the value into the .env secret.
      </p>
    </div>
  );
}
