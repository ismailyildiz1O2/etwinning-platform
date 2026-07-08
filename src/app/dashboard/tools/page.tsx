"use client";

import { useState } from "react";
import { Wrench, ExternalLink, Search } from "lucide-react";
import { web2Tools, web2Categories } from "@/lib/web2-tools";
import { cn } from "@/lib/utils";

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = web2Tools.filter((tool) => {
    const matchesCategory = activeCategory === "Tümü" || tool.category === activeCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
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
              Web 2.0 Araç Kütüphanesi
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              eTwinning projelerinizde kullanabileceğiniz en popüler web araçları
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Araç veya açıklama ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 pt-2">
          {web2Categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border",
                activeCategory === category
                  ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTools.length > 0 ? (
          filteredTools.map((tool) => (
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
                      {tool.category}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 leading-relaxed">
                {tool.description}
              </p>
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  Siteye Git
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Araç bulunamadı
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Arama kriterlerinize uygun bir araç listede mevcut değil.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("Tümü");
              }}
              className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
