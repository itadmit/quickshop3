'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { HiCalendar, HiChevronDown, HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_12_months'
  | 'this_year'
  | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  presets?: DatePreset[];
  showCompare?: boolean;
}

const presetLabels: Record<DatePreset, string> = {
  today: 'היום',
  yesterday: 'אתמול',
  last_7_days: '7 ימים אחרונים',
  last_30_days: '30 ימים אחרונים',
  this_month: 'החודש הנוכחי',
  last_month: 'החודש הקודם',
  last_3_months: '3 חודשים אחרונים',
  last_12_months: '12 חודשים אחרונים',
  this_year: 'השנה הנוכחית',
  custom: 'תאריך מותאם',
};

const defaultPresets: DatePreset[] = [
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'this_month',
  'last_month',
  'last_3_months',
  'last_12_months',
  'custom',
];

function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: yesterday };
    case 'last_7_days':
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      return { start: last7, end: today };
    case 'last_30_days':
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 29);
      return { start: last30, end: today };
    case 'this_month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      };
    case 'last_month':
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
      return { start: lastMonthStart, end: lastMonthEnd };
    case 'last_3_months':
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      last3Months.setDate(last3Months.getDate() + 1);
      return { start: last3Months, end: today };
    case 'last_12_months':
      const last12Months = new Date(today);
      last12Months.setFullYear(last12Months.getFullYear() - 1);
      last12Months.setDate(last12Months.getDate() + 1);
      return { start: last12Months, end: today };
    case 'this_year':
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: today,
      };
    default:
      return { start: today, end: today };
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function detectPreset(range: DateRange): DatePreset {
  for (const preset of defaultPresets) {
    if (preset === 'custom') continue;
    const presetRange = getPresetRange(preset);
    if (isSameDay(range.start, presetRange.start) && isSameDay(range.end, presetRange.end)) {
      return preset;
    }
  }
  return 'custom';
}

const hebrewMonths = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface CalendarProps {
  month: Date;
  selectedStart?: Date;
  selectedEnd?: Date;
  onSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

function Calendar({
  month,
  selectedStart,
  selectedEnd,
  onSelect,
  onMonthChange,
  minDate,
  maxDate,
}: CalendarProps) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    const prev = new Date(month);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  const nextMonth = () => {
    const next = new Date(month);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  const isInRange = (day: number) => {
    if (!selectedStart || !selectedEnd) return false;
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return date >= selectedStart && date <= selectedEnd;
  };

  const isSelected = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return (
      (selectedStart && isSameDay(date, selectedStart)) ||
      (selectedEnd && isSameDay(date, selectedEnd))
    );
  };

  const isDisabled = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isToday = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return isSameDay(date, today);
  };

  return (
    <div className="p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiChevronRight className="w-4 h-4" />
        </button>
        <span className="font-medium text-gray-900">
          {hebrewMonths[month.getMonth()]} {month.getFullYear()}
        </span>
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {hebrewDays.map((day) => (
          <div key={day} className="text-center text-xs text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index} className="flex items-center justify-center h-9 w-9">
            {day !== null && (
              <button
                type="button"
                disabled={isDisabled(day)}
                onClick={() => onSelect(new Date(month.getFullYear(), month.getMonth(), day))}
                className={`
                  w-8 h-8 text-sm rounded-full transition-colors
                  flex items-center justify-center font-medium
                  ${isDisabled(day) ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${isSelected(day) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}
                  ${isInRange(day) && !isSelected(day) ? 'bg-emerald-50 text-emerald-900' : ''}
                  ${isToday(day) && !isSelected(day) && !isInRange(day) ? 'border border-emerald-500' : ''}
                `}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
  className = '',
  presets = defaultPresets,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempStart, setTempStart] = useState<Date | undefined>(value?.start);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(value?.end);
  const [selectingStart, setSelectingStart] = useState(true);
  const [month1, setMonth1] = useState(new Date());
  const [month2, setMonth2] = useState(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next;
  });

  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update temp values when value changes externally
  useEffect(() => {
    if (value) {
      setTempStart(value.start);
      setTempEnd(value.end);
    }
  }, [value]);

  const currentPreset = useMemo(() => {
    if (!value) return 'last_30_days';
    return detectPreset(value);
  }, [value]);

  const displayLabel = useMemo(() => {
    if (!value) return 'בחר תאריכים';
    if (currentPreset !== 'custom') {
      return presetLabels[currentPreset];
    }
    if (isSameDay(value.start, value.end)) {
      return formatDate(value.start);
    }
    return `${formatShortDate(value.start)} - ${formatShortDate(value.end)}`;
  }, [value, currentPreset]);

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === 'custom') {
      setShowCalendar(true);
      setSelectingStart(true);
      // Initialize calendars to current selection or today
      if (value) {
        setMonth1(new Date(value.start.getFullYear(), value.start.getMonth(), 1));
        const m2 = new Date(value.start.getFullYear(), value.start.getMonth() + 1, 1);
        setMonth2(m2);
        setTempStart(value.start);
        setTempEnd(value.end);
      }
    } else {
      const range = getPresetRange(preset);
      onChange(range);
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const handleCalendarSelect = (date: Date) => {
    if (selectingStart) {
      setTempStart(date);
      setTempEnd(undefined);
      setSelectingStart(false);
    } else {
      if (tempStart && date < tempStart) {
        setTempStart(date);
        setTempEnd(tempStart);
      } else {
        setTempEnd(date);
      }
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange({ start: tempStart, end: tempEnd });
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const handleCancel = () => {
    setTempStart(value?.start);
    setTempEnd(value?.end);
    setShowCalendar(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref} dir="rtl">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 border rounded-lg bg-white
          hover:bg-gray-50 transition-colors text-sm
          ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-300'}
        `}
      >
        <HiCalendar className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700">{displayLabel}</span>
        <HiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden ${showCalendar ? 'min-w-[580px]' : 'min-w-[280px]'}`}>
          {!showCalendar ? (
            /* Preset List */
            <div className="py-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`
                    w-full px-4 py-2.5 text-right text-sm transition-colors
                    flex items-center justify-between
                    ${currentPreset === preset 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span>{presetLabels[preset]}</span>
                  {currentPreset === preset && preset !== 'custom' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                  {preset === 'custom' && (
                    <HiChevronLeft className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* Calendar View */
            <div>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ביטול
                </button>
                <span className="font-medium text-gray-900">בחר טווח תאריכים</span>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <HiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Selection display */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-4 text-sm">
                  <div className={`flex-1 min-w-[140px] text-center py-2 px-4 rounded-lg border-2 ${selectingStart ? 'border-emerald-500 bg-white' : 'border-transparent bg-gray-100'}`}>
                    <span className="text-xs text-gray-500 block mb-0.5">מתאריך</span>
                    <span className="font-medium text-gray-900">
                      {tempStart ? formatDate(tempStart) : 'בחר'}
                    </span>
                  </div>
                  <span className="text-gray-400 flex-shrink-0">→</span>
                  <div className={`flex-1 min-w-[140px] text-center py-2 px-4 rounded-lg border-2 ${!selectingStart ? 'border-emerald-500 bg-white' : 'border-transparent bg-gray-100'}`}>
                    <span className="text-xs text-gray-500 block mb-0.5">עד תאריך</span>
                    <span className="font-medium text-gray-900">
                      {tempEnd ? formatDate(tempEnd) : 'בחר'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calendars - Side by side on larger screens */}
              <div className="flex">
                <div className="border-l border-gray-100">
                  <Calendar
                    month={month1}
                    selectedStart={tempStart}
                    selectedEnd={tempEnd}
                    onSelect={handleCalendarSelect}
                    onMonthChange={setMonth1}
                    maxDate={new Date()}
                  />
                </div>
                <div className="hidden md:block">
                  <Calendar
                    month={month2}
                    selectedStart={tempStart}
                    selectedEnd={tempEnd}
                    onSelect={handleCalendarSelect}
                    onMonthChange={setMonth2}
                    maxDate={new Date()}
                  />
                </div>
              </div>

              {/* Apply button */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  disabled={!tempStart || !tempEnd}
                  onClick={handleApply}
                  className={`
                    w-full py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${tempStart && tempEnd
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  החל טווח תאריכים
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to convert DateRange to API format
export function dateRangeToParams(range: DateRange): { start_date: string; end_date: string } {
  return {
    start_date: range.start.toISOString().split('T')[0],
    end_date: range.end.toISOString().split('T')[0],
  };
}

// Helper function to get initial range (last 30 days)
export function getDefaultDateRange(): DateRange {
  return getPresetRange('last_30_days');
}

