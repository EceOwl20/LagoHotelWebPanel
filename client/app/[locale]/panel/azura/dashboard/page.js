"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiBookOpen,
  FiFileText,
  FiGrid,
  FiImage,
} from "react-icons/fi";

const donutColors = {
  published: "#292524",
  changed: "#63978f",
  draft: "#d6d3d1",
};

const EMPTY_SUMMARY = {
  namespaceCount: 0,
  categoryCount: 0,
  imageCount: 0,
  postCount: 0,
  pages: [],
  latestPostTitle: null,
};

export default function AzuraDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

   async function loadSummary() {
  try {
    const galleryResponse = await fetch("/api/admin/azura/gallery", {
      cache: "no-store",
    });

    const galleryPayload = await galleryResponse.json();

    if (!galleryResponse.ok) {
      throw new Error(
        galleryPayload.error ||
          "Galeri bilgileri alınamadı."
      );
    }

    const categories =
      galleryPayload.gallery?.categories || [];

    const imageCount = categories.reduce(
      (total, category) =>
        total + (category.images?.length || 0),
      0
    );

    if (!cancelled) {
      setSummary({
        namespaceCount: 0,

        // Galeriden gerçek geliyor
        categoryCount: categories.length,
        imageCount,

        // Henüz olmayanlar
        postCount: 0,
        pages: [],
        latestPostTitle: null,
      });
    }
  } catch (cause) {
    if (!cancelled) {
      setError(cause.message);
    }
  }
}

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardSummary =
    summary || EMPTY_SUMMARY;

  const contentChartData = useMemo(() => {
    if (!summary) return [];

    return [
      {
        name: "Sayfalar",
        value: dashboardSummary.pages.length,
      },
      {
        name: "İçerikler",
        value: dashboardSummary.namespaceCount,
      },
      {
        name: "Görseller",
        value: dashboardSummary.imageCount,
      },
      {
        name: "Blog",
        value: dashboardSummary.postCount,
      },
    ];
  }, [summary, dashboardSummary]);

  if (error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
          Dashboard
        </p>

        <h1 className="text-3xl font-semibold text-stone-900">
          İçerik Genel Bakışı
        </h1>

        <p className="max-w-2xl text-sm leading-6 text-stone-600">
          Azura Deluxe Hotel sayfa, içerik, galeri ve
          blog verilerinin güncel durumunu tek ekrandan
          takip edebilirsiniz.
        </p>
      </div>

      {!summary ? (
        <DashboardLoading />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Dinamik Sayfa"
              value={dashboardSummary.pages.length}
              detail={`${getPublishedPageCount(
                dashboardSummary.pages
              )} yayında`}
              icon={FiFileText}
              featured
            />

            <StatCard
              title="İçerik Grubu"
              value={dashboardSummary.namespaceCount}
              detail="4 dilde yönetiliyor"
              icon={FiGrid}
            />

            <StatCard
              title="Galeri Görseli"
              value={dashboardSummary.imageCount}
              detail={`${dashboardSummary.categoryCount} kategoride`}
              icon={FiImage}
            />

            <StatCard
              title="Blog Yazısı"
              value={dashboardSummary.postCount}
              detail="Toplam kayıt"
              icon={FiBookOpen}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.8fr)]">
            <ContentBarChart
              data={contentChartData}
            />

            <PublicationDonut
              pages={dashboardSummary.pages}
            />
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              Son Blog Kaydı
            </p>

            <p className="mt-2 text-lg font-semibold text-stone-900">
              {dashboardSummary.latestPostTitle ||
                "Henüz blog yazısı yok"}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  featured = false,
}) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${
        featured
          ? "border-stone-900 bg-stone-900 text-[#63978f]"
          : "border-stone-200 bg-white text-[#63978f]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm ${
              featured
                ? "text-stone-300"
                : "text-stone-500"
            }`}
          >
            {title}
          </p>

          <p className="mt-3 text-4xl font-semibold">
            {value}
          </p>
        </div>

        <span
          className={`rounded-xl p-2.5 ${
            featured
              ? "bg-white/10 text-white"
              : "bg-stone-100 text-stone-600"
          }`}
        >
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>
      </div>

      <p className="mt-4 text-xs text-stone-400">
        {detail}
      </p>
    </article>
  );
}

function ContentBarChart({ data }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
        İçerik Dağılımı
      </p>

      <h2 className="mt-2 text-xl font-semibold text-stone-900">
        Kayıt Sayıları
      </h2>

      <div
        className="mt-5 h-72 w-full"
        aria-label="İçerik türlerine göre kayıt sayıları"
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={data}
            margin={{
              top: 8,
              right: 8,
              left: -22,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#e7e5e4"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#78716c",
                fontSize: 12,
              }}
            />

            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#78716c",
                fontSize: 12,
              }}
            />

            <Tooltip
              cursor={{
                fill: "#f5f5f4",
              }}
              formatter={(value) => [
                value,
                "Toplam",
              ]}
              contentStyle={{
                border:
                  "1px solid #e7e5e4",
                borderRadius: "12px",
                boxShadow:
                  "0 8px 24px rgba(28, 25, 23, 0.08)",
              }}
            />

            <Bar
              dataKey="value"
              fill="#292524"
              radius={[7, 7, 0, 0]}
              maxBarSize={58}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function PublicationDonut({ pages }) {
  const publishedCount =
    getPublishedPageCount(pages);

  const changedCount = pages.filter(
    (page) =>
      page.status === "published" &&
      page.hasUnpublishedChanges
  ).length;

  const draftCount = pages.filter(
    (page) => page.status !== "published"
  ).length;

  const currentPublishedCount = Math.max(
    0,
    publishedCount - changedCount
  );

  const publicationRate = pages.length
    ? Math.round(
        (publishedCount / pages.length) * 100
      )
    : 0;

  const statuses = [
    {
      name: "Güncel yayında",
      value: currentPublishedCount,
      color: donutColors.published,
    },
    {
      name: "Değişiklik bekliyor",
      value: changedCount,
      color: donutColors.changed,
    },
    {
      name: "Taslak",
      value: draftCount,
      color: donutColors.draft,
    },
  ];

  const chartData = pages.length
    ? statuses.filter(
        (status) => status.value > 0
      )
    : [
        {
          name: "Henüz sayfa yok",
          value: 1,
          color: "#e7e5e4",
        },
      ];

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
        Yayın Durumu
      </p>

      <h2 className="mt-2 text-xl font-semibold text-stone-900">
        Dinamik Sayfalar
      </h2>

      <div
        className="relative mx-auto mt-3 h-52 max-w-[240px]"
        aria-label="Sayfa yayın durumu"
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {chartData.map((item) => (
                <Cell
                  key={item.name}
                  fill={item.color}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => [
                `${value} sayfa`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-stone-900">
            %{publicationRate}
          </span>

          <span className="mt-1 text-xs text-stone-400">
            yayında
          </span>
        </div>
      </div>

      <div className="mt-2 space-y-3">
        {statuses.map((status) => (
          <div
            key={status.name}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-stone-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    status.color,
                }}
              />

              {status.name}
            </span>

            <span className="font-semibold text-stone-900">
              {status.value}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function getPublishedPageCount(pages) {
  return pages.filter(
    (page) => page.status === "published"
  ).length;
}

function DashboardLoading() {
  return (
    <div
      className="space-y-6"
      aria-label="Dashboard verileri yükleniyor"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-white"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-white xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}