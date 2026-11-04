import { Pipe, PipeTransform } from '@angular/core';
import { formatTime } from '../core/opening-hours.model';

@Pipe({ name: 'libraryTime' })
export class TimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatTime(value ?? undefined);
  }
}
