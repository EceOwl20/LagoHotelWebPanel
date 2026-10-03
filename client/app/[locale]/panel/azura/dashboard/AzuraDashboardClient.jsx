"use client";

import { useEffect, useState } from "react";
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

import { AZURA_ROOM_DETAIL_CONFIGS } from "@/lib/admin/room-detail-model.mjs";
import { loadDashboardSections } from "@/lib/admin/azura-dashboard-loader.mjs";

const donutColors = {
  published: "#292524",
  changed: "#63978f",
  draft: "#d6d3d1",
};

const AZURA_CONTENT_COUNT =
  11 + Object.keys(AZURA_ROOM_DETAIL_CONFIGS).length;

const initialSections = () => Object.fromEntries(
  ["gallery", "posts", "pages"].map(key => [key, { data: null, error: "" }])
);

export default function AzuraDashboardClient({ azuraBlogVersion }) {
  const [sections, setSections] = useState(initialSections);
  useEffect(() => {
    const controller = new AbortController();
    setSections(initialSections());
    loadDashboardSections({
      version: azuraBlogVersion,
      signal: controller.signal,
      onResult: (key, result) => setSections(previous => ({ ...previous, [key]: result })),
    });
    return () => controller.abort();
  }, [azuraBlogVersion]);

  const { gallery, posts, pages } = sections;
  const imageCount = gallery.data?.reduce((total, category) => total + (category.images?.length || 0), 0);
  const chartData = [
    ...(pages.data ? [{ name: "Sayfalar", value: pages.data.length }] : []),
    { name: "İçerikler", value: AZURA_CONTENT_COUNT },
    ...(gallery.data ? [{ name: "Görseller", value: imageCount }] : []),
    ...(posts.data ? [{ name: "Blog", value: posts.data.length }] : []),
  ];
  const allReady = Object.values(sections).every(section => section.data !== null);
  const latest = posts.data?.[0];
  const latestTitle = latest?.translations?.tr?.title || latest?.translations?.en?.title ||
    latest?.translations?.de?.title || latest?.translations?.ru?.title || "Henüz blog yazısı yok";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Dashboard</p>
        <h1 className="text-2xl font-semibold text-stone-900">İçerik Genel Bakışı</h1>
        <p className="max-w-2xl text-sm leading-6 text-stone-600">
          Azura Deluxe Hotel sayfa, içerik, galeri ve blog verilerinin güncel durumunu tek ekrandan takip edebilirsiniz.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Dinamik Sayfa" value={pages.data?.length ?? "—"}
          detail={pages.data ? getPublishedPageCount(pages.data) + " yayında" : ""}
          state={pages} icon={FiFileText} featured />
        <StatCard title="İçerik Grubu" value={AZURA_CONTENT_COUNT} detail="4 dilde yönetiliyor" icon={FiGrid} />
        <StatCard title="Galeri Görseli" value={imageCount ?? "—"}
          detail={gallery.data ? gallery.data.length + " kategoride" : ""} state={gallery} icon={FiImage} />
        <StatCard title="Blog Yazısı" value={posts.data?.length ?? "—"}
          detail="Toplam kayıt" state={posts} icon={FiBookOpen} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.8fr)]">
        <ContentBarChart data={chartData} partial={!allReady} />
        {pages.data && posts.data ? (
          <PublicationDonut pages={pages.data} posts={posts.data} />
        ) : (
          <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">Sayfalar ve Blog — Yayın Durumu</h2>
            <p className="mt-3 text-sm text-stone-500">
              Yayın oranı için sayfa ve blog verilerinin ikisi de gerekli.
            </p>
            {!pages.data && <SectionStatus label="Sayfalar" state={pages} />}
            {!posts.data && <SectionStatus label="Blog" state={posts} />}
          </article>
        )}
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">Son Blog Kaydı</p>
        {posts.data ? <p className="mt-2 text-lg font-semibold text-stone-900">{latestTitle}</p>
          : <SectionStatus label="Blog" state={posts} />}
      </section>
    </div>
  );
}

function SectionStatus({ label, state }) {
  return <p role={state.error ? "alert" : "status"}
    className={"mt-3 text-xs " + (state.error ? "text-red-500" : "text-stone-400")}>
    {label}: {state.error || "Yükleniyor…"}
  </p>;
}

function StatCard({
  title,
  value,
  detail,
  state,
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

      {state && !state.data ? <SectionStatus label={title} state={state} /> : (
        <p className="mt-4 text-xs text-stone-400">{detail}</p>
      )}
    </article>
  );
}

function ContentBarChart({ data, partial }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
        İçerik Dağılımı
      </p>

      <h2 className="mt-2 text-xl font-semibold text-stone-900">
        Kayıt Sayıları
      </h2>

      {partial && <p role="status" className="mt-2 text-xs text-stone-500">
        Yalnız alınabilen veriler gösteriliyor; bekleyen veya hatalı bölümler sıfır olarak sayılmıyor.
      </p>}
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

function PublicationDonut({ pages, posts }) {
  const items = [...pages, ...posts];

  const publishedCount = items.filter(
    (item) => item.status === "published"
  ).length;

  const changedCount = items.filter(
    (item) =>
      item.status === "published" &&
      item.hasUnpublishedChanges
  ).length;

  const draftCount = items.filter(
    (item) => item.status !== "published"
  ).length;

  const currentPublishedCount = Math.max(
    0,
    publishedCount - changedCount
  );

  const publicationRate = items.length
    ? Math.round((publishedCount / items.length) * 100)
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

  const chartData = items.length
    ? statuses.filter((status) => status.value > 0)
    : [
        {
          name: "Henüz içerik yok",
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
        Sayfalar ve Blog
      </h2>

      <div
        className="relative mx-auto mt-3 h-52 max-w-[240px]"
        aria-label="Sayfa ve blog yayın durumu"
      >
        <ResponsiveContainer width="100%" height="100%">
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
                `${value} içerik`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-stone-900">
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
                  backgroundColor: status.color,
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
