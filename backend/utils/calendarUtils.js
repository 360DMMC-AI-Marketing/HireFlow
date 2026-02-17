import ical from 'ical-generator';

export const generateIcs = (event) => {
  const calendar = ical({ name: 'HireFlow Interview' });
  
  calendar.createEvent({
    start: event.start, // Date object
    end: event.end,     // Date object
    summary: event.summary,
    description: event.description,
    location: event.location,
    url: event.url,
    organizer: {
      name: 'HireFlow Team',
      email: 'no-reply@hireflow.com'
    }
  });

  return calendar.toString();
};