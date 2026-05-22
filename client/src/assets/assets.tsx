/* eslint-disable react-refresh/only-export-components */
import { BarChart3Icon, EyeIcon, FileSearchIcon, GlobeIcon, ListChecksIcon, ShieldIcon, SparklesIcon, ZapIcon } from "lucide-react";

export const homeFeaturesData = [
    {
        icon: <BarChart3Icon size={28} />,
        title: "SEO Score",
        desc: "Overall score plus category breakdowns for SEO, performance, accessibility, and best practices.",
    },
    {
        icon: <ZapIcon size={28} />,
        title: "Performance",
        desc: "Measure load time and page weight so you know what slows visitors down.",
    },
    {
        icon: <ShieldIcon size={28} />,
        title: "Technical SEO",
        desc: "Validate meta tags, canonical URLs, robots directives, and heading structure.",
    },
    {
        icon: <EyeIcon size={28} />,
        title: "Accessibility",
        desc: "Spot missing alt text, viewport issues, and other accessibility gaps.",
    },
    {
        icon: <SparklesIcon size={28} />,
        title: "AI Insights",
        desc: "Gemini turns raw page data into prioritized issues with clear fix recommendations.",
    },
    {
        icon: <ListChecksIcon size={28} />,
        title: "Action Plan",
        desc: "Export-ready report with critical, warning, and info-level improvements.",
    },
];

export const homeHowItWorksData = [
    {
        num: "01",
        icon: <GlobeIcon size={24} />,
        title: "Paste a URL",
        desc: "Enter any public website — no install or browser extension required.",
    },
    {
        num: "02",
        icon: <FileSearchIcon size={24} />,
        title: "We scan the page",
        desc: "Playwright renders the site like a real browser and extracts SEO signals.",
    },
    {
        num: "03",
        icon: <BarChart3Icon size={24} />,
        title: "Get your report",
        desc: "Review scores, keywords, and AI-generated fixes in under a minute.",
    },
];

export const homefooterLinks = [
    {
        title: "Product",
        links: ["Features", "Pricing", "Analyze", "History"],
    },
    {
        title: "Resources",
        links: ["Documentation", "Blog", "SEO Guide", "Support"],
    },
    {
        title: "Company",
        links: ["About", "Contact"],
    },
    {
        title: "Legal",
        links: ["Privacy", "Terms"],
    },
];

export const HomeWave = () => (
    <svg className="w-full h-[15vh] min-h-[60px] max-h-[120px]" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
        <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g className="parallax">
            <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(59,130,246,0.1)" />
            <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(59,130,246,0.15)" />
            <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(59,130,246,0.2)" />
            <use xlinkHref="#gentle-wave" x="48" y="7" fill="rgba(59,130,246,0.25)" />
        </g>
    </svg>
);
