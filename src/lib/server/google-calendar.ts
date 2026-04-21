import { google } from "googleapis";

type Args = {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
};

function env(name: string) {
  return process.env[name] ?? "";
}

export async function createCalendarEvent(args: Args): Promise<string | null> {
  const calendarId = env("GOOGLE_CALENDAR_ID");
  const clientEmail = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (!calendarId || !clientEmail || !privateKey) return null;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });
  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: args.summary,
      description: args.description,
      start: { dateTime: args.startIso, timeZone: "Asia/Kolkata" },
      end: { dateTime: args.endIso, timeZone: "Asia/Kolkata" },
    },
  });

  return event.data.id ?? null;
}

