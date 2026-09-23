import { messages } from '@/messages';

const t = messages.common.table;

export type DataTableConfig = typeof dataTableConfig;

export const dataTableConfig = {
  textOperators: [
    { label: t.opContains, value: "iLike" as const },
    { label: t.opNotContains, value: "notILike" as const },
    { label: t.opIs, value: "eq" as const },
    { label: t.opIsNot, value: "ne" as const },
    { label: t.opIsEmpty, value: "isEmpty" as const },
    { label: t.opIsNotEmpty, value: "isNotEmpty" as const },
  ],
  numericOperators: [
    { label: t.opIs, value: "eq" as const },
    { label: t.opIsNot, value: "ne" as const },
    { label: t.opLessThan, value: "lt" as const },
    { label: t.opLessThanOrEqual, value: "lte" as const },
    { label: t.opGreaterThan, value: "gt" as const },
    { label: t.opGreaterThanOrEqual, value: "gte" as const },
    { label: t.opIsBetween, value: "isBetween" as const },
    { label: t.opIsEmpty, value: "isEmpty" as const },
    { label: t.opIsNotEmpty, value: "isNotEmpty" as const },
  ],
  dateOperators: [
    { label: t.opIs, value: "eq" as const },
    { label: t.opIsNot, value: "ne" as const },
    { label: t.opIsBefore, value: "lt" as const },
    { label: t.opIsAfter, value: "gt" as const },
    { label: t.opIsOnOrBefore, value: "lte" as const },
    { label: t.opIsOnOrAfter, value: "gte" as const },
    { label: t.opIsBetween, value: "isBetween" as const },
    { label: t.opIsRelativeToToday, value: "isRelativeToToday" as const },
    { label: t.opIsEmpty, value: "isEmpty" as const },
    { label: t.opIsNotEmpty, value: "isNotEmpty" as const },
  ],
  selectOperators: [
    { label: t.opIs, value: "eq" as const },
    { label: t.opIsNot, value: "ne" as const },
    { label: t.opIsEmpty, value: "isEmpty" as const },
    { label: t.opIsNotEmpty, value: "isNotEmpty" as const },
  ],
  multiSelectOperators: [
    { label: t.opHasAnyOf, value: "inArray" as const },
    { label: t.opHasNoneOf, value: "notInArray" as const },
    { label: t.opIsEmpty, value: "isEmpty" as const },
    { label: t.opIsNotEmpty, value: "isNotEmpty" as const },
  ],
  booleanOperators: [
    { label: t.opIs, value: "eq" as const },
    { label: t.opIsNot, value: "ne" as const },
  ],
  sortOrders: [
    { label: t.sortAsc, value: "asc" as const },
    { label: t.sortDesc, value: "desc" as const },
  ],
  filterVariants: [
    "text",
    "number",
    "range",
    "date",
    "dateRange",
    "boolean",
    "select",
    "multiSelect",
  ] as const,
  operators: [
    "iLike",
    "notILike",
    "eq",
    "ne",
    "inArray",
    "notInArray",
    "isEmpty",
    "isNotEmpty",
    "lt",
    "lte",
    "gt",
    "gte",
    "isBetween",
    "isRelativeToToday",
  ] as const,
  joinOperators: ["and", "or"] as const,
};
