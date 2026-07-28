export const SEGMENTS = ["EQ", "F&O", "MCX", "FX", "CRYPTO"] as const;
export type Segment = (typeof SEGMENTS)[number];

// Must match backend OrderType enum (app/models/_base.py): SL_M with an
// underscore — NOT "SL-M". A hyphen made SL-M orders returned by the backend
// fail the `order_type === "SL-M"` display checks (SL/trigger price didn't render).
export const ORDER_TYPES = ["MARKET", "LIMIT", "SL", "SL_M"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const PRODUCT_TYPES = ["MIS", "NRML", "CNC"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const SIDES = ["BUY", "SELL"] as const;
export type Side = (typeof SIDES)[number];
