// Mirrors the FastAPI schemas (backend/app/client/schema). Amounts are FCFA integers.

export type ApiResponse<T> = { code: number; msg: string; data: T };

export type Page<T> = {
    items: T[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
};

export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    sort_order: number;
};

export type Product = {
    id: number;
    slug: string;
    category_id: number;
    category: { id: number; name: string; slug: string } | null;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image_url: string | null;
    gallery: string[];
    model_3d_url: string | null;
    volume: string | null;
    ingredients: string | null;
    is_active: boolean;
    is_featured: boolean;
    is_available: boolean;
    created_time: string;
};

export type ProductInput = Omit<
    Product,
    "id" | "slug" | "category" | "is_available" | "created_time"
> & { slug?: string | null };

export type User = {
    id: number;
    x_id: string;
    full_name: string | null;
    pseudo: string | null;
    phone: string | null;
    email: string | null;
    roles: { name: string }[];
};

export type Customer = {
    id: number;
    pseudo: string | null;
    full_name: string | null;
    phone: string | null;
    status: boolean;
    is_admin: boolean;
    join_time: string | null;
};

export type OrderStatus =
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";

export type DeliveryMethod = "delivery" | "pickup";
export type PaymentMethod = "cash" | "mobile_money";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderItem = {
    id: number;
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
};

export type Order = {
    id: number;
    order_number: string;
    status: OrderStatus;
    subtotal: number;
    delivery_fee: number;
    total: number;
    customer_name: string;
    customer_phone: string;
    customer_pseudo: string | null;
    delivery_method: DeliveryMethod;
    delivery_address: string | null;
    delivery_commune: string | null;
    delivery_instructions: string | null;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    notes: string | null;
    items: OrderItem[];
    created_time: string;
};

export type CreateOrderInput = {
    items: { product_id: number; quantity: number }[];
    customer_name: string;
    customer_phone?: string;
    delivery_method: DeliveryMethod;
    delivery_address?: string;
    delivery_commune?: string;
    delivery_instructions?: string;
    payment_method: PaymentMethod;
    notes?: string;
};

export type DeliveryOptions = {
    delivery_fee: number;
    free_delivery_threshold: number;
    communes: string[];
    pickup_address: string | null;
    payment_methods: PaymentMethod[];
};

export type Dashboard = {
    orders_count: number;
    revenue: number;
    pending_orders: number;
    available_products: number;
    top_products: { product_id: number | null; name: string; quantity: number; revenue: number }[];
};
