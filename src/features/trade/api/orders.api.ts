import { api } from "@core/api/client";
import { unwrap } from "@core/api/errors";
import type {
  ModifyOrderInput,
  Order,
  PlaceOrderInput,
} from "@features/trade/types/order.types";

export interface OrdersQuery {
  status?: string;
  limit?: number;
  skip?: number;
}

export const OrdersAPI = {
  // The backend paginates orders as `{ items, meta }` (api/v1/user/orders.py),
  // unlike positions/holdings/etc. which return bare arrays. Tolerate both
  // shapes so callers always get a flat Order[] (and never crash on
  // `allOrders.filter`).
  list: async (q: OrdersQuery = {}): Promise<Order[]> => {
    const res = await unwrap<Order[] | { items?: Order[] }>(
      api.get("/user/orders", { params: q }),
    );
    return Array.isArray(res) ? res : res?.items ?? [];
  },
  get: (id: string) => unwrap<Order>(api.get(`/user/orders/${id}`)),
  place: (body: PlaceOrderInput) =>
    unwrap<Order>(api.post("/user/orders", body)),
  modify: (id: string, body: ModifyOrderInput) =>
    unwrap<Order>(api.put(`/user/orders/${id}`, body)),
  cancel: (id: string) => unwrap<Order>(api.delete(`/user/orders/${id}`)),
};
