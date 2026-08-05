/**
 * Formats a 24-hour time string (e.g., "21:00") into a 12-hour format with AM/PM (e.g., "9:00 PM").
 */
export function formatIndianTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;

  const hours24 = parseInt(match[1], 10);
  const minutes = match[2];

  if (isNaN(hours24)) return timeStr;

  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  hours12 = hours12 ? hours12 : 12; 

  return `${hours12}:${minutes} ${ampm}`;
}

/**
 * Returns a formatted string indicating open/close time.
 */
export function getShopTimeDisplay(openingTimeStr = '09:00', closingTimeStr = '21:00', isActive = true) {
  if (isActive === false) return "Currently Closed";

  const now = new Date();
  // Get time parts in IST
  const formatter = new Intl.DateTimeFormat('en-US', { 
    timeZone: 'Asia/Kolkata', 
    hour: 'numeric', 
    minute: 'numeric', 
    hour12: false 
  });
  
  const parts = formatter.formatToParts(now);
  let currentHour = 0;
  let currentMinute = 0;
  for (const part of parts) {
    if (part.type === 'hour') {
      currentHour = parseInt(part.value, 10);
      if (currentHour === 24) currentHour = 0;
    }
    if (part.type === 'minute') {
      currentMinute = parseInt(part.value, 10);
    }
  }

  const currentTotalMins = currentHour * 60 + currentMinute;

  const parseTime = (t) => {
    if (!t) return 0;
    const m = t.match(/(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  };

  const openMins = parseTime(openingTimeStr);
  const closeMins = parseTime(closingTimeStr);

  let isOpen = false;
  if (closeMins > openMins) {
    isOpen = currentTotalMins >= openMins && currentTotalMins < closeMins;
  } else {
    // Crosses midnight
    isOpen = currentTotalMins >= openMins || currentTotalMins < closeMins;
  }

  if (isOpen) {
    return `Open until ${formatIndianTime(closingTimeStr)}`;
  } else {
    return `Opens at ${formatIndianTime(openingTimeStr)}`;
  }
}
