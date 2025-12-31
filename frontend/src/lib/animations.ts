import { Variants } from "framer-motion";

// Page transition animations
export const pageTransition: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export const pageTransitionConfig = {
    initial: "initial",
    animate: "animate",
    exit: "exit",
    transition: { duration: 0.3, ease: "easeInOut" },
};

// Table pulse animation for new items
export const tablePulse: Variants = {
    initial: { scale: 1 },
    pulse: {
        scale: [1, 1.05, 1],
        boxShadow: [
            "0 0 0 0 rgba(var(--primary-rgb), 0)",
            "0 0 0 10px rgba(var(--primary-rgb), 0.3)",
            "0 0 0 0 rgba(var(--primary-rgb), 0)",
        ],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 0.5,
        },
    },
};

// Receipt slide-out animation (mimics printer)
export const receiptSlideOut: Variants = {
    hidden: { y: "-100%", opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 200,
            duration: 0.8,
        },
    },
    exit: {
        y: "100%",
        opacity: 0,
        transition: { duration: 0.5 },
    },
};

// Staggered list entrance
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            damping: 20,
            stiffness: 100,
        },
    },
};

// Card hover animation
export const cardHover: Variants = {
    rest: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: {
            duration: 0.2,
            ease: "easeInOut",
        },
    },
};

// Fade in animation
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3 },
    },
};

// Notification badge animation
export const notificationBadge: Variants = {
    initial: { scale: 0 },
    animate: {
        scale: 1,
        transition: {
            type: "spring",
            damping: 10,
            stiffness: 200,
        },
    },
    exit: {
        scale: 0,
        transition: { duration: 0.2 },
    },
};
