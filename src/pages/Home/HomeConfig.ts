import {
	Building2,
	RefreshCw,
	FileText,
	Archive,
	UserCog,
	MapPin,
	Calculator,
	FileCheck2,
} from "lucide-react";

export const trackingFeatures = [
	{ icon: Building2, label: "Company Name Change" },
	{ icon: RefreshCw, label: "Company Type Change" },
	{ icon: FileText, label: "Organisation Status" },
	{ icon: Archive, label: "New Registry Filings" },
	{ icon: UserCog, label: "Director Changes" },
	{ icon: MapPin, label: "Registered Office" },
	{ icon: FileText, label: "HE32 Archive Updates" },
];

export const services = [
	{
		icon: Building2,
		title: "Company Incorporation",
		description:
			"Register a new company in Cyprus with full support from name reservation to registrar filing.",
		route: "/incorporation",
		cta: "Start Incorporation",
	},
	{
		icon: FileCheck2,
		title: "Name Approval",
		description:
			"Check availability and reserve your company name with the Cyprus Registrar of Companies.",
		route: "/name-approval",
		cta: "Check Name",
	},
	{
		icon: Calculator,
		title: "Accounting Services",
		description:
			"Bookkeeping, VAT filings, and annual returns handled by licensed Cyprus accountants.",
		route: "/accounting",
		cta: "Get a Quote",
	},
];
