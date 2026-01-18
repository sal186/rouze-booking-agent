import { google } from 'googleapis';
import { getConfig, Booking, Service, updateBooking } from './db';

// Initialize Google Calendar API
function getCalendar() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

export async function createCalendarEvent(booking: Booking, service: Service): Promise<string | null> {
  const calendar = getCalendar();
  const config = await getConfig();
  if (!calendar || !config.google_calendar_id) {
    console.log('Google Calendar not configured, skipping event creation');
    return null;
  }

  const startDateTime = new Date(`${booking.booking_date}T${booking.booking_time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);

  try {
    const event = await calendar.events.insert({
      calendarId: config.google_calendar_id,
      requestBody: {
        summary: `${service.name} - ${booking.customer_name}`,
        description: `
Booking Details:
- Customer: ${booking.customer_name}
- Email: ${booking.customer_email}
${booking.customer_phone ? `- Phone: ${booking.customer_phone}\n` : ''}
${booking.notes ? `- Notes: ${booking.notes}\n` : ''}
- Booking ID: ${booking.id}
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: config.timezone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: config.timezone,
        },
        attendees: [
          { email: booking.customer_email },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      },
    });

    const eventId = event.data.id || null;
    if (eventId) {
      // Store the event ID in the booking
      updateBooking(booking.id, { google_event_id: eventId });
      console.log('Calendar event created:', eventId);
    }
    return eventId;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return null;
  }
}

export async function updateCalendarEvent(booking: Booking, service: Service): Promise<void> {
  const calendar = getCalendar();
  const config = getConfig();

  if (!calendar || !config.google_calendar_id || !booking.google_event_id) {
    return;
  }

  const startDateTime = new Date(`${booking.booking_date}T${booking.booking_time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);

  try {
    await calendar.events.update({
      calendarId: config.google_calendar_id,
      eventId: booking.google_event_id,
      requestBody: {
        summary: `${service.name} - ${booking.customer_name}`,
        description: `
Booking Details:
- Customer: ${booking.customer_name}
- Email: ${booking.customer_email}
${booking.customer_phone ? `- Phone: ${booking.customer_phone}\n` : ''}
${booking.notes ? `- Notes: ${booking.notes}\n` : ''}
- Booking ID: ${booking.id}
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: config.timezone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: config.timezone,
        },
      },
    });
    console.log('Calendar event updated:', booking.google_event_id);
  } catch (error) {
    console.error('Failed to update calendar event:', error);
  }
}

export async function deleteCalendarEvent(booking: Booking): Promise<void> {
  const calendar = getCalendar();
  const config = getConfig();

  if (!calendar || !config.google_calendar_id || !booking.google_event_id) {
    return;
  }

  try {
    await calendar.events.delete({
      calendarId: config.google_calendar_id,
      eventId: booking.google_event_id,
    });
    console.log('Calendar event deleted:', booking.google_event_id);
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
  }
}

// Get busy times from Google Calendar for availability checking
export async function getCalendarBusyTimes(date: string): Promise<{ start: string; end: string }[]> {
  const calendar = getCalendar();
  const config = getConfig();

  if (!calendar || !config.google_calendar_id) {
    return [];
  }

  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        items: [{ id: config.google_calendar_id }],
      },
    });

    const busy = response.data.calendars?.[config.google_calendar_id]?.busy || [];
    return busy.map(b => ({
      start: b.start || '',
      end: b.end || '',
    }));
  } catch (error) {
    console.error('Failed to get calendar busy times:', error);
    return [];
  }
}
