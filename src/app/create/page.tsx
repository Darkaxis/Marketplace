import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Car,
  Home,
  ArrowLeft,
  Tag,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const LISTING_TYPES = [
  {
    title: "Item for sale",
    description:
      "Create a single listing for one or more items to sell in your local community.",
    href: "/create/item",
    icon: ShoppingBag,
    iconBg: "bg-[#E7F3FF] text-[#1877F2]",
  },
  {
    title: "Vehicle for sale",
    description: "Sell a car, truck, motorcycle, boat, or EV with photos and details.",
    href: "/create/item?category=vehicles",
    icon: Car,
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Home for sale or rent",
    description: "List a house, apartment, townhome, or room for rent or sale.",
    href: "/create/item?category=property-rentals",
    icon: Home,
    iconBg: "bg-amber-100 text-amber-700",
  },
];

export default function CreateListingTypePage() {
  return (
    <div className="flex flex-1">
      {/* Left Sidebar Panel */}
      <aside className="hidden w-[340px] shrink-0 flex-col border-r border-gray-200 bg-white p-4 lg:flex xl:w-[360px]">
        <div className="mb-4">
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1877F2]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Marketplace
          </Link>
          <h1 className="text-2xl font-bold text-[#050505]">
            Create new listing
          </h1>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-3 rounded-lg bg-[#E7F3FF] px-3 py-2.5 text-[15px] font-semibold text-[#1877F2]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white">
              <Tag className="h-5 w-5" />
            </div>
            <span>Choose listing type</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="mt-auto rounded-xl bg-[#F0F2F5] p-4">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#1877F2]" />
            <div className="text-xs leading-relaxed text-gray-600">
              <p className="font-semibold text-[#050505]">
                Tips for a great listing
              </p>
              <p className="mt-1">
                Use clear photos taken in natural light, set a fair local price,
                and include helpful details in your description so buyers can
                message you with confidence.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl">
          <div className="mb-6 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1877F2]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
          </div>

          <h2 className="mb-6 text-center text-2xl font-bold text-[#050505]">
            Choose listing type
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {LISTING_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Link key={type.title} href={type.href} className="group block">
                  <Card className="h-full border border-gray-200 bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#1877F2]/40 group-hover:shadow-md">
                    <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                      <div
                        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${type.iconBg}`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-base font-bold text-[#050505] group-hover:text-[#1877F2]">
                        {type.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        {type.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
