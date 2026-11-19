import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Crown,
  Diamond,
  Flame,
  Gamepad2,
  Globe,
  Headphones,
  KeyRound,
  Laptop,
  LayoutGrid,
  ShieldCheck,
  ShoppingCart,
  Tv,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Product } from '../types/store';
import type { ActiveView } from './Navbar';
import { StorefrontFooter } from './StorefrontFooter';

type CategoryFilterId =
  | 'all'
  | 'PC Games'
  | 'Console Subscriptions'
  | 'Gift Cards'
  | 'Software Keys'
  | 'Security & VPN'
  | 'deals'
  | 'under25';

interface StorefrontViewProps {
  digitalProducts: Product[];
  servicesCount: number;
  liveChannelsCount: number;
  searchQuery: string;
  onClearSearch: () => void;
  onAddToCart: (sku: string) => void;
  onInspectProduct: (product: Product) => void;
  onSelectView: (view: ActiveView) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORY_TABS: Array<{
  id: CategoryFilterId;
  label: string;
  icon: typeof Gamepad2;
}> = [
  { id: 'PC Games', label: 'PC Game Keys', icon: Gamepad2 },
  { id: 'Console Subscriptions', label: 'Console & Pass', icon: Zap },
  { id: 'Gift Cards', label: 'Gift Cards', icon: CreditCard },
  { id: 'Software Keys', label: 'Software & OS', icon: Laptop },
  { id: 'Security & VPN', label: 'Security & VPN', icon: ShieldCheck },
  { id: 'deals', label: 'Top Deals 40%+', icon: Flame },
  { id: 'under25', label: 'Under $25 Keys', icon: KeyRound },
  { id: 'all', label: 'All Digital', icon: LayoutGrid },
];

export function StorefrontView({
  digitalProducts,
  servicesCount,
  liveChannelsCount,
  searchQuery,
  onClearSearch,
  onAddToCart,
  onInspectProduct,
  onSelectView,
  onShowToast,
}: StorefrontViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterId>('all');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return digitalProducts.filter((p) => {
      const matchesCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'deals'
            ? p.discountPercent >= 40
            : selectedCategory === 'under25'
              ? p.priceUsd <= 25
              : p.category === selectedCategory;

      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.publicCode || '').toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [digitalProducts, selectedCategory, searchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts;
  }, [filteredProducts]);

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all' && !searchQuery.trim()) {
      return `All ${filteredProducts.length} verified ElectronicFirst products available in the PlayBeat catalogue.`;
    }
    const found = CATEGORY_TABS.find((t) => t.id === selectedCategory);
    const catPart = found && selectedCategory !== 'all' ? found.label : 'All Digital Products';
    const searchPart = searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : '';
    return `Showing ${filteredProducts.length} products in ${catPart}${searchPart}.`;
  }, [selectedCategory, searchQuery, filteredProducts.length]);

  const handleCategoryClick = (id: CategoryFilterId) => {
    setSelectedCategory(id);
    const el = document.getElementById('digital-products-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* ══════════════ HERO SECTION (Landing Page: Digital Store & Products) ══════════════ */}
      <section className="relative overflow-hidden -mt-16 pt-16">
        <svg
          className="absolute left-0 top-12 w-full h-20 pointer-events-none"
          viewBox="0 0 1240 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 40C260 85 520 25 1240 8"
            fill="none"
            stroke="#3b8bff"
            strokeWidth="1.6"
            opacity=".7"
          />
        </svg>

        <img
          src="/assets/playbeat/hero-wave.webp"
          width={1024}
          height={60}
          alt=""
          className="absolute inset-x-0 bottom-0 w-full h-[130px] object-fill pointer-events-none brightness-125 saturate-150"
        />

        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.25fr_1fr] gap-4 items-center pt-8 pb-20 relative z-10">
          <div>
            <p className="text-[12px] sm:text-[13px] font-semibold tracking-wide text-[#f2f6ff]">
              PLAYBEAT DIGITAL STORE &amp; WORLDWIDE PRODUCTS
            </p>
            <h1 className="chrome italic font-extrabold leading-[1.08] tracking-tight mt-3 text-[clamp(1.85rem,7vw,2.3rem)] lg:text-[clamp(2rem,3.3vw,2.45rem)] lg:whitespace-nowrap">
              YOUR WORLD OF
              <br />
              DIGITAL POSSIBILITIES
            </h1>
            <p className="mt-4 text-[13px] font-medium text-[#f2f6ff]">
              PC Game Keys &nbsp;•&nbsp; Console Passes &nbsp;•&nbsp; Gift Cards &nbsp;•&nbsp; Software &nbsp;•&nbsp; Security
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#c8d3ea]">
              Instant checkout via Rapid Gateway PKR (JazzCash, EasyPaisa, Bank), PayPal USD, or Manual Transfer.
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-3 mt-5 text-[11px] font-medium">
              <span className="flex items-center gap-2">
                <i className="w-9 h-9 rounded-full border border-[#1ea0ff] bg-[#07163f] grid place-items-center text-[#ffc928] not-italic">
                  <ShieldCheck className="w-[18px] h-[18px]" aria-hidden="true" />
                </i>
                <span className="leading-tight">
                  Verified
                  <br />
                  Partners
                </span>
              </span>
              <span className="flex items-center gap-2">
                <i className="w-9 h-9 rounded-full border border-[#1ea0ff] bg-[#07163f] grid place-items-center text-[#ffc928] not-italic">
                  <Zap className="w-[18px] h-[18px]" aria-hidden="true" />
                </i>
                <span className="leading-tight">
                  Instant
                  <br />
                  Delivery
                </span>
              </span>
              <span className="flex items-center gap-2">
                <i className="w-9 h-9 rounded-full border border-[#1ea0ff] bg-[#07163f] grid place-items-center text-[#ffc928] not-italic">
                  <Globe className="w-[18px] h-[18px]" aria-hidden="true" />
                </i>
                <span className="leading-tight">
                  100%
                  <br />
                  Worldwide
                </span>
              </span>
              <span className="flex items-center gap-2">
                <i className="w-9 h-9 rounded-full border border-[#1ea0ff] bg-[#07163f] grid place-items-center text-[#ffc928] not-italic">
                  <Headphones className="w-[18px] h-[18px]" aria-hidden="true" />
                </i>
                <span className="leading-tight">
                  24/7
                  <br />
                  Support
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                              document.getElementById('digital-products-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="yb rounded-full px-7 h-10 inline-flex items-center text-[13px] font-bold"
              >
                Explore Products &nbsp;→
              </button>
              <button
                type="button"
                onClick={() => onSelectView('business-services')}
                className="ob rounded-full px-6 h-10 inline-flex items-center gap-1.5 text-[12.5px] font-bold bg-[#030a1f66] hover:bg-[#0b2a8a66] transition-colors cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#ffd958]" />
                Business Services
              </button>
              <button
                type="button"
                onClick={() => onSelectView('live-tv')}
                className="ob rounded-full px-6 h-10 inline-flex items-center gap-1.5 text-[12.5px] font-bold bg-[#030a1f66] hover:bg-[#0b2a8a66] transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                LIVE TV
              </button>
            </div>
          </div>

          <img
            src="/assets/playbeat/hero-showcase.webp"
            width={498}
            height={347}
            alt="Playbeat Digital worldwide storefront showcase"
            className="w-full max-w-[460px] mx-auto lg:ml-auto lg:mr-0 drop-shadow-[0_0_24px_rgba(30,160,255,0.28)]"
          />
        </div>
      </section>

      {/* ══════════════ PAGE 1 BODY: DIGITAL STORE & PRODUCTS ══════════════ */}
      <main id="main" className="max-w-[1180px] mx-auto px-4 sm:px-6 relative z-10 -mt-14">
        {/* 8-Column Glowing Category Bar */}
        <nav
          id="categories"
          aria-label="Digital product categories"
          className="edge rounded-2xl grid grid-cols-4 lg:grid-cols-8 p-1.5 gap-1"
        >
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryClick(tab.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`flex flex-col items-center justify-center gap-2 py-3.5 px-1 text-[11px] sm:text-xs font-semibold text-center rounded-xl transition-colors cursor-pointer ${
                  isActive ? 'cat-active text-white' : 'hover:bg-[#0b2a8a66] text-[#e6eeff]'
                }`}
              >
                <Icon className="w-6 h-6 text-[#1ea0ff]" aria-hidden="true" />
                <span className="leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Digital Products Grid (Affiliate Partner Catalog) */}
        <section id="digital-products-grid" className="scroll-mt-20">
          <div className="flex flex-wrap justify-between items-end mt-10 gap-4">
            <div>
              <p className="text-[#ffc928] text-[12px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-[#ffd958]" aria-hidden="true" />
                PLAYBEAT DIGITAL · VERIFIED DIGITAL CATALOGUE
              </p>
              <h2 className="text-[clamp(1.7rem,5vw,2.5rem)] font-extrabold leading-tight mt-1">
                All Digital <span className="text-[#1ea0ff]">Products</span>
              </h2>
              <p className="mt-1 text-sm font-medium text-[#c8d3ea]">{activeCategoryLabel}</p>
            </div>
            <div className="flex items-center gap-4">
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="edge rounded-xl p-8 mt-5 text-center text-sm">
              <p className="text-[#c8d3ea]">
                No Playbeat Digital products matched your current filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  onClearSearch();
                }}
                className="mt-3 text-[#1ea0ff] font-bold underline cursor-pointer"
              >
                Show all Playbeat Digital products
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-3 mt-5 ${
                'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
              {displayedProducts.map((product) => {
                return (
                  <article
                    key={product.sku}
                    className="edge rounded-xl flex flex-col items-center text-center px-2.5 pt-3 pb-3.5 group hover:border-[#2f8bff] transition-all"
                  >
                    <div className="w-full flex items-center justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-[#1ea0ff] truncate max-w-[62%]">{product.platform}</span>
                      {product.discountPercent > 0 && (
                        <span className="rounded bg-[#ffd958]/15 border border-[#ffd958]/40 px-1.5 py-0.5 text-[#ffd958] font-mono tabular-nums">
                          -{product.discountPercent}%
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onInspectProduct(product)}
                      className="w-full rounded-lg overflow-hidden bg-[#040e2e] border border-[#1d4ed855] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffc928]"
                      aria-label={`View details for ${product.name}`}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={`w-full ${
                          'h-[126px]'
                        } object-cover group-hover:scale-105 transition-transform duration-300`}
                        loading="lazy"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onInspectProduct(product)}
                      className="font-semibold text-[12.5px] leading-snug mt-2.5 text-[#f2f6ff] hover:text-[#1ea0ff] line-clamp-2 min-h-[34px] cursor-pointer"
                    >
                      {product.name}
                    </button>

                    <p className="text-[10.5px] text-[#c8d3ea] mt-1 mb-2">
                      {product.region} • {product.stockStatus}
                    </p>

                    <div className="mb-2.5">
                      <div className="flex items-baseline justify-center gap-1.5 font-mono tabular-nums">
                        <span className="text-[#ffd958] font-extrabold text-[15px]">
                          ${product.priceUsd.toFixed(2)}
                        </span>
                        {product.originalPriceUsd > product.priceUsd && (
                          <span className="text-[10.5px] text-[#9eb2db] line-through">
                            ${product.originalPriceUsd.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-[#c8d3ea] font-mono tabular-nums">
                        ≈ ₨{product.pricePkr.toLocaleString()} PKR
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToCart(product.sku)}
                      className="yb rounded-full px-4 py-1.5 text-[11px] font-bold mt-auto inline-flex items-center justify-center gap-1.5 w-full max-w-[140px]"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                      Buy Now
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Dedicated Page Cards to Navigate to Page 2 (Business Services) & Page 3 (LIVE TV) */}
        <section className="grid md:grid-cols-2 gap-4 mt-10">
          <div className="edge rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-[#2f8bff] transition-all">
            <div>
              <p className="text-[10.5px] font-bold text-[#ffd958] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                PLAYBEAT.DIGITAL/SERVICES
              </p>
              <h3 className="text-lg font-extrabold text-[#f2f6ff] mt-1">
                Playbeat Business Services
              </h3>
              <p className="text-xs text-[#c8d3ea] mt-1">
                Browse {servicesCount} enterprise websites, e-commerce stores, CRM dashboards &amp; automation packages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectView('business-services')}
              className="yb rounded-full px-5 h-9 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
            >
              Open Services
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="edge rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-[#2f8bff] transition-all">
            <div>
              <p className="text-[10.5px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-[#ffd958]" />
                EMBEDDED HD STREAMING
              </p>
              <h3 className="text-lg font-extrabold text-[#f2f6ff] mt-1">
                Playbeat LIVE TV
              </h3>
              <p className="text-xs text-[#c8d3ea] mt-1">
                Watch {liveChannelsCount} live broadcast channels directly inside the embedded HD player + 4K streaming passes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectView('live-tv')}
              className="ob rounded-full px-5 h-9 text-xs font-bold bg-[#061236] hover:bg-[#0b2a8a] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              Watch LIVE TV
              <ArrowRight className="w-3.5 h-3.5 text-[#ffd958]" />
            </button>
          </div>
        </section>

        {/* Promotional Banner ("Premium Access Worldwide") */}
        <section className="edge rounded-2xl mt-8 p-6 grid lg:grid-cols-[1fr_1.4fr_.8fr] gap-6 items-center">
          <div>
            <p className="text-[#ffc928] text-[11px] font-bold tracking-wide">
              INSTANT WORLDWIDE ACCESS
            </p>
            <h2 className="text-[26px] sm:text-[28px] font-extrabold leading-[1.1] mt-1">
              Premium Access
              <br />
              Worldwide
            </h2>
            <p className="text-[11.5px] font-medium text-[#c8d3ea] my-3 leading-[1.5]">
              Shop verified Worldwide digital keys with instant delivery via Rapid Gateway PKR, PayPal International, and Manual checkout.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setShowAllGrid(true);
                document.getElementById('digital-products-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="yb rounded-full px-6 h-8 inline-flex items-center text-[12px] font-bold"
            >
              Browse All Keys &nbsp;→
            </button>
          </div>

          <img
            src="/assets/playbeat/promo-showcase.webp"
            width={443}
            height={169}
            alt="Playbeat Digital worldwide access"
            className="w-full max-w-[420px] mx-auto object-contain"
            loading="lazy"
          />

          <ul className="space-y-3">
            {[
              '100% Genuine Worldwide Keys',
              'Instant Digital Key Delivery',
              'Rapid Gateway PKR & PayPal USD',
              'Verified PlayBeat Retail Pricing',
              '24/7 Playbeat Customer Support',
            ].map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-[13px]">
                <span className="text-[#ffc928] shrink-0">
                  <CheckCircle2 className="w-[18px] h-[18px]" aria-hidden="true" />
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 4-Stat Trust Bar */}
        <section className="edge rounded-2xl mt-5 py-3 grid grid-cols-2 lg:grid-cols-4 gap-y-3">
          <div className="flex items-center justify-center gap-3 py-2 lg:border-r border-[#1d4ed866]">
            <span className="text-[#ffc928]">
              <Users className="w-9 h-9" aria-hidden="true" />
            </span>
            <div>
              <b className="block text-xl leading-tight font-mono tabular-nums">100K+</b>
              <span className="text-[11px] text-[#c8d3ea]">Happy Customers</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-2 lg:border-r border-[#1d4ed866]">
            <span className="text-[#ffc928]">
              <Globe className="w-9 h-9" aria-hidden="true" />
            </span>
            <div>
              <b className="block text-xl leading-tight font-mono tabular-nums">180+</b>
              <span className="text-[11px] text-[#c8d3ea]">Countries Covered</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-2 lg:border-r border-[#1d4ed866]">
            <span className="text-[#ffc928]">
              <Zap className="w-9 h-9" aria-hidden="true" />
            </span>
            <div>
              <b className="block text-xl leading-tight font-mono tabular-nums">99%</b>
              <span className="text-[11px] text-[#c8d3ea]">Positive Reviews</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="text-[#ffc928]">
              <ShieldCheck className="w-9 h-9" aria-hidden="true" />
            </span>
            <div>
              <b className="block text-xl leading-tight font-mono tabular-nums">100%</b>
              <span className="text-[11px] text-[#c8d3ea]">Secure &amp; Guaranteed</span>
            </div>
          </div>
        </section>

        {/* Why Choose Playbeat? 6-Card Grid */}
        <section id="about" className="grid lg:grid-cols-[.9fr_2.2fr] gap-6 items-center mt-8">
          <div>
            <p className="text-[#ffc928] text-[11px] font-bold tracking-wide">
              WHY CHOOSE PLAYBEAT?
            </p>
            <h2 className="text-2xl font-extrabold leading-[1.1] mt-1">
              Built for a Smarter
              <br />
              Digital Life
            </h2>
            <p className="text-[11.5px] font-medium text-[#c8d3ea] my-3 leading-[1.5]">
              Shop Worldwide digital keys, book enterprise business services, and watch Playbeat LIVE TV all in one unified storefront.
            </p>
            <button
              type="button"
              onClick={() => onSelectView('business-services')}
              className="yb rounded-full px-5 h-[32px] inline-flex items-center text-[11px] font-bold"
            >
              Explore Business Services &nbsp;→
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: Crown, title: 'Premium Quality', desc: '100% verified Worldwide keys' },
              { icon: Zap, title: 'Instant Delivery', desc: 'Keys issued immediately' },
              { icon: ShieldCheck, title: 'Multi-Rail Checkout', desc: 'Rapid PKR, PayPal & Manual' },
              { icon: Headphones, title: '24/7 Support', desc: 'Dedicated Playbeat desk' },
              { icon: UserCheck, title: 'Business Agency', desc: '32 enterprise service packages' },
              { icon: Diamond, title: 'Best Prices', desc: 'Direct affiliate partner savings' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="edge rounded-xl p-4 flex items-center gap-3">
                  <span className="text-[#ffc928] shrink-0">
                    <Icon className="w-7 h-7" aria-hidden="true" />
                  </span>
                  <div>
                    <b className="block text-[13px]">{card.title}</b>
                    <span className="text-[11px] text-[#c8d3ea]">{card.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <StorefrontFooter
        currentPage="digital-store"
        onSelectView={onSelectView}
        onShowToast={onShowToast}
      />
    </>
  );
}
