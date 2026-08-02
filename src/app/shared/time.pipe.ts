import { Pipe, PipeTransform } from '@angular/core';

/**
 * Renders a 24-hour `HH:MM` as the library writes times everywhere else:
 * `14:00` becomes `2.00pm`, matching "Open 1.30pm – 5.00pm" in the hours table
 * and the printed timetable.
 *
 * Dots rather than colons is the British convention the library already uses,
 * and am/pm reads more naturally than 24-hour for this audience.
 */
@Pipe({ name: 'libraryTime' })
export class TimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const [rawHours, rawMinutes] = value.split(':');
    const hours = Number(rawHours);
    if (Number.isNaN(hours) || rawMinutes === undefined) {
      return value; // not a time we recognise; show it untouched
    }
    const suffix = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hours12}.${rawMinutes}${suffix}`;
  }
}
