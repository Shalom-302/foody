import { api, unwrap } from "@/lib/api/client";
import type {
    Category,
    CreateOrderInput,
    Dashboard,
    DeliveryOptions,
    Order,
    OrderStatus,
    Page,
    PaymentStatus,
    Product,
    ProductInput,
    User,
} from "@/types/foody";

export type ProductQuery = {
    category?: string;
    q?: string;
    available?: boolean;
    featured?: boolean;
    sort?: "price_asc" | "price_desc" | "name" | "newest";
    page?: number;
    size?: number;
};

const clean = <T extends object>(params: T) =>
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));

export const catalogApi = {
    categories: () => unwrap<Category[]>(api.get("/categories")),
    products: (query: ProductQuery = {}) =>
        unwrap<Page<Product>>(api.get("/products", { params: clean({ size: 24, ...query }) })),
    product: (slug: string) => unwrap<Product>(api.get(`/products/${encodeURIComponent(slug)}`)),
};

export const authApi = {
    requestOtp: (phone: string) =>
        unwrap<{ sent: boolean; phone: string; expires_in: number; resend_in: number }>(
            api.post("/auth/whatsapp/request-otp", { phone }),
        ),
    verifyOtp: (phone: string, code: string, full_name?: string) =>
        unwrap<{ access_token: string; user: User; is_new_user: boolean }>(
            api.post("/auth/whatsapp/verify-otp", { phone, code, full_name: full_name || undefined }),
        ),
    me: () => unwrap<User>(api.get("/auth/me")),
    updateMe: (full_name: string) => unwrap<null>(api.patch("/auth/me", { full_name })),
    logout: () => unwrap<null>(api.post("/auth/logout")),
};

export const orderApi = {
    deliveryOptions: () => unwrap<DeliveryOptions>(api.get("/orders/delivery-options")),
    create: (input: CreateOrderInput) => unwrap<Order>(api.post("/orders", input)),
    mine: (page = 1) => unwrap<Page<Order>>(api.get("/orders/me", { params: { page, size: 20 } })),
    get: (id: number) => unwrap<Order>(api.get(`/orders/${id}`)),
};

export type AdminOrderQuery = {
    status?: OrderStatus;
    q?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
};

export const adminApi = {
    dashboard: (date_from?: string, date_to?: string) =>
        unwrap<Dashboard>(api.get("/admin/dashboard", { params: clean({ date_from, date_to }) })),
    orders: (query: AdminOrderQuery = {}) =>
        unwrap<Page<Order>>(api.get("/admin/orders", { params: clean({ size: 20, ...query }) })),
    order: (id: number) => unwrap<Order>(api.get(`/admin/orders/${id}`)),
    updateOrderStatus: (id: number, status: OrderStatus, payment_status?: PaymentStatus) =>
        unwrap<Order>(api.patch(`/admin/orders/${id}/status`, { status, payment_status })),
    products: (query: { q?: string; category?: string; page?: number } = {}) =>
        unwrap<Page<Product>>(api.get("/admin/products", { params: clean({ size: 50, ...query }) })),
    categories: () => unwrap<Category[]>(api.get("/admin/categories")),
    createProduct: (input: ProductInput) => unwrap<Product>(api.post("/products", input)),
    updateProduct: (id: number, input: Partial<ProductInput>) =>
        unwrap<Product>(api.patch(`/products/${id}`, input)),
    deleteProduct: (id: number) => unwrap<null>(api.delete(`/products/${id}`)),
    createCategory: (input: Partial<Category>) => unwrap<Category>(api.post("/categories", input)),
    updateCategory: (id: number, input: Partial<Category>) =>
        unwrap<Category>(api.patch(`/categories/${id}`, input)),
    upload: (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return unwrap<{ url: string }>(api.post("/admin/uploads", form));
    },
};
