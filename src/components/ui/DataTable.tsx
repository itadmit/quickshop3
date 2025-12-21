'use client';

import { ReactNode, useState } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { HiDotsVertical, HiChevronDown, HiInbox } from 'react-icons/hi';

export interface TableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

export interface TableFilter {
  type: 'select' | 'search' | 'date';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
}

export interface DataTableProps<T> {
  // Header
  title: string;
  description?: string;
  
  // Actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryActions?: {
    label: string;
    onClick: () => void;
  }[];
  headerActions?: ReactNode; // Custom header actions (takes precedence over primaryAction/secondaryActions)
  
  // Filters
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filters?: TableFilter[];
  
  // Table
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  
  // Mobile
  mobileColumns?: number[]; // Indices of columns to show in mobile (default: [0,1,2,3,4])
  
  // Selection
  selectable?: boolean;
  selectedItems?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
  
  // Row Actions
  rowActions?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void; // Click handler for row
  
  // Empty State
  emptyState?: ReactNode;
  
  // Loading
  loading?: boolean;
  
  // Padding
  noPadding?: boolean; // If true, don't add padding (useful when wrapped in Card)
}

export function DataTable<T>({
  title,
  description,
  primaryAction,
  secondaryActions,
  headerActions,
  searchPlaceholder,
  onSearch,
  filters,
  columns,
  data,
  keyExtractor,
  mobileColumns = [0, 1, 2, 3, 4], // Default: show first 5 columns
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
  rowActions,
  onRowClick,
  emptyState,
  loading = false,
  noPadding = false,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every(item => selectedItems.has(keyExtractor(item)));
  
  const toggleAll = () => {
    if (!onSelectionChange) return;
    
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(keyExtractor)));
    }
  };
  
  const toggleItem = (key: string | number) => {
    if (!onSelectionChange) return;
    
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    onSelectionChange(newSelected);
  };

  return (
    <div className={`${noPadding ? '' : 'space-y-4 md:space-y-6'}`}>
      {/* Page Header with Actions - Only show if there's content */}
      {(title || description || primaryAction || secondaryActions || headerActions) && (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {(title || description) && (
            <div>
              {title && <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h1>}
              {description && <p className="text-sm md:text-base text-gray-600">{description}</p>}
            </div>
          )}
          
          {/* Action Buttons - In Header */}
          {headerActions ? (
            <div className="flex items-center gap-2 flex-wrap">
              {headerActions}
            </div>
          ) : (primaryAction || secondaryActions) && (
            <div className="flex items-center gap-2 flex-wrap">
              {secondaryActions?.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
                >
                  {action.label}
                </button>
              ))}
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-lg shadow-sm hover:shadow-md transition-all"
                  dir="rtl"
                >
                  {primaryAction.icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{primaryAction.icon}</span>}
                  <span>{primaryAction.label}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search & Filters Bar - Separate Card */}
      {(onSearch || (filters && filters.length > 0)) && (
        <Card>
          <div className="px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search - Takes remaining space */}
              {onSearch && (
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder={searchPlaceholder || 'חיפוש...'}
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              
              {/* Filters - No horizontal scroll */}
              {filters && filters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex-shrink-0">
                      {filter.type === 'select' && (
                        <select
                          value={filter.value}
                          onChange={(e) => filter.onChange?.(e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
                        >
                          {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Table Card - Separate */}
      <Card className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {selectable && (
                  <th className="px-6 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
                {rowActions && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    פעולות
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Skeleton Loading Rows
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      {selectable && (
                        <td className="px-6 py-4">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </td>
                      )}
                    </tr>
                  ))}
                </>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-6 py-12">
                    {emptyState || (
                      <div className="text-center py-12">
                        <HiInbox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <div className="text-gray-500">אין נתונים להצגה</div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const key = keyExtractor(item);
                  const isSelected = selectedItems.has(key);
                  
                  return (
                    <tr
                      key={key}
                      className={`hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                      onClick={(e) => {
                        // Don't trigger if clicking on checkbox, button, or dropdown
                        if (
                          (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                          (e.target as HTMLElement).closest('button') ||
                          (e.target as HTMLElement).closest('[role="menu"]') ||
                          (e.target as HTMLElement).closest('[role="menuitem"]')
                        ) {
                          return;
                        }
                        onRowClick?.(item);
                      }}
                    >
                      {selectable && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(key)}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                          {column.render
                            ? column.render(item)
                            : (item as any)[column.key]}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {rowActions(item)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View - Compact 3 Lines */}
        <div className="md:hidden divide-y divide-gray-200">
          {loading ? (
            // Mobile Skeleton Loading
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </>
          ) : data.length === 0 ? (
            <div className="p-8">
              {emptyState || (
                <div className="text-center py-12">
                  <HiInbox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <div className="text-gray-500">אין נתונים להצגה</div>
                </div>
              )}
            </div>
          ) : (
            (() => {
              const [expandedItems, setExpandedItems] = useState<Set<string | number>>(new Set());
              
              return data.map((item) => {
                const key = keyExtractor(item);
                const isSelected = selectedItems.has(key);
                const isExpanded = expandedItems.has(key);
                
                const toggleExpand = () => {
                  const newExpanded = new Set(expandedItems);
                  if (newExpanded.has(key)) {
                    newExpanded.delete(key);
                  } else {
                    newExpanded.add(key);
                  }
                  setExpandedItems(newExpanded);
                };
              
              return (
                <div
                  key={key}
                  className={`${isSelected ? 'bg-blue-50' : 'bg-white'}`}
                >
                  {/* Main Row - Clickable */}
                  <div 
                    className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Don't trigger if clicking on checkbox or action button
                      if (
                        (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                        (e.target as HTMLElement).closest('button')
                      ) {
                        return;
                      }
                      onRowClick?.(item);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      {selectable && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(key)}
                          className="rounded border-gray-300 flex-shrink-0"
                        />
                      )}
                      
                      {/* First Column - Icon/Image */}
                      {mobileColumns[0] !== undefined && columns[mobileColumns[0]] && (
                        <div className="flex-shrink-0">
                          {(() => {
                            const col = columns[mobileColumns[0]];
                            return col?.render ? col.render(item) : (item as any)[col?.key];
                          })()}
                        </div>
                      )}
                      
                      {/* Content - 3 Lines */}
                      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-2">
                        <div>
                          {/* Line 1: Main title */}
                          {mobileColumns[1] !== undefined && columns[mobileColumns[1]] && (
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {(() => {
                                const col = columns[mobileColumns[1]];
                                return col?.render ? col.render(item) : (item as any)[col?.key];
                              })()}
                            </div>
                          )}
                          
                          {/* Line 2: Secondary info */}
                          <div className="text-xs text-gray-600">
                            {mobileColumns[2] !== undefined && columns[mobileColumns[2]] && (
                              <>
                                {(() => {
                                  const col = columns[mobileColumns[2]];
                                  return col?.render ? col.render(item) : (item as any)[col?.key];
                                })()}
                              </>
                            )}
                          </div>
                          
                          {/* Line 3: Additional info (smaller categories) */}
                          {mobileColumns[3] !== undefined && columns[mobileColumns[3]] && (
                            <div className="text-xs text-gray-500 mt-1">
                              {(() => {
                                const col = columns[mobileColumns[3]];
                                return col?.render ? col.render(item) : (item as any)[col?.key];
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Right side info (Stock/SKU/etc) */}
                        {mobileColumns[4] !== undefined && columns[mobileColumns[4]] && (
                          <div className="text-left">
                            <div className="text-xs text-gray-500 mb-0.5">מלאי</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {(() => {
                                const col = columns[mobileColumns[4]];
                                return col?.render ? col.render(item) : (item as any)[col?.key];
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions Toggle Button */}
                      {rowActions && (
                        <button
                          onClick={toggleExpand}
                          className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <HiChevronDown 
                            className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Actions - Accordion */}
                  {rowActions && isExpanded && (
                    <div className="px-3 pb-3 pt-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-col gap-2">
                        {rowActions(item)}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()
          )}
        </div>
      </Card>
    </div>
  );
}

