"use client";

import { useState } from "react";
import { Wrench, ExternalLink, Search } from "lucide-react";
import { web2Tools, web2Categories } from "@/lib/web2-tools";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export default function ToolsPage() {
  const { t, locale } = useI18n();
  const [activeCategoryKey, setActiveCategoryKey] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = web2Tools.filter((tool) => {
    const matchesCategory = activeCategoryKey === "all" || tool.categoryKey === activeCategoryKey;
    const desc = locale === "en" ? tool.descriptionEn : tool.description;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t.toolsPage.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t.toolsPage.subtitle}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.toolsPage.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 pt-2">
          {web2Categories.map((cat) => {
            const label = locale === "en" ? cat.en : cat.tr;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategoryKey(cat.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border",
                  activeCategoryKey === cat.key
                    ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTools.length > 0 ? (
          filteredTools.map((tool) => {
            const description = locale === "en" ? tool.descriptionEn : tool.description;
            const categoryLabel = locale === "en" ? tool.categoryEn : tool.category;
            return (
              <div
                key={tool.id}
                className="group relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-sm",
                        tool.color
                      )}
                    >
                      {tool.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tool.name}
                      </h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 leading-relaxed">
                  {description}
                </p>
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    {t.common.visitSite}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            {t.common.search}
          </div>
        )}
      </div>
    </div>
  );
}
