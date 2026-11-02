import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const foodyButton = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
    {
        variants: {
            variant: {
                primary: "bg-sun text-cocoa shadow-soft hover:bg-sun-dark active:scale-[0.98]",
                dark: "bg-cocoa text-cream hover:bg-cocoa/90 active:scale-[0.98]",
                outline: "border border-cocoa/15 bg-white text-cocoa hover:border-sun hover:bg-honey",
                ghost: "text-cocoa hover:bg-honey",
                danger: "bg-red-50 text-red-700 hover:bg-red-100",
            },
            size: {
                sm: "h-9 px-4 text-sm",
                md: "h-11 px-5 text-sm",
                lg: "h-13 px-7 text-base",
                icon: "size-11",
            },
        },
        defaultVariants: { variant: "primary", size: "md" },
    },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof foodyButton> & { asChild?: boolean; loading?: boolean };

export function FoodyButton({ className, variant, size, asChild, loading, children, disabled, ...props }: Props) {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp className={cn(foodyButton({ variant, size }), className)} disabled={disabled || loading} {...props}>
            {asChild ? (
                children
            ) : (
                <>
                    {loading && <Loader2 className="animate-spin" />}
                    {children}
                </>
            )}
        </Comp>
    );
}

export { foodyButton };
